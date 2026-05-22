from __future__ import annotations

import argparse
import csv
import json
import shutil
import time
import unicodedata
from collections import defaultdict
from pathlib import Path
from typing import Any

import requests


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-url", default="http://127.0.0.1:8000")
    parser.add_argument("--dataset-root", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--cam", default="cam_1")
    parser.add_argument("--num-words", type=int, default=5)
    parser.add_argument("--correct-per-word", type=int, default=2)
    parser.add_argument("--wrong-per-word", type=int, default=2)
    parser.add_argument("--frame-stride", type=int, default=2)
    parser.add_argument("--max-frames", type=int, default=48)
    parser.add_argument("--auto-segment", action=argparse.BooleanOptionalAction, default=True)
    parser.add_argument("--segment-min-frames", type=int, default=12)
    parser.add_argument("--segment-max-frames", type=int, default=None)
    parser.add_argument("--segment-pad-frames", type=int, default=8)
    return parser.parse_args()


def ascii_slug(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    cleaned = "".join(ch.lower() if ch.isalnum() else "_" for ch in ascii_text)
    cleaned = "_".join(part for part in cleaned.split("_") if part)
    return cleaned or "gloss"


def console_text(text: str) -> str:
    return text.encode("unicode_escape").decode("ascii")


def load_rows_by_gloss(dataset_root: Path, cam: str) -> dict[str, list[dict[str, Any]]]:
    rows = json.loads((dataset_root / f"{cam}.json").read_text(encoding="utf-8"))
    by_gloss: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        video_id = row["video_id"]
        video_path = dataset_root / cam / f"{video_id}.mp4"
        if video_path.exists():
            by_gloss[row["gloss"]].append(row)
    return by_gloss


def select_rows(rows: list[dict[str, Any]], count: int, start: int) -> list[dict[str, Any]]:
    if len(rows) < count:
        raise RuntimeError(f"Need {count} rows, got {len(rows)}")
    if len(rows) >= start + count:
        return rows[start : start + count]
    return rows[-count:]


def call_api(
    api_url: str,
    target_gloss: str,
    video_path: Path,
    frame_stride: int,
    max_frames: int,
    auto_segment: bool,
    segment_min_frames: int,
    segment_max_frames: int | None,
    segment_pad_frames: int,
) -> dict[str, Any]:
    data = {
        "target_gloss": target_gloss,
        "return_visualization": "true",
        "frame_stride": str(frame_stride),
        "max_frames": str(max_frames),
        "auto_segment": "true" if auto_segment else "false",
        "segment_min_frames": str(segment_min_frames),
        "segment_pad_frames": str(segment_pad_frames),
    }
    if segment_max_frames is not None:
        data["segment_max_frames"] = str(segment_max_frames)
    with video_path.open("rb") as handle:
        response = requests.post(
            f"{api_url.rstrip('/')}/practice-i/analyze-video",
            data=data,
            files={"video": (video_path.name, handle, "video/mp4")},
            timeout=240,
        )
    response.raise_for_status()
    return response.json()


def main() -> None:
    args = parse_args()
    dataset_root = Path(args.dataset_root)
    out_dir = Path(args.out_dir)
    inputs_dir = out_dir / "inputs"
    responses_dir = out_dir / "responses"
    for path in (inputs_dir, responses_dir):
        path.mkdir(parents=True, exist_ok=True)

    health = requests.get(f"{args.api_url.rstrip('/')}/health", timeout=10).json()
    glosses = requests.get(f"{args.api_url.rstrip('/')}/glosses", timeout=10).json()["glosses"]
    selected_glosses = glosses[: args.num_words]
    rows_by_gloss = load_rows_by_gloss(dataset_root, args.cam)

    summary_rows: list[dict[str, Any]] = []
    started = time.time()

    for word_idx, target_gloss in enumerate(selected_glosses):
        target_slug = f"{word_idx:02d}_{ascii_slug(target_gloss)}"
        input_word_dir = inputs_dir / target_slug
        input_word_dir.mkdir(parents=True, exist_ok=True)

        correct_rows = select_rows(rows_by_gloss[target_gloss], args.correct_per_word, start=45)
        wrong_gloss = selected_glosses[(word_idx + 1) % len(selected_glosses)]
        wrong_rows = select_rows(rows_by_gloss[wrong_gloss], args.wrong_per_word, start=45)

        cases = [
            *[("correct", target_gloss, row) for row in correct_rows],
            *[("wrong", wrong_gloss, row) for row in wrong_rows],
        ]

        for case_idx, (case_type, actual_gloss, row) in enumerate(cases):
            video_id = row["video_id"]
            video_path = dataset_root / args.cam / f"{video_id}.mp4"
            case_name = f"{case_idx:02d}_{case_type}_actual_{ascii_slug(actual_gloss)}_{video_id}"
            copied_input = input_word_dir / f"{case_name}.mp4"
            shutil.copy2(video_path, copied_input)

            response = call_api(
                args.api_url,
                target_gloss,
                video_path,
                frame_stride=args.frame_stride,
                max_frames=args.max_frames,
                auto_segment=args.auto_segment,
                segment_min_frames=args.segment_min_frames,
                segment_max_frames=args.segment_max_frames,
                segment_pad_frames=args.segment_pad_frames,
            )
            response_path = responses_dir / f"{target_slug}_{case_name}.json"
            response_path.write_text(json.dumps(response, ensure_ascii=False, indent=2), encoding="utf-8")

            decision = response["decision"]
            expected_accept = case_type == "correct"
            actual_accept = bool(decision["accept_as_target"] and not decision["possible_wrong_word"])
            passed = actual_accept == expected_accept
            top3 = response.get("top3_bank_matches", [])
            feedback = response.get("feedback", {})
            summary_rows.append(
                {
                    "target_gloss": target_gloss,
                    "case_type": case_type,
                    "actual_gloss": actual_gloss,
                    "video_id": video_id,
                    "expected_color": "green" if expected_accept else "red",
                    "decision_color": "green" if actual_accept else "red",
                    "passed": passed,
                    "score": feedback.get("score"),
                    "frames_scored": response.get("frames_scored"),
                    "segment_start_source_frame": (response.get("segment") or {}).get("start_source_frame"),
                    "segment_end_source_frame": (response.get("segment") or {}).get("end_source_frame"),
                    "target_rank": response.get("target_rank"),
                    "accept_as_target": decision.get("accept_as_target"),
                    "possible_wrong_word": decision.get("possible_wrong_word"),
                    "top1_gloss": top3[0]["gloss"] if top3 else None,
                    "top1_score": top3[0]["score"] if top3 else None,
                    "component_body_bad": feedback.get("component_bad_fraction", {}).get("body"),
                    "component_left_hand_bad": feedback.get("component_bad_fraction", {}).get("left_hand"),
                    "component_right_hand_bad": feedback.get("component_bad_fraction", {}).get("right_hand"),
                    "input_video": str(copied_input),
                    "response_json": str(response_path),
                }
            )
            print(
                f"{console_text(target_gloss)} | {case_type} "
                f"actual={console_text(actual_gloss)} video={video_id} -> {'PASS' if passed else 'FAIL'}"
            )

    summary = {
        "api_health": health,
        "selected_glosses": selected_glosses,
        "cam": args.cam,
        "frame_stride": args.frame_stride,
        "max_frames": args.max_frames,
        "auto_segment": args.auto_segment,
        "segment_min_frames": args.segment_min_frames,
        "segment_max_frames": args.segment_max_frames,
        "segment_pad_frames": args.segment_pad_frames,
        "total_cases": len(summary_rows),
        "passed_cases": sum(1 for row in summary_rows if row["passed"]),
        "failed_cases": sum(1 for row in summary_rows if not row["passed"]),
        "elapsed_seconds": round(time.time() - started, 3),
        "rows": summary_rows,
    }
    (out_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    with (out_dir / "summary.csv").open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(summary_rows[0].keys()))
        writer.writeheader()
        writer.writerows(summary_rows)

    print(json.dumps({k: summary[k] for k in ("total_cases", "passed_cases", "failed_cases", "elapsed_seconds")}, indent=2))


if __name__ == "__main__":
    main()

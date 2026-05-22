from __future__ import annotations

import argparse
import json
import time
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import numpy as np
import requests


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-url", default="http://127.0.0.1:8010")
    parser.add_argument("--dataset-root", default="All_cam1")
    parser.add_argument("--metadata-path", default="")
    parser.add_argument(
        "--manifest-path",
        default="outputs/reference_bank_30_unique_video_ref20_template/reference_bank_manifest.json",
    )
    parser.add_argument("--out-dir", default="tests/all_cam1_api")
    parser.add_argument("--frame-stride", type=int, default=2)
    parser.add_argument("--segment-min-frames", type=int, default=12)
    parser.add_argument("--segment-pad-frames", type=int, default=8)
    parser.add_argument("--segment-max-frames", type=int, default=80)
    parser.add_argument("--overlay-frame-count", type=int, default=24)
    parser.add_argument("--p1-correct-per-gloss", type=int, default=2)
    parser.add_argument("--p1-wrong-per-gloss", type=int, default=1)
    parser.add_argument("--p2-correct-per-gloss", type=int, default=1)
    parser.add_argument("--p2-wrong-per-gloss", type=int, default=1)
    parser.add_argument("--classifier-top-k", type=int, default=3)
    parser.add_argument("--wrong-word-min-lesson-score", type=float, default=0.45)
    parser.add_argument("--wrong-word-min-margin", type=float, default=0.10)
    parser.add_argument(
        "--suites",
        default="practice_i_all,practice_ii_topic10,practice_ii_topic5",
        help="Comma-separated suite names to run.",
    )
    parser.add_argument("--check-reference-routes", action="store_true")
    return parser.parse_args()


def ascii_slug(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    cleaned = "".join(ch.lower() if ch.isalnum() else "_" for ch in ascii_text)
    cleaned = "_".join(part for part in cleaned.split("_") if part)
    return cleaned or "item"


def compact_top_k(top_k: list[dict[str, Any]] | None, limit: int = 3) -> list[dict[str, Any]]:
    if not top_k:
        return []
    out: list[dict[str, Any]] = []
    for item in top_k[:limit]:
        out.append(
            {
                "gloss": item.get("gloss"),
                "score": round(float(item.get("score", 0.0)), 4) if "score" in item else None,
                "lesson_score": round(float(item.get("lesson_score", 0.0)), 4) if "lesson_score" in item else None,
                "raw_score": round(float(item.get("raw_score", 0.0)), 4) if "raw_score" in item else None,
            }
        )
    return out


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_manifest(manifest_path: Path) -> tuple[list[str], list[dict[str, Any]], dict[str, set[str]]]:
    manifest = load_json(manifest_path)
    glosses = [item["gloss"] for item in manifest["glosses"]]
    reference_ids = {
        item["gloss"]: set(str(video_id) for video_id in item.get("reference_ids", []))
        for item in manifest["glosses"]
    }
    return glosses, manifest.get("topics", []), reference_ids


def load_rows(dataset_root: Path, metadata_path: Path) -> dict[str, list[dict[str, Any]]]:
    rows = load_json(metadata_path)
    by_gloss: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        video_path = dataset_root / f"{row['video_id']}.mp4"
        if video_path.exists():
            item = dict(row)
            item["video_path"] = str(video_path)
            by_gloss[row["gloss"]].append(item)
    for gloss_rows in by_gloss.values():
        gloss_rows.sort(key=lambda row: row["video_id"])
    return by_gloss


def choose_rows(rows: list[dict[str, Any]], count: int, forbidden_ids: set[str]) -> list[dict[str, Any]]:
    preferred = [row for row in rows if row["video_id"] not in forbidden_ids]
    pool = preferred if len(preferred) >= count else rows
    if len(pool) < count:
        raise RuntimeError(f"Need {count} rows but only found {len(pool)}")
    return pool[:count]


def build_topic_maps(topics: list[dict[str, Any]]) -> tuple[dict[str, list[str]], dict[str, list[str]]]:
    topic10: dict[str, list[str]] = {}
    topic5: dict[str, list[str]] = {}
    for topic in topics:
        glosses = [str(item) for item in topic.get("glosses", [])]
        chunks10 = [glosses[i:i + 10] for i in range(0, len(glosses), 10)]
        for chunk in chunks10:
            if len(chunk) < 2:
                continue
            for gloss in chunk:
                topic10[gloss] = chunk
        chunks5 = [glosses[i:i + 5] for i in range(0, len(glosses), 5)]
        for chunk in chunks5:
            if len(chunk) < 2:
                continue
            for gloss in chunk:
                topic5[gloss] = chunk
    return topic10, topic5


def pair_wrong_glosses(topic_map: dict[str, list[str]]) -> dict[str, str]:
    pairs: dict[str, str] = {}
    for gloss, lesson in topic_map.items():
        idx = lesson.index(gloss)
        pairs[gloss] = lesson[(idx + 1) % len(lesson)]
    return pairs


def post_video(
    api_url: str,
    endpoint: str,
    video_path: Path,
    form_data: dict[str, str],
) -> tuple[dict[str, Any], float, int]:
    with video_path.open("rb") as handle:
        started = time.perf_counter()
        response = requests.post(
            f"{api_url.rstrip('/')}/{endpoint.lstrip('/')}",
            data=form_data,
            files={"video": (video_path.name, handle, "video/mp4")},
            timeout=240,
        )
    elapsed_ms = (time.perf_counter() - started) * 1000.0
    response.raise_for_status()
    return response.json(), elapsed_ms, len(response.content)


def compact_common(response: dict[str, Any]) -> dict[str, Any]:
    decision = response.get("decision", {})
    feedback = response.get("feedback", {})
    segment = response.get("segment", {})
    top3 = response.get("top3_bank_matches", [])
    return {
        "score": round(float(response.get("score", 0.0)), 3),
        "target_rank": response.get("target_rank"),
        "decision": decision,
        "top3_bank_matches": compact_top_k(top3, limit=3),
        "segment": {
            "frame_count": segment.get("frame_count"),
            "start_ms": segment.get("start_ms"),
            "end_ms": segment.get("end_ms"),
            "reason": segment.get("reason"),
        },
        "feedback": {
            "overall": feedback.get("overall"),
            "main_errors": feedback.get("main_errors", [])[:3],
        },
    }


def evaluate_practice_i(case_type: str, response: dict[str, Any]) -> tuple[bool, dict[str, Any]]:
    decision = response["decision"]
    clean_accept = bool(decision.get("accept_as_target") and not decision.get("possible_wrong_word"))
    if case_type == "correct":
        passed = bool(decision.get("accept_as_target"))
    else:
        passed = not clean_accept
    return passed, {"clean_accept": clean_accept}


def evaluate_practice_ii(case_type: str, response: dict[str, Any], actual_gloss: str) -> tuple[bool, dict[str, Any]]:
    decision = response["decision"]
    wrong_word_detected = bool(decision.get("wrong_word_detected"))
    accept_as_target = bool(decision.get("accept_as_target"))
    predicted_wrong_gloss = decision.get("predicted_wrong_gloss")
    if case_type == "correct":
        passed = accept_as_target and not wrong_word_detected
    else:
        passed = wrong_word_detected
    diagnostics = {
        "wrong_word_detected": wrong_word_detected,
        "predicted_wrong_gloss_matches_actual": predicted_wrong_gloss == actual_gloss,
    }
    return passed, diagnostics


def build_form_data(
    target_gloss: str,
    lesson_glosses: list[str] | None,
    args: argparse.Namespace,
) -> dict[str, str]:
    data = {
        "target_gloss": target_gloss,
        "frame_stride": str(args.frame_stride),
        "auto_segment": "true",
        "segment_min_frames": str(args.segment_min_frames),
        "segment_pad_frames": str(args.segment_pad_frames),
        "segment_max_frames": str(args.segment_max_frames),
        "overlay_frame_count": str(args.overlay_frame_count),
        "return_visualization": "false",
    }
    if lesson_glosses is not None:
        data["lesson_glosses"] = ",".join(lesson_glosses)
    return data


def run_suite(
    *,
    suite_name: str,
    api_url: str,
    endpoint: str,
    cases: list[dict[str, Any]],
    args: argparse.Namespace,
) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    started = time.time()
    for idx, case in enumerate(cases, start=1):
        response, elapsed_ms, response_bytes = post_video(
            api_url,
            endpoint,
            Path(case["video_path"]),
            build_form_data(case["target_gloss"], case.get("lesson_glosses"), args),
        )
        if endpoint == "practice-i/analyze-video":
            passed, diagnostics = evaluate_practice_i(case["case_type"], response)
        else:
            passed, diagnostics = evaluate_practice_ii(case["case_type"], response, case["actual_gloss"])

        compact = compact_common(response)
        classifier = response.get("classifier") if endpoint == "practice-ii/analyze-video" else None
        playback = response.get("playback", {})
        overlay = response.get("overlay", {})
        segment = response.get("segment", {})
        segment_duration_ms = None
        if segment.get("start_ms") is not None and segment.get("end_ms") is not None:
            segment_duration_ms = int(segment["end_ms"]) - int(segment["start_ms"])
        clip_length_ms = int(round(float(case.get("length", 0.0)) * 1000.0)) if case.get("length") is not None else None
        segment_ratio = (
            round(float(segment_duration_ms) / max(clip_length_ms, 1), 4)
            if segment_duration_ms is not None and clip_length_ms
            else None
        )
        payload_valid = bool(
            playback.get("strategy") == "frontend_seeks_segment_and_draws_progress_overlay"
            and isinstance(overlay.get("user_frames"), list)
            and isinstance(overlay.get("reference_frames"), list)
            and int(overlay.get("frame_count", 0)) == len(overlay.get("user_frames", [])) == len(overlay.get("reference_frames", []))
            and int(overlay.get("frame_count", 0)) == len(overlay.get("bad_joint_indices", []))
            and response.get("reference", {}).get("display_video", {}).get("video_url")
            and segment.get("start_ms") is not None
            and segment.get("end_ms") is not None
            and int(segment.get("end_ms", 0)) > int(segment.get("start_ms", 0))
        )
        result = {
            **case,
            "suite": suite_name,
            "passed": passed,
            "diagnostics": diagnostics,
            "perf": {
                "request_ms": round(float(elapsed_ms), 3),
                "response_bytes": int(response_bytes),
                "segment_duration_ms": segment_duration_ms,
                "clip_length_ms": clip_length_ms,
                "segment_ratio": segment_ratio,
                "payload_valid": payload_valid,
            },
            "response": compact,
        }
        if classifier is not None:
            result["classifier"] = {
                "predicted_gloss": classifier.get("predicted_gloss"),
                "top_k": compact_top_k(classifier.get("top_k"), limit=3),
            }
        results.append(result)
        print(
            f"[{suite_name}] {idx}/{len(cases)} target={ascii_slug(case['target_gloss'])} "
            f"actual={ascii_slug(case['actual_gloss'])} type={case['case_type']} "
            f"video={case['video_id']} -> {'PASS' if passed else 'FAIL'} "
            f"score={compact['score']} ms={round(float(elapsed_ms), 1)} bytes={response_bytes}"
        )
    elapsed = round(time.time() - started, 3)
    passed_count = sum(1 for item in results if item["passed"])
    print(f"[{suite_name}] done: {passed_count}/{len(results)} passed in {elapsed}s")
    return results


def build_practice_i_cases(
    glosses: list[str],
    rows_by_gloss: dict[str, list[dict[str, Any]]],
    reference_ids: dict[str, set[str]],
    wrong_map: dict[str, str],
    correct_per_gloss: int,
    wrong_per_gloss: int,
) -> list[dict[str, Any]]:
    cases: list[dict[str, Any]] = []
    for gloss in glosses:
        for row in choose_rows(rows_by_gloss[gloss], correct_per_gloss, reference_ids[gloss]):
            cases.append(
                {
                    "target_gloss": gloss,
                    "actual_gloss": gloss,
                    "case_type": "correct",
                    "video_id": row["video_id"],
                    "video_path": row["video_path"],
                    "length": row.get("length"),
                    "lesson_glosses": None,
                }
            )
        wrong_gloss = wrong_map[gloss]
        for row in choose_rows(rows_by_gloss[wrong_gloss], wrong_per_gloss, reference_ids[wrong_gloss]):
            cases.append(
                {
                    "target_gloss": gloss,
                    "actual_gloss": wrong_gloss,
                    "case_type": "wrong",
                    "video_id": row["video_id"],
                    "video_path": row["video_path"],
                    "length": row.get("length"),
                    "lesson_glosses": None,
                }
            )
    return cases


def build_practice_ii_cases(
    glosses: list[str],
    rows_by_gloss: dict[str, list[dict[str, Any]]],
    reference_ids: dict[str, set[str]],
    lesson_map: dict[str, list[str]],
    wrong_map: dict[str, str],
    correct_per_gloss: int,
    wrong_per_gloss: int,
) -> list[dict[str, Any]]:
    cases: list[dict[str, Any]] = []
    for gloss in glosses:
        lesson_glosses = lesson_map[gloss]
        for row in choose_rows(rows_by_gloss[gloss], correct_per_gloss, reference_ids[gloss]):
            cases.append(
                {
                    "target_gloss": gloss,
                    "actual_gloss": gloss,
                    "case_type": "correct",
                    "video_id": row["video_id"],
                    "video_path": row["video_path"],
                    "length": row.get("length"),
                    "lesson_glosses": lesson_glosses,
                }
            )
        wrong_gloss = wrong_map[gloss]
        for row in choose_rows(rows_by_gloss[wrong_gloss], wrong_per_gloss, reference_ids[wrong_gloss]):
            cases.append(
                {
                    "target_gloss": gloss,
                    "actual_gloss": wrong_gloss,
                    "case_type": "wrong",
                    "video_id": row["video_id"],
                    "video_path": row["video_path"],
                    "length": row.get("length"),
                    "lesson_glosses": lesson_glosses,
                }
            )
    return cases


def percentile(values: list[float], q: float) -> float | None:
    if not values:
        return None
    return round(float(np.percentile(np.array(values, dtype=np.float64), q)), 3)


def summarize_perf(rows: list[dict[str, Any]]) -> dict[str, Any]:
    request_ms = [float(item["perf"]["request_ms"]) for item in rows]
    response_bytes = [int(item["perf"]["response_bytes"]) for item in rows]
    segment_ratio = [float(item["perf"]["segment_ratio"]) for item in rows if item["perf"]["segment_ratio"] is not None]
    payload_valid = sum(1 for item in rows if item["perf"]["payload_valid"])
    return {
        "request_ms": {
            "avg": round(sum(request_ms) / max(1, len(request_ms)), 3),
            "p50": percentile(request_ms, 50),
            "p95": percentile(request_ms, 95),
            "max": round(max(request_ms), 3) if request_ms else None,
        },
        "response_bytes": {
            "avg": round(sum(response_bytes) / max(1, len(response_bytes)), 3),
            "p50": percentile(response_bytes, 50),
            "p95": percentile(response_bytes, 95),
            "max": int(max(response_bytes)) if response_bytes else None,
        },
        "segment_ratio": {
            "avg": round(sum(segment_ratio) / max(1, len(segment_ratio)), 3) if segment_ratio else None,
            "p50": percentile(segment_ratio, 50),
            "p95": percentile(segment_ratio, 95),
        },
        "payload_valid": {
            "true": payload_valid,
            "false": len(rows) - payload_valid,
        },
    }


def summarize(results: list[dict[str, Any]]) -> dict[str, Any]:
    by_suite: dict[str, dict[str, Any]] = {}
    for suite_name in sorted({item["suite"] for item in results}):
        suite_rows = [item for item in results if item["suite"] == suite_name]
        by_suite[suite_name] = {
            "total": len(suite_rows),
            "passed": sum(1 for item in suite_rows if item["passed"]),
            "failed": sum(1 for item in suite_rows if not item["passed"]),
            "avg_score": round(
                sum(float(item["response"]["score"]) for item in suite_rows) / max(1, len(suite_rows)),
                3,
            ),
            "perf": summarize_perf(suite_rows),
        }

    failed_rows = [item for item in results if not item["passed"]]
    wrong_exact_counter = Counter(
        item["diagnostics"].get("predicted_wrong_gloss_matches_actual")
        for item in results
        if item["suite"].startswith("practice_ii") and item["case_type"] == "wrong"
    )

    return {
        "overall_total": len(results),
        "overall_passed": sum(1 for item in results if item["passed"]),
        "overall_failed": len(failed_rows),
        "by_suite": by_suite,
        "practice_ii_wrong_exact_match": {
            "true": wrong_exact_counter.get(True, 0),
            "false": wrong_exact_counter.get(False, 0),
        },
        "overall_perf": summarize_perf(results),
        "failed_cases": failed_rows,
    }


def check_reference_routes(api_url: str, glosses: list[str]) -> dict[str, Any]:
    results = []
    for gloss in glosses:
        started = time.perf_counter()
        response = requests.get(f"{api_url.rstrip('/')}/reference-video/{requests.utils.quote(gloss, safe='')}", timeout=60)
        elapsed_ms = (time.perf_counter() - started) * 1000.0
        results.append(
            {
                "gloss": gloss,
                "status": response.status_code,
                "request_ms": round(float(elapsed_ms), 3),
                "content_length": int(response.headers.get("content-length", "0") or 0),
                "content_type": response.headers.get("content-type"),
            }
        )
    ok_rows = [item for item in results if item["status"] == 200]
    return {
        "total": len(results),
        "ok": len(ok_rows),
        "failed": len(results) - len(ok_rows),
        "request_ms": summarize_perf([{"perf": {"request_ms": item["request_ms"], "response_bytes": item["content_length"], "segment_ratio": None, "payload_valid": item["status"] == 200}} for item in results])["request_ms"],
        "content_length": {
            "avg": round(sum(item["content_length"] for item in results) / max(1, len(results)), 3),
            "max": max((item["content_length"] for item in results), default=None),
        },
        "results": results,
    }


def main() -> None:
    args = parse_args()
    dataset_root = Path(args.dataset_root)
    metadata_path = Path(args.metadata_path) if args.metadata_path else dataset_root / "All_cam1_metadata.json"
    manifest_path = Path(args.manifest_path)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    health = requests.get(f"{args.api_url.rstrip('/')}/health", timeout=30).json()
    glosses, topics, reference_ids = load_manifest(manifest_path)
    rows_by_gloss = load_rows(dataset_root, metadata_path)
    missing = [gloss for gloss in glosses if gloss not in rows_by_gloss]
    if missing:
        raise RuntimeError(f"Missing glosses in dataset: {missing}")

    topic10_map, topic5_map = build_topic_maps(topics)
    wrong_topic10 = pair_wrong_glosses(topic10_map)
    wrong_topic5 = pair_wrong_glosses(topic5_map)
    requested_suites = {
        item.strip()
        for item in args.suites.split(",")
        if item.strip()
    }

    suites: list[tuple[str, str, list[dict[str, Any]]]] = [
        (
            "practice_i_all",
            "practice-i/analyze-video",
            build_practice_i_cases(
                glosses,
                rows_by_gloss,
                reference_ids,
                wrong_topic10,
                args.p1_correct_per_gloss,
                args.p1_wrong_per_gloss,
            ),
        ),
        (
            "practice_ii_topic10",
            "practice-ii/analyze-video",
            build_practice_ii_cases(
                glosses,
                rows_by_gloss,
                reference_ids,
                topic10_map,
                wrong_topic10,
                args.p2_correct_per_gloss,
                args.p2_wrong_per_gloss,
            ),
        ),
        (
            "practice_ii_topic5",
            "practice-ii/analyze-video",
            build_practice_ii_cases(
                glosses,
                rows_by_gloss,
                reference_ids,
                topic5_map,
                wrong_topic5,
                args.p2_correct_per_gloss,
                args.p2_wrong_per_gloss,
            ),
        ),
    ]

    all_results: list[dict[str, Any]] = []
    started = time.time()
    for suite_name, endpoint, cases in suites:
        if suite_name not in requested_suites:
            continue
        all_results.extend(
            run_suite(
                suite_name=suite_name,
                api_url=args.api_url,
                endpoint=endpoint,
                cases=cases,
                args=args,
            )
        )

    summary = summarize(all_results)
    summary["elapsed_seconds"] = round(time.time() - started, 3)
    summary["health"] = health
    summary["config"] = {
        "frame_stride": args.frame_stride,
        "segment_min_frames": args.segment_min_frames,
        "segment_pad_frames": args.segment_pad_frames,
        "segment_max_frames": args.segment_max_frames,
        "overlay_frame_count": args.overlay_frame_count,
        "p1_correct_per_gloss": args.p1_correct_per_gloss,
        "p1_wrong_per_gloss": args.p1_wrong_per_gloss,
        "p2_correct_per_gloss": args.p2_correct_per_gloss,
        "p2_wrong_per_gloss": args.p2_wrong_per_gloss,
    }
    if args.check_reference_routes:
        summary["reference_routes"] = check_reference_routes(args.api_url, glosses)
    summary["results"] = all_results

    (out_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: summary[k] for k in ("overall_total", "overall_passed", "overall_failed", "elapsed_seconds")}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

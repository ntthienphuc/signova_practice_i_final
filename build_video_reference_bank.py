from __future__ import annotations

import argparse
import json
import random
from collections import defaultdict
from pathlib import Path
from typing import Any

import numpy as np

from signova_practice_i.pose_utils import (
    ReferenceBank,
    build_reference_bank_from_sequences,
    compare_to_reference_bank,
)
from signova_practice_i.scoring import decision_for_target, public_result, rank_sequence_against_banks
from signova_practice_i.video_engine import extract_video_pose


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-root", required=True)
    parser.add_argument("--cam", default="cam_1")
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--glosses", default=None, help="Comma-separated gloss list.")
    parser.add_argument("--gloss-file", default=None, help="JSON file with selected_glosses.")
    parser.add_argument("--references-per-gloss", type=int, default=20)
    parser.add_argument("--target-len", type=int, default=64)
    parser.add_argument("--seed", type=int, default=777)
    parser.add_argument("--frame-stride", type=int, default=2)
    parser.add_argument("--max-frames", type=int, default=64)
    return parser.parse_args()


def paired_rows(dataset_root: Path, cam: str) -> dict[str, list[dict[str, Any]]]:
    metadata = json.loads((dataset_root / f"{cam}.json").read_text(encoding="utf-8"))
    rows_by_gloss: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in metadata:
        video_id = row["video_id"]
        if (dataset_root / cam / f"{video_id}.mp4").exists():
            rows_by_gloss[row["gloss"]].append(row)
    return rows_by_gloss


def save_bank_npz(path: Path, bank: ReferenceBank) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        path,
        median_xy=bank.median_xy,
        tolerance=bank.tolerance,
        template_xy=bank.template_xy,
        names=np.array(bank.names),
        reference_ids=np.array(bank.reference_ids),
    )


def rank_against_banks(seq, banks: dict[str, ReferenceBank]) -> list[dict[str, Any]]:
    ranked = []
    for gloss, bank in banks.items():
        result = compare_to_reference_bank(seq, bank)
        ranked.append(
            {
                "gloss": gloss,
                "score": result["score"],
                "bad_fraction": result["bad_fraction"],
                "median_ratio": result["median_ratio"],
            }
        )
    ranked.sort(key=lambda item: (item["bad_fraction"], -item["score"], item["median_ratio"]))
    return ranked


def main() -> None:
    args = parse_args()
    rng = random.Random(args.seed)
    dataset_root = Path(args.dataset_root)
    out_dir = Path(args.out_dir)
    bank_dir = out_dir / "banks"
    out_dir.mkdir(parents=True, exist_ok=True)
    if args.gloss_file:
        selection = json.loads(Path(args.gloss_file).read_text(encoding="utf-8"))
        selected_glosses = selection["selected_glosses"]
    elif args.glosses:
        selected_glosses = [gloss.strip() for gloss in args.glosses.split(",") if gloss.strip()]
    else:
        raise RuntimeError("Provide --glosses or --gloss-file.")
    rows_by_gloss = paired_rows(dataset_root, args.cam)

    manifest = {
        "cam": args.cam,
        "source": "video_mediapipe_upload_pipeline",
        "frame_stride": args.frame_stride,
        "max_frames": args.max_frames,
        "target_len": args.target_len,
        "glosses": [],
    }
    banks: dict[str, ReferenceBank] = {}
    selections = []

    for gloss_idx, gloss in enumerate(selected_glosses):
        rows = list(rows_by_gloss[gloss])
        rng.shuffle(rows)
        ref_rows = rows[: args.references_per_gloss]
        same_rows = rows[args.references_per_gloss : args.references_per_gloss + 2]
        if len(same_rows) < 2:
            same_rows = rows[-2:]

        sequences = []
        for row in ref_rows:
            video_path = dataset_root / args.cam / f"{row['video_id']}.mp4"
            seq = extract_video_pose(video_path, max_frames=args.max_frames, frame_stride=args.frame_stride)
            sequences.append((row["video_id"], seq))

        bank = build_reference_bank_from_sequences(
            gloss,
            sequences,
            target_len=args.target_len,
            tolerance_quantile=0.9,
            tolerance_floor=0.18,
            tolerance_margin=0.08,
        )
        banks[gloss] = bank
        bank_path = bank_dir / f"gloss_{gloss_idx:02d}.npz"
        save_bank_npz(bank_path, bank)
        manifest["glosses"].append(
            {
                "gloss_index": gloss_idx,
                "gloss": gloss,
                "reference_count": len(ref_rows),
                "bank_path": str(Path("banks") / bank_path.name),
                "reference_ids": [row["video_id"] for row in ref_rows],
            }
        )
        selections.append({"gloss_idx": gloss_idx, "gloss": gloss, "same_rows": same_rows})
        print(f"built {gloss.encode('unicode_escape').decode()} refs={len(ref_rows)}")

    tests = []
    for selected in selections:
        gloss = selected["gloss"]
        gloss_idx = selected["gloss_idx"]
        bank = banks[gloss]
        diff_gloss = selected_glosses[(gloss_idx + 1) % len(selected_glosses)]
        diff_rows = rows_by_gloss[diff_gloss][-2:]
        for case_type, actual_gloss, rows in (
            ("same", gloss, selected["same_rows"]),
            ("different", diff_gloss, diff_rows),
        ):
            for row in rows:
                seq = extract_video_pose(
                    dataset_root / args.cam / f"{row['video_id']}.mp4",
                    max_frames=args.max_frames,
                    frame_stride=args.frame_stride,
                )
                result = compare_to_reference_bank(seq, bank)
                ranking = rank_against_banks(seq, banks)
                target_rank = next(i + 1 for i, item in enumerate(ranking) if item["gloss"] == gloss)
                decision = decision_for_target(result, target_rank, ranking[0]["score"] if ranking else None)
                tests.append(
                    {
                        "target_gloss": gloss,
                        "case_type": case_type,
                        "actual_gloss": actual_gloss,
                        "video_id": row["video_id"],
                        "target_rank": target_rank,
                        "top3": ranking[:3],
                        **decision,
                        **public_result(result),
                    }
                )

    summary = {
        "same_accept_count": sum(t["case_type"] == "same" and t["accept_as_target"] for t in tests),
        "same_total": sum(t["case_type"] == "same" for t in tests),
        "different_reject_count": sum(
            t["case_type"] == "different" and (not t["accept_as_target"] or t["possible_wrong_word"])
            for t in tests
        ),
        "different_total": sum(t["case_type"] == "different" for t in tests),
        "same_avg_score": float(np.mean([t["score"] for t in tests if t["case_type"] == "same"])),
        "different_avg_score": float(np.mean([t["score"] for t in tests if t["case_type"] == "different"])),
    }
    report = {"manifest": manifest, "summary": summary, "tests": tests}
    (out_dir / "reference_bank_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (out_dir / "reference_bank_tests.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(summary, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()

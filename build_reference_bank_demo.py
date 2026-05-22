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
    build_reference_bank,
    compare_to_reference_bank,
    load_pose_sequence,
)
from signova_practice_i.render import render_feedback_video
from signova_practice_i.scoring import decision_for_target


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-root", required=True)
    parser.add_argument("--pose-root", required=True)
    parser.add_argument("--cam", default="cam_1", choices=["cam_1", "cam_2", "cam_3"])
    parser.add_argument("--out-dir", default="outputs/reference_bank_10")
    parser.add_argument("--num-glosses", type=int, default=10)
    parser.add_argument(
        "--glosses",
        default=None,
        help="Optional comma-separated gloss list. If provided, overrides --num-glosses.",
    )
    parser.add_argument("--references-per-gloss", type=int, default=20)
    parser.add_argument("--target-len", type=int, default=64)
    parser.add_argument("--seed", type=int, default=123)
    parser.add_argument("--render-videos", action="store_true")
    return parser.parse_args()


def paired_rows(dataset_root: Path, pose_root: Path, cam: str) -> dict[str, list[dict[str, Any]]]:
    metadata = json.loads((dataset_root / f"{cam}.json").read_text(encoding="utf-8"))
    rows_by_gloss: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in metadata:
        video_id = row["video_id"]
        if (dataset_root / cam / f"{video_id}.mp4").exists() and (pose_root / cam / f"{video_id}.pose").exists():
            rows_by_gloss[row["gloss"]].append(row)
    return rows_by_gloss


def first_unique_glosses(rows_by_gloss: dict[str, list[dict[str, Any]]], metadata_path: Path, count: int) -> list[str]:
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    glosses: list[str] = []
    seen = set()
    for row in metadata:
        gloss = row["gloss"]
        if gloss in seen or gloss not in rows_by_gloss:
            continue
        seen.add(gloss)
        glosses.append(gloss)
        if len(glosses) == count:
            break
    return glosses


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


def public_result(result: dict[str, Any]) -> dict[str, Any]:
    return {
        key: value
        for key, value in result.items()
        if key not in {"bad_mask", "distance", "ratio"}
    }


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
    pose_root = Path(args.pose_root)
    out_dir = Path(args.out_dir)
    bank_dir = out_dir / "banks"
    out_dir.mkdir(parents=True, exist_ok=True)

    rows_by_gloss = paired_rows(dataset_root, pose_root, args.cam)
    if args.glosses:
        selected_glosses = [gloss.strip() for gloss in args.glosses.split(",") if gloss.strip()]
        missing = [gloss for gloss in selected_glosses if gloss not in rows_by_gloss]
        if missing:
            raise RuntimeError(f"Glosses not found in {args.cam}: {missing}")
    else:
        selected_glosses = first_unique_glosses(
            rows_by_gloss,
            dataset_root / f"{args.cam}.json",
            args.num_glosses,
        )

    manifest: dict[str, Any] = {
        "cam": args.cam,
        "num_glosses": len(selected_glosses),
        "references_per_gloss_requested": args.references_per_gloss,
        "target_len": args.target_len,
        "glosses": [],
    }
    tests = []
    banks: dict[str, ReferenceBank] = {}
    selections: list[dict[str, Any]] = []

    for gloss_idx, gloss in enumerate(selected_glosses):
        rows = list(rows_by_gloss[gloss])
        rng.shuffle(rows)
        ref_rows = rows[: args.references_per_gloss]
        same_row = rows[args.references_per_gloss] if len(rows) > args.references_per_gloss else rows[-1]
        diff_gloss = selected_glosses[(gloss_idx + 1) % len(selected_glosses)]
        diff_row = rows_by_gloss[diff_gloss][0]

        ref_items = [
            (row["video_id"], pose_root / args.cam / f"{row['video_id']}.pose")
            for row in ref_rows
        ]
        bank = build_reference_bank(
            gloss,
            ref_items,
            target_len=args.target_len,
        )
        banks[gloss] = bank
        bank_path = bank_dir / f"gloss_{gloss_idx:02d}.npz"
        save_bank_npz(bank_path, bank)
        selections.append(
            {
                "gloss_idx": gloss_idx,
                "gloss": gloss,
                "ref_rows": ref_rows,
                "same_row": same_row,
                "diff_gloss": diff_gloss,
                "diff_row": diff_row,
                "bank_path": bank_path,
            }
        )
        manifest["glosses"].append(
            {
                "gloss_index": gloss_idx,
                "gloss": gloss,
                "total_samples": len(rows_by_gloss[gloss]),
                "reference_count": len(ref_rows),
                "bank_path": str(Path("banks") / bank_path.name),
            }
        )

    for selected in selections:
        gloss_idx = selected["gloss_idx"]
        gloss = selected["gloss"]
        ref_rows = selected["ref_rows"]
        same_row = selected["same_row"]
        diff_row = selected["diff_row"]
        diff_gloss = selected["diff_gloss"]
        bank = banks[gloss]
        bank_path = selected["bank_path"]

        same_pose = load_pose_sequence(pose_root / args.cam / f"{same_row['video_id']}.pose")
        diff_pose = load_pose_sequence(pose_root / args.cam / f"{diff_row['video_id']}.pose")
        same_result = compare_to_reference_bank(same_pose, bank)
        diff_result = compare_to_reference_bank(diff_pose, bank)
        same_ranking = rank_against_banks(same_pose, banks)
        diff_ranking = rank_against_banks(diff_pose, banks)
        same_target_rank = next(i + 1 for i, item in enumerate(same_ranking) if item["gloss"] == gloss)
        diff_target_rank = next(i + 1 for i, item in enumerate(diff_ranking) if item["gloss"] == gloss)
        same_decision = decision_for_target(same_result, same_target_rank, same_ranking[0]["score"] if same_ranking else None)
        diff_decision = decision_for_target(diff_result, diff_target_rank, diff_ranking[0]["score"] if diff_ranking else None)

        item = {
            "gloss_index": gloss_idx,
            "gloss": gloss,
            "total_samples": len(rows_by_gloss[gloss]),
            "reference_count": len(ref_rows),
            "bank_path": str(Path("banks") / bank_path.name),
            "reference_ids": [row["video_id"] for row in ref_rows],
            "same_gloss_test": {
                "video_id": same_row["video_id"],
                "expected_gloss": gloss,
                "target_rank": same_target_rank,
                "top3_bank_matches": same_ranking[:3],
                **same_decision,
                **public_result(same_result),
            },
            "different_gloss_test": {
                "video_id": diff_row["video_id"],
                "actual_gloss": diff_gloss,
                "expected_gloss": gloss,
                "target_rank": diff_target_rank,
                "top3_bank_matches": diff_ranking[:3],
                "reject_as_target": diff_target_rank != 1 or diff_result["score"] < 70,
                **diff_decision,
                **public_result(diff_result),
            },
        }
        tests.append(item)

        if args.render_videos and gloss_idx == 0:
            ref_row = ref_rows[0]
            for label, test_row, result in (
                ("same_gloss", same_row, same_result),
                ("different_gloss", diff_row, diff_result),
            ):
                video_path = out_dir / f"{label}_{args.cam}_gloss_{gloss_idx:02d}_{test_row['video_id']}_vs_bank.mp4"
                render_feedback_video(
                    user_video=dataset_root / args.cam / f"{test_row['video_id']}.mp4",
                    ref_video=dataset_root / args.cam / f"{ref_row['video_id']}.mp4",
                    user_pose=load_pose_sequence(pose_root / args.cam / f"{test_row['video_id']}.pose"),
                    ref_pose=load_pose_sequence(pose_root / args.cam / f"{ref_row['video_id']}.pose"),
                    output_path=video_path,
                    metadata={"gloss": gloss, "score": result["score"]},
                    bad_masks=result["bad_mask"],
                )
                item[f"{label}_video"] = str(video_path)

    result_report = {
        "manifest": manifest,
        "tests": tests,
        "summary": {
            "same_gloss_avg_score": float(np.mean([x["same_gloss_test"]["score"] for x in tests])),
            "different_gloss_avg_score": float(np.mean([x["different_gloss_test"]["score"] for x in tests])),
            "same_gloss_avg_bad_fraction": float(np.mean([x["same_gloss_test"]["bad_fraction"] for x in tests])),
            "different_gloss_avg_bad_fraction": float(np.mean([x["different_gloss_test"]["bad_fraction"] for x in tests])),
            "same_gloss_accept_count": int(sum(x["same_gloss_test"]["accept_as_target"] for x in tests)),
            "different_gloss_reject_count": int(sum(x["different_gloss_test"]["reject_as_target"] for x in tests)),
        },
    }

    (out_dir / "reference_bank_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    report_path = out_dir / "reference_bank_tests.json"
    report_path.write_text(
        json.dumps(result_report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps({"report": str(report_path), **result_report["summary"]}, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()

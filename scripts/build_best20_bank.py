from __future__ import annotations

import argparse
import json
import shutil
from collections import defaultdict
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", default="tests/all_cam1_api_final_tuned/summary.json")
    parser.add_argument(
        "--manifest",
        default="outputs/reference_bank_30_unique_video_ref20_template/reference_bank_manifest.json",
    )
    parser.add_argument("--out-dir", default="outputs/reference_bank_20_best_allcam1_fe")
    parser.add_argument("--top-k", type=int, default=20)
    return parser.parse_args()


def score_gloss_rows(rows: list[dict[str, Any]]) -> dict[str, Any]:
    correct_rows = [row for row in rows if row["case_type"] == "correct"]
    wrong_rows = [row for row in rows if row["case_type"] == "wrong"]
    correct_pass = sum(1 for row in correct_rows if row["passed"])
    wrong_pass = sum(1 for row in wrong_rows if row["passed"])
    correct_scores = [float(row["response"]["score"]) for row in correct_rows]
    wrong_scores = [float(row["response"]["score"]) for row in wrong_rows]
    return {
        "correct_pass": correct_pass,
        "wrong_pass": wrong_pass,
        "correct_total": len(correct_rows),
        "wrong_total": len(wrong_rows),
        "correct_avg_score": sum(correct_scores) / max(1, len(correct_scores)),
        "wrong_avg_score": sum(wrong_scores) / max(1, len(wrong_scores)),
        "best_reference_row": max(correct_rows, key=lambda row: float(row["response"]["score"])),
        "rows": rows,
    }


def main() -> None:
    args = parse_args()
    report = json.loads(Path(args.report).read_text(encoding="utf-8"))
    manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    out_dir = Path(args.out_dir)
    bank_out_dir = out_dir / "banks"
    bank_out_dir.mkdir(parents=True, exist_ok=True)

    rows_by_gloss: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in report["results"]:
        if row["suite"] != "practice_i_all":
            continue
        rows_by_gloss[row["target_gloss"]].append(row)

    ranked: list[dict[str, Any]] = []
    for gloss, rows in rows_by_gloss.items():
        stats = score_gloss_rows(rows)
        ranked.append(
            {
                "gloss": gloss,
                **stats,
            }
        )

    ranked.sort(
        key=lambda item: (
            -item["wrong_pass"],
            -item["correct_pass"],
            -item["correct_avg_score"],
            item["wrong_avg_score"],
            item["gloss"],
        )
    )
    selected = ranked[: args.top_k]
    selected_glosses = [item["gloss"] for item in selected]

    manifest_by_gloss = {item["gloss"]: item for item in manifest["glosses"]}
    source_bank_root = Path(args.manifest).resolve().parent
    new_glosses = []
    display_reference_entries = []
    selection_report = []

    for new_idx, item in enumerate(selected):
        gloss = item["gloss"]
        manifest_item = manifest_by_gloss[gloss]
        source_bank_path = source_bank_root / manifest_item["bank_path"]
        target_bank_path = bank_out_dir / f"gloss_{new_idx:02d}.npz"
        shutil.copy2(source_bank_path, target_bank_path)

        best_reference_row = item["best_reference_row"]
        display_reference_entries.append(
            {
                "gloss": gloss,
                "video_id": best_reference_row["video_id"],
                "video_path": best_reference_row["video_path"],
                "score": float(best_reference_row["response"]["score"]),
            }
        )
        selection_report.append(
            {
                "gloss": gloss,
                "correct_pass": item["correct_pass"],
                "correct_total": item["correct_total"],
                "wrong_pass": item["wrong_pass"],
                "wrong_total": item["wrong_total"],
                "correct_avg_score": round(float(item["correct_avg_score"]), 3),
                "wrong_avg_score": round(float(item["wrong_avg_score"]), 3),
                "display_reference": display_reference_entries[-1],
            }
        )

        new_glosses.append(
            {
                "gloss_index": new_idx,
                "gloss": gloss,
                "reference_count": manifest_item["reference_count"],
                "bank_path": str(Path("banks") / target_bank_path.name),
                "reference_ids": manifest_item["reference_ids"],
            }
        )

    new_topics = [{"name": "Best 20 Glosses", "glosses": selected_glosses}]
    new_manifest = {
        **{k: v for k, v in manifest.items() if k not in {"glosses", "topics"}},
        "glosses": new_glosses,
        "topics": new_topics,
    }

    (out_dir / "reference_bank_manifest.json").write_text(
        json.dumps(new_manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (out_dir / "display_reference_manifest.json").write_text(
        json.dumps({"references": display_reference_entries}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (out_dir / "best20_selection_report.json").write_text(
        json.dumps({"selected": selection_report}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(json.dumps({"out_dir": str(out_dir), "selected_glosses": selected_glosses}, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from statistics import median

from pose_format import Pose


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-root", required=True)
    parser.add_argument("--pose-root", required=True)
    parser.add_argument("--sample-limit", type=int, default=12)
    parser.add_argument("--pose-scan-limit", type=int, default=8)
    return parser.parse_args()


def summarize_counts(dataset_root: Path, pose_root: Path) -> dict:
    report = {}
    for cam in ("cam_1", "cam_2", "cam_3"):
        metadata_path = dataset_root / f"{cam}.json"
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        by_gloss = Counter(row["gloss"] for row in metadata)
        pose_files = list((pose_root / cam).glob("*.pose"))
        video_files = list((dataset_root / cam).glob("*.mp4"))
        vals = sorted(by_gloss.values())
        report[cam] = {
            "items": len(metadata),
            "glosses": len(by_gloss),
            "pose_files": len(pose_files),
            "video_files": len(video_files),
            "min_per_gloss": vals[0],
            "p25_per_gloss": vals[len(vals) // 4],
            "median_per_gloss": median(vals),
            "p75_per_gloss": vals[(len(vals) * 3) // 4],
            "max_per_gloss": vals[-1],
        }
    return report


def sample_pose_coverage(dataset_root: Path, pose_root: Path, sample_limit: int) -> list[dict]:
    metadata = json.loads((dataset_root / "cam_1.json").read_text(encoding="utf-8"))
    rows_by_gloss = defaultdict(list)
    for row in metadata:
        rows_by_gloss[row["gloss"]].append(row)

    samples = []
    for gloss in sorted(rows_by_gloss)[:sample_limit]:
        rows = rows_by_gloss[gloss]
        existing = [
            row["video_id"]
            for row in rows
            if (pose_root / "cam_1" / f"{row['video_id']}.pose").exists()
        ]
        samples.append(
            {
                "gloss": gloss,
                "metadata_rows": len(rows),
                "pose_files": len(existing),
                "example_ids": existing[:3],
            }
        )
    return samples


def scan_pose_files(pose_root: Path, scan_limit: int) -> dict:
    report = {}
    for cam in ("cam_1", "cam_2", "cam_3"):
        paths = sorted((pose_root / cam).glob("*.pose"))[:scan_limit]
        frames = []
        shapes = []
        failed = []
        for path in paths:
            try:
                pose = Pose.read(path.read_bytes())
                frames.append(int(pose.body.data.shape[0]))
                shapes.append(list(pose.body.data.shape))
            except Exception as exc:  # pragma: no cover - health report only
                failed.append({"path": str(path), "error": str(exc)})
        report[cam] = {
            "scanned": len(paths),
            "failed": failed,
            "min_frames": min(frames) if frames else None,
            "median_frames": median(frames) if frames else None,
            "max_frames": max(frames) if frames else None,
            "example_shape": shapes[0] if shapes else None,
        }
    return report


def main() -> None:
    args = parse_args()
    dataset_root = Path(args.dataset_root)
    pose_root = Path(args.pose_root)
    report = {
        "summary": summarize_counts(dataset_root, pose_root),
        "pose_file_scan": scan_pose_files(pose_root, args.pose_scan_limit),
        "cam_1_sample_coverage": sample_pose_coverage(dataset_root, pose_root, args.sample_limit),
        "recommendation": {
            "practice_i_reference_minimum": "5-10 clean reference poses per word",
            "practice_i_good_target": "12-20 poses per word across different signers",
            "sign_classifier_minimum": "30+ poses per word; VSL400 cam_1 already has 53-93 per word",
            "best_first_camera": "cam_1 for direct/front-facing feedback",
        },
    }
    print(json.dumps(report, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()

from __future__ import annotations

import argparse
import json
import random
from collections import defaultdict
from pathlib import Path

from signova_practice_i.pose_utils import (
    joint_errors,
    load_pose_sequence,
    summarize_errors,
    worst_joints,
)
from signova_practice_i.render import render_feedback_video


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-root", required=True)
    parser.add_argument("--pose-root", required=True)
    parser.add_argument("--cam", default="cam_1", choices=["cam_1", "cam_2", "cam_3"])
    parser.add_argument("--out-dir", default="outputs")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--gloss", default=None)
    return parser.parse_args()


def choose_pair(dataset_root: Path, pose_root: Path, cam: str, seed: int, gloss: str | None) -> tuple[dict, dict]:
    rng = random.Random(seed)
    metadata = json.loads((dataset_root / f"{cam}.json").read_text(encoding="utf-8"))
    rows_by_gloss = defaultdict(list)
    for row in metadata:
        video_id = row["video_id"]
        if (dataset_root / cam / f"{video_id}.mp4").exists() and (pose_root / cam / f"{video_id}.pose").exists():
            rows_by_gloss[row["gloss"]].append(row)

    candidates = {
        key: rows
        for key, rows in rows_by_gloss.items()
        if len(rows) >= 2 and (gloss is None or key == gloss)
    }
    if not candidates:
        raise RuntimeError("No gloss has at least two paired mp4/pose samples.")

    chosen_gloss = gloss if gloss is not None else rng.choice(sorted(candidates))
    user_row, ref_row = rng.sample(candidates[chosen_gloss], 2)
    return user_row, ref_row


def score_from_error(overall_error: float) -> int:
    score = 100.0 - min(overall_error / 0.75, 1.0) * 100.0
    return int(round(max(score, 0.0)))


def main() -> None:
    args = parse_args()
    dataset_root = Path(args.dataset_root)
    pose_root = Path(args.pose_root)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    user_row, ref_row = choose_pair(dataset_root, pose_root, args.cam, args.seed, args.gloss)
    user_id = user_row["video_id"]
    ref_id = ref_row["video_id"]
    gloss = user_row["gloss"]

    user_pose = load_pose_sequence(pose_root / args.cam / f"{user_id}.pose")
    ref_pose = load_pose_sequence(pose_root / args.cam / f"{ref_id}.pose")
    errors = joint_errors(user_pose, ref_pose)
    components = summarize_errors(errors, user_pose.groups)
    worst = worst_joints(errors, user_pose.names)
    score = score_from_error(components["overall"])

    feedback = {
        "mode": "practice_i_demo",
        "cam": args.cam,
        "gloss": gloss,
        "user_video_id": user_id,
        "reference_video_id": ref_id,
        "score": score,
        "component_errors": components,
        "worst_joints": [{"joint": name, "error": value} for name, value in worst],
        "interpretation": {
            "green": "reference skeleton / acceptable user joints",
            "red": "user joints above the current error threshold",
        },
    }

    json_path = out_dir / f"practice_i_feedback_{args.cam}_{user_id}_vs_{ref_id}.json"
    json_path.write_text(json.dumps(feedback, ensure_ascii=False, indent=2), encoding="utf-8")

    video_path = out_dir / f"practice_i_feedback_{args.cam}_{user_id}_vs_{ref_id}.mp4"
    render_feedback_video(
        user_video=dataset_root / args.cam / f"{user_id}.mp4",
        ref_video=dataset_root / args.cam / f"{ref_id}.mp4",
        user_pose=user_pose,
        ref_pose=ref_pose,
        output_path=video_path,
        metadata={"gloss": gloss, "score": score},
    )

    print(json.dumps({"feedback_json": str(json_path), "feedback_video": str(video_path), **feedback}, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()

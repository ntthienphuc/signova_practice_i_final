from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path
from typing import Any

import numpy as np

from signova_practice_i.pose_utils import load_pose_sequence, normalized_resampled_xy


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-root", required=True)
    parser.add_argument("--pose-root", required=True)
    parser.add_argument("--cam", default="cam_1")
    parser.add_argument("--out-file", required=True)
    parser.add_argument("--num-glosses", type=int, default=10)
    parser.add_argument("--samples-per-gloss", type=int, default=12)
    parser.add_argument("--target-len", type=int, default=48)
    parser.add_argument("--seed-gloss", default=None)
    return parser.parse_args()


def load_rows_by_gloss(dataset_root: Path, pose_root: Path, cam: str) -> dict[str, list[dict[str, Any]]]:
    metadata = json.loads((dataset_root / f"{cam}.json").read_text(encoding="utf-8"))
    by_gloss: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in metadata:
        video_id = row["video_id"]
        if (pose_root / cam / f"{video_id}.pose").exists() and (dataset_root / cam / f"{video_id}.mp4").exists():
            by_gloss[row["gloss"]].append(row)
    return by_gloss


def representative_indices(total: int, count: int) -> list[int]:
    if total <= count:
        return list(range(total))
    return sorted(set(int(round(i)) for i in np.linspace(0, total - 1, count)))


def gloss_vector(rows: list[dict[str, Any]], pose_root: Path, cam: str, samples_per_gloss: int, target_len: int) -> np.ndarray:
    vectors = []
    for idx in representative_indices(len(rows), samples_per_gloss):
        row = rows[idx]
        seq = load_pose_sequence(pose_root / cam / f"{row['video_id']}.pose")
        xy = normalized_resampled_xy(seq, target_len)
        # Use wrists, elbows, shoulders, and hands; flatten normalized trajectory.
        vectors.append(xy.reshape(-1))
    stack = np.stack(vectors, axis=0)
    med = np.nanmedian(stack, axis=0)
    med = np.nan_to_num(med, nan=0.0, posinf=0.0, neginf=0.0)
    norm = np.linalg.norm(med)
    if norm > 1e-6:
        med = med / norm
    return med.astype(np.float32)


def greedy_farthest(glosses: list[str], vectors: np.ndarray, count: int, seed_gloss: str | None) -> list[int]:
    if seed_gloss and seed_gloss in glosses:
        selected = [glosses.index(seed_gloss)]
    else:
        centroid = vectors.mean(axis=0)
        selected = [int(np.argmax(np.linalg.norm(vectors - centroid[None, :], axis=1)))]

    remaining = set(range(len(glosses))) - set(selected)
    while len(selected) < count and remaining:
        best_idx = None
        best_score = -1.0
        for idx in remaining:
            dists = [float(np.linalg.norm(vectors[idx] - vectors[j])) for j in selected]
            score = min(dists)
            if score > best_score:
                best_score = score
                best_idx = idx
        assert best_idx is not None
        selected.append(best_idx)
        remaining.remove(best_idx)
    return selected


def main() -> None:
    args = parse_args()
    dataset_root = Path(args.dataset_root)
    pose_root = Path(args.pose_root)
    out_file = Path(args.out_file)
    out_file.parent.mkdir(parents=True, exist_ok=True)

    rows_by_gloss = load_rows_by_gloss(dataset_root, pose_root, args.cam)
    glosses = sorted(rows_by_gloss)
    vectors = []
    stats = {}
    for i, gloss in enumerate(glosses, start=1):
        vectors.append(gloss_vector(rows_by_gloss[gloss], pose_root, args.cam, args.samples_per_gloss, args.target_len))
        stats[gloss] = {"sample_count": len(rows_by_gloss[gloss])}
        if i % 50 == 0:
            print(f"processed {i}/{len(glosses)}")
    vector_array = np.stack(vectors, axis=0)
    selected_idx = greedy_farthest(glosses, vector_array, args.num_glosses, args.seed_gloss)
    selected_glosses = [glosses[i] for i in selected_idx]

    selected = []
    for idx in selected_idx:
        distances = np.linalg.norm(vector_array - vector_array[idx][None, :], axis=1)
        nearest = sorted(
            [
                {"gloss": glosses[j], "distance": float(distances[j])}
                for j in range(len(glosses))
                if j != idx
            ],
            key=lambda item: item["distance"],
        )[:5]
        selected.append(
            {
                "gloss": glosses[idx],
                "sample_count": stats[glosses[idx]]["sample_count"],
                "nearest_neighbors": nearest,
            }
        )

    report = {
        "cam": args.cam,
        "num_glosses_total": len(glosses),
        "samples_per_gloss_for_selection": args.samples_per_gloss,
        "target_len": args.target_len,
        "selected_glosses": selected_glosses,
        "selected": selected,
    }
    out_file.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"selected_glosses": selected_glosses, "out_file": str(out_file)}, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()


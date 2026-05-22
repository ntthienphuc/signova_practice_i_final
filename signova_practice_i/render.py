from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Tuple

import cv2
import numpy as np

from .pose_utils import PoseSequence, joint_errors, resample_sequence


BODY_EDGES = [
    ("left_shoulder", "right_shoulder"),
    ("left_shoulder", "left_elbow"),
    ("left_elbow", "left_wrist"),
    ("right_shoulder", "right_elbow"),
    ("right_elbow", "right_wrist"),
    ("nose", "left_shoulder"),
    ("nose", "right_shoulder"),
]

HAND_EDGES = [
    ("wrist", "thumb_cmc"),
    ("thumb_cmc", "thumb_mcp"),
    ("thumb_mcp", "thumb_ip"),
    ("thumb_ip", "thumb_tip"),
    ("wrist", "index_mcp"),
    ("index_mcp", "index_pip"),
    ("index_pip", "index_dip"),
    ("index_dip", "index_tip"),
    ("wrist", "middle_mcp"),
    ("middle_mcp", "middle_pip"),
    ("middle_pip", "middle_dip"),
    ("middle_dip", "middle_tip"),
    ("wrist", "ring_mcp"),
    ("ring_mcp", "ring_pip"),
    ("ring_pip", "ring_dip"),
    ("ring_dip", "ring_tip"),
    ("wrist", "pinky_mcp"),
    ("pinky_mcp", "pinky_pip"),
    ("pinky_pip", "pinky_dip"),
    ("pinky_dip", "pinky_tip"),
]


def _edges(names: List[str]) -> List[Tuple[int, int]]:
    name_to_idx = {name: i for i, name in enumerate(names)}
    out: List[Tuple[int, int]] = []
    for a, b in BODY_EDGES:
        if a in name_to_idx and b in name_to_idx:
            out.append((name_to_idx[a], name_to_idx[b]))
    for side in ("left", "right"):
        for a, b in HAND_EDGES:
            aa = f"{side}_{a}"
            bb = f"{side}_{b}"
            if aa in name_to_idx and bb in name_to_idx:
                out.append((name_to_idx[aa], name_to_idx[bb]))
    return out


def draw_pose(
    frame: np.ndarray,
    seq: PoseSequence,
    frame_idx: int,
    bad_mask: np.ndarray | None,
    good_color: Tuple[int, int, int] = (0, 220, 80),
    bad_color: Tuple[int, int, int] = (30, 30, 230),
) -> np.ndarray:
    out = frame.copy()
    xy = seq.xy[min(frame_idx, len(seq.xy) - 1)]
    conf = seq.confidence[min(frame_idx, len(seq.confidence) - 1)]

    for a, b in _edges(seq.names):
        if conf[a] <= 0 or conf[b] <= 0:
            continue
        if not np.all(np.isfinite(xy[[a, b]])):
            continue
        color = bad_color if bad_mask is not None and (bad_mask[a] or bad_mask[b]) else good_color
        pa = tuple(np.round(xy[a]).astype(int))
        pb = tuple(np.round(xy[b]).astype(int))
        cv2.line(out, pa, pb, color, 3, cv2.LINE_AA)

    for i, point in enumerate(xy):
        if conf[i] <= 0 or not np.all(np.isfinite(point)):
            continue
        color = bad_color if bad_mask is not None and bad_mask[i] else good_color
        cv2.circle(out, tuple(np.round(point).astype(int)), 4, color, -1, cv2.LINE_AA)
    return out


def render_feedback_video(
    user_video: str | Path,
    ref_video: str | Path,
    user_pose: PoseSequence,
    ref_pose: PoseSequence,
    output_path: str | Path,
    metadata: Dict[str, object],
    error_threshold: float = 0.42,
    bad_masks: np.ndarray | None = None,
) -> Path:
    user_video = Path(user_video)
    ref_video = Path(ref_video)
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    user_cap = cv2.VideoCapture(str(user_video))
    ref_cap = cv2.VideoCapture(str(ref_video))
    if not user_cap.isOpened():
        raise RuntimeError(f"Cannot open user video: {user_video}")
    if not ref_cap.isOpened():
        raise RuntimeError(f"Cannot open reference video: {ref_video}")

    fps = user_cap.get(cv2.CAP_PROP_FPS) or 25.0
    width = int(user_cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1080)
    height = int(user_cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 1080)
    panel_w = 540
    panel_h = int(panel_w * height / max(width, 1))

    frame_count = int(user_cap.get(cv2.CAP_PROP_FRAME_COUNT) or len(user_pose.xy))
    user_pose_r = resample_sequence(user_pose, max(frame_count, 1))
    ref_pose_r = resample_sequence(ref_pose, max(frame_count, 1))
    if bad_masks is None:
        errors = joint_errors(user_pose, ref_pose)
        errors_r = cv2.resize(
            errors.T,
            (max(frame_count, 1), errors.shape[1]),
            interpolation=cv2.INTER_LINEAR,
        ).T
        bad_masks_r = errors_r > error_threshold
    else:
        bad_masks_float = bad_masks.astype(np.float32)
        bad_masks_r = cv2.resize(
            bad_masks_float.T,
            (max(frame_count, 1), bad_masks_float.shape[1]),
            interpolation=cv2.INTER_NEAREST,
        ).T > 0.5

    writer = cv2.VideoWriter(
        str(output_path),
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (panel_w * 2, panel_h),
    )

    idx = 0
    while True:
        ok_user, user_frame = user_cap.read()
        if not ok_user:
            break
        ok_ref, ref_frame = ref_cap.read()
        if not ok_ref:
            ref_cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ok_ref, ref_frame = ref_cap.read()
            if not ok_ref:
                ref_frame = np.zeros_like(user_frame)

        bad_mask = bad_masks_r[:, min(idx, bad_masks_r.shape[1] - 1)]
        user_drawn = draw_pose(user_frame, user_pose_r, idx, bad_mask)
        ref_drawn = draw_pose(ref_frame, ref_pose_r, idx, None)

        user_panel = cv2.resize(user_drawn, (panel_w, panel_h))
        ref_panel = cv2.resize(ref_drawn, (panel_w, panel_h))
        combined = np.concatenate([user_panel, ref_panel], axis=1)

        cv2.putText(combined, "USER ATTEMPT", (16, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(combined, "REFERENCE", (panel_w + 16, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(
            combined,
            f"gloss={metadata.get('gloss', '')} score={metadata.get('score', '')}",
            (16, panel_h - 18),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.62,
            (255, 255, 255),
            2,
        )
        writer.write(combined)
        idx += 1

    writer.release()
    user_cap.release()
    ref_cap.release()
    return output_path

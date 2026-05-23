from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

import numpy as np
try:
    from pose_format import Pose
except ModuleNotFoundError:  # pragma: no cover - optional at runtime
    Pose = None


BODY_JOINTS = {
    "nose": 0,
    "left_shoulder": 11,
    "right_shoulder": 12,
    "left_elbow": 13,
    "right_elbow": 14,
    "left_wrist": 15,
    "right_wrist": 16,
}

LEFT_HAND_OFFSET = 501
RIGHT_HAND_OFFSET = 522
HAND_POINTS = [
    "wrist",
    "thumb_cmc",
    "thumb_mcp",
    "thumb_ip",
    "thumb_tip",
    "index_mcp",
    "index_pip",
    "index_dip",
    "index_tip",
    "middle_mcp",
    "middle_pip",
    "middle_dip",
    "middle_tip",
    "ring_mcp",
    "ring_pip",
    "ring_dip",
    "ring_tip",
    "pinky_mcp",
    "pinky_pip",
    "pinky_dip",
    "pinky_tip",
]

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


@dataclass(frozen=True)
class PoseSequence:
    xy: np.ndarray
    confidence: np.ndarray
    names: List[str]
    groups: Dict[str, List[int]]


@dataclass(frozen=True)
class ReferenceBank:
    gloss: str
    median_xy: np.ndarray
    tolerance: np.ndarray
    names: List[str]
    groups: Dict[str, List[int]]
    reference_ids: List[str]
    template_xy: np.ndarray | None = None


def load_pose_sequence(path: str | Path) -> PoseSequence:
    if Pose is None:
        raise RuntimeError("pose-format is required to load .pose files")
    pose = Pose.read(Path(path).read_bytes())
    xy_all = pose.body.data[:, 0, :, :2].astype(np.float32)
    conf_all = pose.body.confidence[:, 0, :].astype(np.float32)

    indices: List[int] = []
    names: List[str] = []
    groups: Dict[str, List[int]] = {"body": [], "left_hand": [], "right_hand": []}

    for name, idx in BODY_JOINTS.items():
        groups["body"].append(len(indices))
        indices.append(idx)
        names.append(name)

    for i, point in enumerate(HAND_POINTS):
        groups["left_hand"].append(len(indices))
        indices.append(LEFT_HAND_OFFSET + i)
        names.append(f"left_{point}")

    for i, point in enumerate(HAND_POINTS):
        groups["right_hand"].append(len(indices))
        indices.append(RIGHT_HAND_OFFSET + i)
        names.append(f"right_{point}")

    return PoseSequence(
        xy=xy_all[:, indices, :],
        confidence=conf_all[:, indices],
        names=names,
        groups=groups,
    )


def normalize_pose(seq: PoseSequence) -> PoseSequence:
    xy = seq.xy.copy()
    conf = seq.confidence.copy()

    left_shoulder = seq.names.index("left_shoulder")
    right_shoulder = seq.names.index("right_shoulder")
    center = (xy[:, left_shoulder, :] + xy[:, right_shoulder, :]) / 2.0
    shoulder_width = np.linalg.norm(
        xy[:, left_shoulder, :] - xy[:, right_shoulder, :],
        axis=1,
    )
    scale = np.nanmedian(shoulder_width[shoulder_width > 1e-3])
    if not np.isfinite(scale) or scale < 1e-3:
        scale = 1.0

    xy = (xy - center[:, None, :]) / scale
    xy[conf <= 0] = np.nan
    return PoseSequence(xy=xy, confidence=conf, names=seq.names, groups=seq.groups)


def resample_array(values: np.ndarray, target_len: int) -> np.ndarray:
    if len(values) == target_len:
        return values.copy()
    if len(values) == 1:
        return np.repeat(values, target_len, axis=0)

    src_x = np.linspace(0.0, 1.0, len(values))
    dst_x = np.linspace(0.0, 1.0, target_len)
    flat = values.reshape(len(values), -1)
    out = np.empty((target_len, flat.shape[1]), dtype=np.float32)
    for col in range(flat.shape[1]):
        series = flat[:, col]
        valid = np.isfinite(series)
        if valid.sum() == 0:
            out[:, col] = np.nan
        elif valid.sum() == 1:
            out[:, col] = series[valid][0]
        else:
            out[:, col] = np.interp(dst_x, src_x[valid], series[valid])
    return out.reshape((target_len,) + values.shape[1:])


def resample_sequence(seq: PoseSequence, target_len: int) -> PoseSequence:
    return PoseSequence(
        xy=resample_array(seq.xy, target_len),
        confidence=resample_array(seq.confidence[..., None], target_len)[..., 0],
        names=seq.names,
        groups=seq.groups,
    )


def joint_errors(user: PoseSequence, reference: PoseSequence) -> np.ndarray:
    target_len = max(len(user.xy), len(reference.xy))
    user_r = resample_sequence(normalize_pose(user), target_len)
    ref_r = resample_sequence(normalize_pose(reference), target_len)
    return np.linalg.norm(user_r.xy - ref_r.xy, axis=2)


def summarize_errors(errors: np.ndarray, groups: Dict[str, List[int]]) -> Dict[str, float]:
    summary: Dict[str, float] = {}
    for group, idxs in groups.items():
        group_errors = errors[:, idxs]
        summary[group] = float(np.nanmedian(group_errors))
    summary["overall"] = float(np.nanmedian(errors))
    return summary


def groups_from_names(names: List[str]) -> Dict[str, List[int]]:
    return {
        "body": [i for i, name in enumerate(names) if not name.startswith(("left_", "right_"))],
        "left_hand": [i for i, name in enumerate(names) if name.startswith("left_")],
        "right_hand": [i for i, name in enumerate(names) if name.startswith("right_")],
    }


def worst_joints(
    errors: np.ndarray,
    names: Iterable[str],
    top_k: int = 8,
) -> List[Tuple[str, float]]:
    per_joint = np.nanmedian(errors, axis=0)
    order = np.argsort(np.nan_to_num(per_joint, nan=-1.0))[::-1]
    name_list = list(names)
    return [(name_list[i], float(per_joint[i])) for i in order[:top_k]]


def normalized_resampled_xy(seq: PoseSequence, target_len: int) -> np.ndarray:
    return normalized_resampled_pose(seq, target_len).xy


def normalized_resampled_pose(
    seq: PoseSequence,
    target_len: int,
    *,
    min_confidence: float = 0.35,
) -> PoseSequence:
    seq_r = resample_sequence(normalize_pose(seq), target_len)
    xy = seq_r.xy.copy()
    confidence = seq_r.confidence.copy()
    xy[confidence < float(min_confidence)] = np.nan
    return PoseSequence(
        xy=xy,
        confidence=confidence,
        names=seq_r.names,
        groups=seq_r.groups,
    )


def build_reference_bank(
    gloss: str,
    reference_items: List[Tuple[str, Path]],
    target_len: int = 64,
    tolerance_quantile: float = 0.85,
    tolerance_floor: float = 0.14,
    tolerance_margin: float = 0.06,
) -> ReferenceBank:
    if len(reference_items) < 2:
        raise ValueError("At least two reference poses are needed to build a tolerance bank.")

    ids: List[str] = []
    sequences = []
    template: PoseSequence | None = None
    for video_id, pose_path in reference_items:
        seq = load_pose_sequence(pose_path)
        template = seq
        ids.append(video_id)
        sequences.append(normalized_resampled_xy(seq, target_len))

    stack = np.stack(sequences, axis=0)
    median_xy = np.nanmedian(stack, axis=0)
    distances = np.linalg.norm(stack - median_xy[None, ...], axis=-1)
    tolerance = np.nanquantile(distances, tolerance_quantile, axis=0) + tolerance_margin
    tolerance = np.maximum(tolerance, tolerance_floor)

    assert template is not None
    return ReferenceBank(
        gloss=gloss,
        median_xy=median_xy.astype(np.float32),
        tolerance=tolerance.astype(np.float32),
        names=template.names,
        groups=template.groups,
        reference_ids=ids,
        template_xy=stack.astype(np.float32),
    )


def build_reference_bank_from_sequences(
    gloss: str,
    reference_sequences: List[Tuple[str, PoseSequence]],
    target_len: int = 64,
    tolerance_quantile: float = 0.85,
    tolerance_floor: float = 0.14,
    tolerance_margin: float = 0.06,
) -> ReferenceBank:
    if len(reference_sequences) < 2:
        raise ValueError("At least two reference sequences are needed to build a tolerance bank.")

    ids: List[str] = []
    sequences = []
    template: PoseSequence | None = None
    for video_id, seq in reference_sequences:
        template = seq
        ids.append(video_id)
        sequences.append(normalized_resampled_xy(seq, target_len))

    stack = np.stack(sequences, axis=0)
    median_xy = np.nanmedian(stack, axis=0)
    distances = np.linalg.norm(stack - median_xy[None, ...], axis=-1)
    tolerance = np.nanquantile(distances, tolerance_quantile, axis=0) + tolerance_margin
    tolerance = np.maximum(tolerance, tolerance_floor)

    assert template is not None
    return ReferenceBank(
        gloss=gloss,
        median_xy=median_xy.astype(np.float32),
        tolerance=tolerance.astype(np.float32),
        names=template.names,
        groups=template.groups,
        reference_ids=ids,
        template_xy=stack.astype(np.float32),
    )


def compare_to_reference_bank(seq: PoseSequence, bank: ReferenceBank) -> dict:
    user_r = normalized_resampled_pose(seq, len(bank.median_xy))
    xy = user_r.xy
    matched_template_index = None
    if bank.template_xy is not None and len(bank.template_xy) > 0:
        template_distances = np.linalg.norm(bank.template_xy - xy[None, ...], axis=-1)
        template_ratios = template_distances / np.maximum(bank.tolerance[None, ...], 1e-6)
        template_valid_mask = np.isfinite(xy).all(axis=-1)
        template_ratios[:, ~template_valid_mask] = np.nan
        per_template_score = np.nanmedian(template_ratios, axis=(1, 2))
        per_template_score = np.where(np.isfinite(per_template_score), per_template_score, np.inf)
        matched_template_index = int(np.nanargmin(per_template_score))
        reference_xy = bank.template_xy[matched_template_index]
    else:
        reference_xy = bank.median_xy
    distances = np.linalg.norm(xy - reference_xy, axis=-1)
    ratios = distances / np.maximum(bank.tolerance, 1e-6)
    valid_mask = np.isfinite(xy).all(axis=-1) & np.isfinite(reference_xy).all(axis=-1)
    ratios[~valid_mask] = np.nan
    bad_mask = ratios > 1.0
    bad_mask_float = np.where(valid_mask, bad_mask.astype(np.float32), np.nan)

    component_bad_fraction: Dict[str, float] = {}
    component_ratio: Dict[str, float] = {}
    component_valid_fraction: Dict[str, float] = {}
    for group, idxs in bank.groups.items():
        component_bad_fraction[group] = float(np.nanmean(bad_mask_float[:, idxs]))
        component_ratio[group] = float(np.nanmedian(ratios[:, idxs]))
        component_valid_fraction[group] = float(np.mean(valid_mask[:, idxs]))

    valid_fraction = float(np.mean(valid_mask))
    bad_fraction = float(np.nanmean(bad_mask_float)) if np.any(valid_mask) else 1.0
    median_ratio = float(np.nanmedian(ratios))
    score = int(round(max(0.0, min(100.0, 100.0 * (1.0 - bad_fraction)))))
    per_joint = np.nanmean(bad_mask_float, axis=0)
    order = np.argsort(np.nan_to_num(per_joint, nan=-1.0))[::-1]
    worst = [
        {
            "joint": bank.names[i],
            "bad_fraction": float(per_joint[i]),
            "median_ratio": float(np.nanmedian(ratios[:, i])),
            "valid_fraction": float(np.mean(valid_mask[:, i])),
        }
        for i in order[:8]
    ]

    return {
        "score": score,
        "bad_fraction": bad_fraction,
        "median_ratio": median_ratio,
        "valid_fraction": valid_fraction,
        "component_bad_fraction": component_bad_fraction,
        "component_ratio": component_ratio,
        "component_valid_fraction": component_valid_fraction,
        "bad_mask": bad_mask,
        "valid_mask": valid_mask,
        "distance": distances,
        "ratio": ratios,
        "user_xy": xy,
        "reference_xy": reference_xy,
        "tolerance_used": bank.tolerance,
        "worst_joints": worst,
        "matched_template_index": matched_template_index,
        "matched_reference_id": (
            bank.reference_ids[matched_template_index]
            if matched_template_index is not None and matched_template_index < len(bank.reference_ids)
            else None
        ),
    }


def _safe_float(value: float | np.floating | None) -> float | None:
    if value is None:
        return None
    if not np.isfinite(value):
        return None
    return float(value)


def _safe_point(point: np.ndarray) -> list[float] | None:
    if point.shape[0] < 2 or not np.all(np.isfinite(point[:2])):
        return None
    return [float(point[0]), float(point[1])]


def _direction_message(dx: float, dy: float) -> str:
    parts: list[str] = []
    if abs(dy) > abs(dx):
        parts.append("higher" if dy < 0 else "lower")
    elif abs(dx) > 0.04:
        parts.append("more to the right" if dx > 0 else "more to the left")
    if not parts:
        return "Adjust this joint closer to the reference path."
    return f"Move this joint slightly {' and '.join(parts)}."


def skeleton_connections(names: List[str]) -> list[list[int]]:
    name_to_idx = {name: idx for idx, name in enumerate(names)}
    out: list[list[int]] = []
    for a, b in BODY_EDGES:
        if a in name_to_idx and b in name_to_idx:
            out.append([name_to_idx[a], name_to_idx[b]])
    for side in ("left", "right"):
        for a, b in HAND_EDGES:
            aa = f"{side}_{a}"
            bb = f"{side}_{b}"
            if aa in name_to_idx and bb in name_to_idx:
                out.append([name_to_idx[aa], name_to_idx[bb]])
    return out


def _frame_times(start_ms: int, end_ms: int, frame_count: int) -> list[int]:
    if frame_count <= 1:
        return [int(start_ms)]
    return [
        int(round(start_ms + (frame_idx / float(frame_count - 1)) * (end_ms - start_ms)))
        for frame_idx in range(frame_count)
    ]


def _build_array_pose_frames(
    seq: PoseSequence,
    *,
    target_len: int,
    start_ms: int,
    end_ms: int,
) -> list[dict[str, Any]]:
    seq_r = resample_sequence(seq, target_len)
    times = _frame_times(start_ms, end_ms, target_len)
    frames: list[dict[str, Any]] = []
    for frame_idx in range(target_len):
        points: list[list[float] | None] = []
        for joint_idx in range(len(seq_r.names)):
            point = seq_r.xy[frame_idx, joint_idx]
            if seq_r.confidence[frame_idx, joint_idx] <= 0 or not np.all(np.isfinite(point[:2])):
                points.append(None)
            else:
                points.append([float(point[0]), float(point[1])])
        frames.append(
            {
                "frame": frame_idx,
                "time_ms": times[frame_idx],
                "points": points,
            }
        )
    return frames


def build_aligned_video_overlay_payload(
    *,
    user_seq: PoseSequence,
    reference_seq: PoseSequence,
    joint_names: List[str],
    user_video_meta: Dict[str, float],
    reference_video_meta: Dict[str, float],
    user_segment_start_frame: int,
    user_segment_end_frame: int,
    reference_segment_start_frame: int,
    reference_segment_end_frame: int,
    target_len: int,
    reference_gloss: str,
    reference_video_url: str | None,
    reference_video_id: str | None,
) -> dict[str, Any]:
    user_fps = max(float(user_video_meta["fps"]), 1e-6)
    reference_fps = max(float(reference_video_meta["fps"]), 1e-6)
    user_start_ms = int(round(1000.0 * float(user_segment_start_frame) / user_fps))
    user_end_ms = int(round(1000.0 * float(user_segment_end_frame) / user_fps))
    reference_start_ms = int(round(1000.0 * float(reference_segment_start_frame) / reference_fps))
    reference_end_ms = int(round(1000.0 * float(reference_segment_end_frame) / reference_fps))

    return {
        "coordinate_space": "video_pixels_progress_aligned",
        "frame_count": int(target_len),
        "joint_names": joint_names,
        "connections": skeleton_connections(joint_names),
        "user": {
            "video_width": int(round(float(user_video_meta["frame_width"]))),
            "video_height": int(round(float(user_video_meta["frame_height"]))),
            "video_fps": float(user_video_meta["fps"]),
            "segment_start_frame": int(user_segment_start_frame),
            "segment_end_frame": int(user_segment_end_frame),
            "segment_start_ms": user_start_ms,
            "segment_end_ms": user_end_ms,
            "segment_duration_ms": max(0, user_end_ms - user_start_ms),
            "frames": _build_array_pose_frames(
                user_seq,
                target_len=target_len,
                start_ms=user_start_ms,
                end_ms=user_end_ms,
            ),
        },
        "reference": {
            "gloss": reference_gloss,
            "video_url": reference_video_url,
            "video_id": reference_video_id,
            "video_width": int(round(float(reference_video_meta["frame_width"]))),
            "video_height": int(round(float(reference_video_meta["frame_height"]))),
            "video_fps": float(reference_video_meta["fps"]),
            "segment_start_frame": int(reference_segment_start_frame),
            "segment_end_frame": int(reference_segment_end_frame),
            "segment_start_ms": reference_start_ms,
            "segment_end_ms": reference_end_ms,
            "segment_duration_ms": max(0, reference_end_ms - reference_start_ms),
            "frames": _build_array_pose_frames(
                reference_seq,
                target_len=target_len,
                start_ms=reference_start_ms,
                end_ms=reference_end_ms,
            ),
        },
    }


def _build_compact_points(
    seq: PoseSequence,
    *,
    target_len: int,
    width: float,
    height: float,
) -> list[list[list[float] | None]]:
    seq_r = resample_sequence(seq, target_len)
    width = max(float(width), 1.0)
    height = max(float(height), 1.0)
    frames: list[list[list[float] | None]] = []
    for frame_idx in range(target_len):
        points: list[list[float] | None] = []
        for joint_idx in range(len(seq_r.names)):
            point = seq_r.xy[frame_idx, joint_idx]
            if seq_r.confidence[frame_idx, joint_idx] <= 0 or not np.all(np.isfinite(point[:2])):
                points.append(None)
            else:
                points.append([
                    round(float(point[0]) / width, 6),
                    round(float(point[1]) / height, 6),
                ])
        frames.append(points)
    return frames


def build_compact_overlay_payload(
    *,
    user_seq: PoseSequence,
    reference_seq: PoseSequence,
    bad_mask: np.ndarray,
    joint_names: List[str],
    user_video_meta: Dict[str, float],
    reference_video_meta: Dict[str, float],
    frame_count: int = 32,
) -> dict[str, Any]:
    if len(bad_mask) == frame_count:
        bad_mask_r = bad_mask
    else:
        sample_idx = np.linspace(0, len(bad_mask) - 1, frame_count).round().astype(int)
        bad_mask_r = bad_mask[sample_idx]
    bad_joint_indices = [
        [int(joint_idx) for joint_idx in np.flatnonzero(frame_mask)]
        for frame_mask in bad_mask_r
    ]
    return {
        "coordinate_space": "clip_normalized_2d",
        "frame_count": int(frame_count),
        "joint_names": joint_names,
        "connections": skeleton_connections(joint_names),
        "user_frames": _build_compact_points(
            user_seq,
            target_len=frame_count,
            width=float(user_video_meta["frame_width"]),
            height=float(user_video_meta["frame_height"]),
        ),
        "reference_frames": _build_compact_points(
            reference_seq,
            target_len=frame_count,
            width=float(reference_video_meta["frame_width"]),
            height=float(reference_video_meta["frame_height"]),
        ),
        "bad_joint_indices": bad_joint_indices,
    }


def build_visualization_payload(
    seq: PoseSequence,
    result: Dict[str, Any],
    *,
    source_fps: float,
    source_start_frame: int = 0,
    source_end_frame: int | None = None,
    max_main_errors: int = 3,
) -> dict[str, Any]:
    user_xy = result["user_xy"]
    reference_xy = result["reference_xy"]
    ratio = result["ratio"]
    bad_mask = result["bad_mask"]
    valid_mask = result.get("valid_mask")
    names = seq.names
    tolerance = result["tolerance_used"]
    frame_count = int(user_xy.shape[0])

    if source_end_frame is None:
        source_end_frame = source_start_frame + frame_count
    segment_frame_count = max(int(source_end_frame) - int(source_start_frame), 1)
    fps = max(float(source_fps), 1e-6)
    start_ms = int(round(1000.0 * float(source_start_frame) / fps))
    end_ms = int(round(1000.0 * float(source_end_frame) / fps))

    def frame_time_ms(frame_idx: int) -> int:
        if frame_count <= 1:
            return start_ms
        alpha = frame_idx / float(frame_count - 1)
        return int(round(start_ms + alpha * (end_ms - start_ms)))

    user_pose = []
    reference_pose = []
    joint_status = []
    correction_vectors = []

    for frame_idx in range(frame_count):
        user_joints = {}
        ref_joints = {}
        for joint_idx, joint_name in enumerate(names):
            user_point = _safe_point(user_xy[frame_idx, joint_idx])
            ref_point = _safe_point(reference_xy[frame_idx, joint_idx])
            if user_point is not None:
                user_joints[joint_name] = user_point
            if ref_point is not None:
                ref_joints[joint_name] = ref_point

            severity = _safe_float(min(float(ratio[frame_idx, joint_idx]), 2.0) / 2.0)
            if valid_mask is not None and not bool(valid_mask[frame_idx, joint_idx]):
                status = "missing"
            else:
                status = "bad" if bool(bad_mask[frame_idx, joint_idx]) else "good"
            joint_status.append(
                {
                    "frame": frame_idx,
                    "time_ms": frame_time_ms(frame_idx),
                    "body_part": joint_name,
                    "status": status,
                    "severity": severity,
                    "user_color": "red" if status == "bad" else ("orange" if status == "missing" else "green"),
                    "reference_color": "green" if status != "missing" else "gray",
                }
            )
            if status == "bad" and user_point is not None and ref_point is not None:
                correction_vectors.append(
                    {
                        "frame": frame_idx,
                        "time_ms": frame_time_ms(frame_idx),
                        "body_part": joint_name,
                        "from": user_point,
                        "to": ref_point,
                        "severity": severity,
                    }
                )

        user_pose.append({"frame": frame_idx, "time_ms": frame_time_ms(frame_idx), "joints": user_joints})
        reference_pose.append({"frame": frame_idx, "time_ms": frame_time_ms(frame_idx), "joints": ref_joints})

    alignment = [
        {
            "user_frame": frame_idx,
            "reference_frame": frame_idx,
            "user_time_ms": frame_time_ms(frame_idx),
            "reference_time_ms": frame_time_ms(frame_idx),
        }
        for frame_idx in range(frame_count)
    ]

    per_joint_bad = np.nanmean(bad_mask, axis=0)
    order = np.argsort(np.nan_to_num(per_joint_bad, nan=-1.0))[::-1]
    main_errors = []
    for joint_idx in order[:max_main_errors]:
        if not np.isfinite(per_joint_bad[joint_idx]) or float(per_joint_bad[joint_idx]) <= 0.0:
            continue
        joint_name = names[joint_idx]
        delta = reference_xy[:, joint_idx] - user_xy[:, joint_idx]
        valid_delta = delta[np.all(np.isfinite(delta), axis=1)]
        mean_dx = float(np.nanmedian(valid_delta[:, 0])) if len(valid_delta) else 0.0
        mean_dy = float(np.nanmedian(valid_delta[:, 1])) if len(valid_delta) else 0.0
        main_errors.append(
            {
                "body_part": joint_name,
                "severity": _safe_float(min(float(np.nanmedian(ratio[:, joint_idx])), 2.0) / 2.0),
                "bad_fraction": _safe_float(per_joint_bad[joint_idx]),
                "message": _direction_message(mean_dx, mean_dy),
            }
        )

    return {
        "fps": round(frame_count / max((end_ms - start_ms) / 1000.0, 1e-6), 3),
        "coordinate_space": "normalized_2d",
        "frame_count": frame_count,
        "joint_names": names,
        "connections": skeleton_connections(names),
        "user_pose": user_pose,
        "reference_pose": reference_pose,
        "joint_status": joint_status,
        "alignment": alignment,
        "correction_vectors": correction_vectors,
        "main_errors": main_errors,
        "segment_start_ms": start_ms,
        "segment_end_ms": end_ms,
        "valid_fraction": result.get("valid_fraction"),
        "tolerance_summary": {
            "median": _safe_float(np.nanmedian(tolerance)),
            "max": _safe_float(np.nanmax(tolerance)),
        },
    }


def load_reference_bank_npz(gloss: str, path: str | Path) -> ReferenceBank:
    data = np.load(Path(path), allow_pickle=False)
    names = [str(name) for name in data["names"].tolist()]
    template_xy = data["template_xy"].astype(np.float32) if "template_xy" in data.files else None
    return ReferenceBank(
        gloss=gloss,
        median_xy=data["median_xy"].astype(np.float32),
        tolerance=data["tolerance"].astype(np.float32),
        names=names,
        groups=groups_from_names(names),
        reference_ids=[str(video_id) for video_id in data["reference_ids"].tolist()],
        template_xy=template_xy,
    )


def compare_static_pose_to_bank(seq: PoseSequence, bank: ReferenceBank) -> dict:
    normalized = normalize_pose(seq)
    xy = normalized.xy[0]
    distances = np.linalg.norm(bank.median_xy - xy[None, :, :], axis=-1)
    ratios = distances / np.maximum(bank.tolerance, 1e-6)
    valid_mask = np.isfinite(xy).all(axis=-1)[None, :].repeat(len(bank.median_xy), axis=0)
    ratios[~valid_mask] = np.nan
    bad_masks = ratios > 1.0
    bad_masks_float = np.where(valid_mask, bad_masks.astype(np.float32), np.nan)
    frame_bad_fraction = np.nanmean(bad_masks_float, axis=1)
    frame_median_ratio = np.nanmedian(ratios, axis=1)
    sort_key = np.nan_to_num(frame_bad_fraction, nan=1.0) + 0.01 * np.nan_to_num(frame_median_ratio, nan=10.0)
    best_frame = int(np.argmin(sort_key))

    best_bad_mask = bad_masks[best_frame]
    best_ratios = ratios[best_frame]
    best_valid_mask = valid_mask[best_frame]
    component_bad_fraction: Dict[str, float] = {}
    component_ratio: Dict[str, float] = {}
    component_valid_fraction: Dict[str, float] = {}
    for group, idxs in bank.groups.items():
        component_bad_fraction[group] = float(np.nanmean(np.where(best_valid_mask[idxs], best_bad_mask[idxs].astype(np.float32), np.nan)))
        component_ratio[group] = float(np.nanmedian(best_ratios[idxs]))
        component_valid_fraction[group] = float(np.mean(best_valid_mask[idxs]))

    bad_fraction = float(np.nanmean(np.where(best_valid_mask, best_bad_mask.astype(np.float32), np.nan))) if np.any(best_valid_mask) else 1.0
    score = int(round(max(0.0, min(100.0, 100.0 * (1.0 - bad_fraction)))))
    per_joint_ratio = np.nan_to_num(best_ratios, nan=-1.0)
    order = np.argsort(per_joint_ratio)[::-1]
    worst = [
        {
            "joint": bank.names[i],
            "is_bad": bool(best_bad_mask[i]) if np.isfinite(best_ratios[i]) else False,
            "ratio": float(best_ratios[i]) if np.isfinite(best_ratios[i]) else None,
        }
        for i in order[:8]
    ]
    return {
        "score": score,
        "best_frame": best_frame,
        "bad_fraction": bad_fraction,
        "median_ratio": float(np.nanmedian(best_ratios)),
        "valid_fraction": float(np.mean(best_valid_mask)),
        "component_bad_fraction": component_bad_fraction,
        "component_ratio": component_ratio,
        "component_valid_fraction": component_valid_fraction,
        "bad_mask": best_bad_mask,
        "worst_joints": worst,
    }

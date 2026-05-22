from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

from .pose_utils import PoseSequence, ReferenceBank, compare_to_reference_bank


@dataclass(frozen=True)
class Segment:
    start_frame: int
    end_frame: int
    score: float
    reason: str

    @property
    def frame_count(self) -> int:
        return max(0, self.end_frame - self.start_frame)


def smooth_1d(values: np.ndarray, window: int = 5) -> np.ndarray:
    if window <= 1 or len(values) < 3:
        return values.astype(np.float32)
    window = min(window, len(values))
    kernel = np.ones(window, dtype=np.float32) / float(window)
    padded = np.pad(values.astype(np.float32), (window // 2, window - 1 - window // 2), mode="edge")
    return np.convolve(padded, kernel, mode="valid").astype(np.float32)


def slice_sequence(seq: PoseSequence, start: int, end: int) -> PoseSequence:
    start = max(0, int(start))
    end = min(len(seq.xy), int(end))
    if end <= start:
        end = min(len(seq.xy), start + 1)
    return PoseSequence(
        xy=seq.xy[start:end].copy(),
        confidence=seq.confidence[start:end].copy(),
        names=seq.names,
        groups=seq.groups,
    )


def hand_activity_score(seq: PoseSequence) -> np.ndarray:
    names = seq.names
    xy = seq.xy.astype(np.float32)
    conf = seq.confidence.astype(np.float32)

    required = ["left_shoulder", "right_shoulder", "left_wrist", "right_wrist"]
    if not all(name in names for name in required):
        return np.ones(len(seq.xy), dtype=np.float32)

    li = names.index("left_shoulder")
    ri = names.index("right_shoulder")
    lw = names.index("left_wrist")
    rw = names.index("right_wrist")
    center = (xy[:, li] + xy[:, ri]) / 2.0
    shoulder_width = np.linalg.norm(xy[:, li] - xy[:, ri], axis=1)
    scale = np.nanmedian(shoulder_width[shoulder_width > 1e-3])
    if not np.isfinite(scale) or scale < 1e-3:
        scale = 1.0

    left_rel = (xy[:, lw] - center) / scale
    right_rel = (xy[:, rw] - center) / scale
    left_motion = np.linalg.norm(np.diff(left_rel, axis=0, prepend=left_rel[:1]), axis=1)
    right_motion = np.linalg.norm(np.diff(right_rel, axis=0, prepend=right_rel[:1]), axis=1)

    # y grows downward in image coordinates. Above shoulder center means negative y.
    left_up = np.maximum(0.0, -left_rel[:, 1] + 0.05)
    right_up = np.maximum(0.0, -right_rel[:, 1] + 0.05)
    lateral = np.maximum(np.abs(left_rel[:, 0]), np.abs(right_rel[:, 0]))
    motion = np.maximum(left_motion, right_motion)
    visibility = np.maximum(conf[:, lw], conf[:, rw])

    raw = 0.50 * np.maximum(left_up, right_up) + 0.35 * motion + 0.15 * lateral
    raw = np.nan_to_num(raw * (visibility > 0.25), nan=0.0, posinf=0.0, neginf=0.0)
    return smooth_1d(raw, window=5)


def activity_segments(
    seq: PoseSequence,
    min_frames: int = 12,
    max_frames: int | None = None,
    pad_frames: int = 5,
) -> tuple[list[Segment], dict[str, Any]]:
    activity = hand_activity_score(seq)
    if len(activity) == 0:
        return [], {"threshold": None, "activity": []}

    positive = activity[activity > 0]
    if len(positive) == 0:
        return [Segment(0, len(activity), 0.0, "fallback_full_no_activity")], {
            "threshold": 0.0,
            "activity": activity.tolist(),
        }

    threshold = max(float(np.percentile(positive, 55)), float(np.mean(positive) * 0.65), 0.08)
    active = activity >= threshold

    segments: list[Segment] = []
    i = 0
    while i < len(active):
        if not active[i]:
            i += 1
            continue
        start = i
        while i < len(active) and active[i]:
            i += 1
        end = i
        start = max(0, start - pad_frames)
        end = min(len(active), end + pad_frames)
        if end - start >= min_frames:
            segments.append(
                Segment(
                    start_frame=start,
                    end_frame=end,
                    score=float(np.mean(activity[start:end])),
                    reason="activity",
                )
            )

    if not segments:
        # Use central active mass as fallback rather than full video.
        order = np.argsort(activity)[::-1]
        top = sorted(order[: max(min_frames, min(len(order), 24))])
        start = max(0, top[0] - pad_frames)
        end = min(len(activity), top[-1] + pad_frames + 1)
        segments = [Segment(start, end, float(np.mean(activity[start:end])), "fallback_top_activity")]
    else:
        segments = sorted(segments, key=lambda item: item.start_frame)
        merged: list[Segment] = []
        for seg in segments:
            if not merged or seg.start_frame > merged[-1].end_frame:
                merged.append(seg)
                continue
            prev = merged[-1]
            start = prev.start_frame
            end = max(prev.end_frame, seg.end_frame)
            merged[-1] = Segment(
                start_frame=start,
                end_frame=end,
                score=float(np.mean(activity[start:end])),
                reason="activity_merged",
            )
        segments = merged

    if max_frames is not None:
        clipped = []
        for seg in segments:
            if seg.frame_count <= max_frames:
                clipped.append(seg)
                continue
            center = (seg.start_frame + seg.end_frame) // 2
            start = max(0, center - max_frames // 2)
            end = min(len(activity), start + max_frames)
            clipped.append(Segment(start, end, seg.score, seg.reason + "_clipped"))
        segments = clipped

    return segments, {
        "threshold": threshold,
        "activity_mean": float(np.mean(activity)),
        "activity_max": float(np.max(activity)),
        "num_segments": len(segments),
    }


def select_best_segment(
    seq: PoseSequence,
    target_bank: ReferenceBank | None = None,
    min_frames: int = 12,
    max_frames: int | None = None,
    pad_frames: int = 5,
) -> tuple[PoseSequence, Segment, dict[str, Any]]:
    segments, debug = activity_segments(
        seq,
        min_frames=min_frames,
        max_frames=max_frames,
        pad_frames=pad_frames,
    )
    if not segments:
        segment = Segment(0, len(seq.xy), 0.0, "fallback_full_empty")
        return seq, segment, {"segments": [], **debug}

    ranked = []
    for seg in segments:
        candidate = slice_sequence(seq, seg.start_frame, seg.end_frame)
        if target_bank is None:
            ranked.append((seg.score, seg, None))
            continue
        result = compare_to_reference_bank(candidate, target_bank)
        # Prefer target-similar segment, then active segment.
        selection_score = -float(result["bad_fraction"]) + 0.05 * seg.score
        ranked.append((selection_score, seg, result))

    ranked.sort(key=lambda item: item[0], reverse=True)
    best_score, best_segment, best_result = ranked[0]
    return slice_sequence(seq, best_segment.start_frame, best_segment.end_frame), best_segment, {
        **debug,
        "selected_score": float(best_score),
        "selected_result": {
            "score": best_result.get("score"),
            "bad_fraction": best_result.get("bad_fraction"),
            "matched_reference_id": best_result.get("matched_reference_id"),
        } if best_result is not None else None,
        "segments": [
            {
                "start_frame": seg.start_frame,
                "end_frame": seg.end_frame,
                "frame_count": seg.frame_count,
                "activity_score": seg.score,
                "reason": seg.reason,
            }
            for _, seg, _ in ranked
        ],
    }

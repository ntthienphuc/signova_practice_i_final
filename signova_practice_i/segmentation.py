from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Sequence

import numpy as np

from .pose_utils import PoseSequence, ReferenceBank, compare_to_reference_bank
from .sign_classifier import list_classifier_segments


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

    left_up = np.maximum(0.0, -left_rel[:, 1] + 0.05)
    right_up = np.maximum(0.0, -right_rel[:, 1] + 0.05)
    lateral = np.maximum(np.abs(left_rel[:, 0]), np.abs(right_rel[:, 0]))
    motion = np.maximum(left_motion, right_motion)
    visibility = np.maximum(conf[:, lw], conf[:, rw])

    raw = 0.50 * np.maximum(left_up, right_up) + 0.35 * motion + 0.15 * lateral
    raw = np.nan_to_num(raw * (visibility > 0.25), nan=0.0, posinf=0.0, neginf=0.0)
    return smooth_1d(raw, window=5)


def _segment_features(activity: np.ndarray, seg: Segment) -> dict[str, float]:
    total = max(int(len(activity)), 1)
    start = max(0, min(int(seg.start_frame), total))
    end = max(start + 1, min(int(seg.end_frame), total))
    inside = activity[start:end]
    neighbor = max(4, min(10, seg.frame_count // 3 if seg.frame_count > 0 else 4))
    left = activity[max(0, start - neighbor):start]
    right = activity[end:min(total, end + neighbor)]
    context_parts = [part for part in (left, right) if len(part) > 0]
    context_mean = float(np.mean(np.concatenate(context_parts))) if context_parts else 0.0
    mid = 0.5 * (start + end)
    center = 0.5 * total
    center_distance = abs(mid - center) / max(center, 1.0)
    edge_margin = min(start, total - end) / float(total)
    duration_ratio = (end - start) / float(total)
    return {
        "mean_activity": float(np.mean(inside)),
        "peak_activity": float(np.percentile(inside, 90)),
        "contrast": float(np.mean(inside) - context_mean),
        "edge_margin": float(edge_margin),
        "duration_ratio": float(duration_ratio),
        "centeredness": float(1.0 - center_distance),
    }


def _normalize_feature(values: list[float]) -> list[float]:
    if not values:
        return []
    minimum = min(values)
    maximum = max(values)
    if maximum - minimum < 1e-6:
        return [0.5 for _ in values]
    return [(value - minimum) / (maximum - minimum) for value in values]


def _rank_activity_candidates(activity: np.ndarray, segments: list[Segment]) -> list[dict[str, float]]:
    if not segments:
        return []
    features = [_segment_features(activity, seg) for seg in segments]
    norm_mean = _normalize_feature([feat["mean_activity"] for feat in features])
    norm_peak = _normalize_feature([feat["peak_activity"] for feat in features])
    norm_contrast = _normalize_feature([feat["contrast"] for feat in features])
    norm_duration = _normalize_feature([feat["duration_ratio"] for feat in features])
    norm_edge = _normalize_feature([feat["edge_margin"] for feat in features])
    norm_center = _normalize_feature([feat["centeredness"] for feat in features])
    norm_candidate_score = _normalize_feature([float(seg.score) for seg in segments])
    ranked: list[dict[str, float]] = []
    for idx, seg in enumerate(segments):
        prior = (
            0.22 * norm_mean[idx]
            + 0.14 * norm_peak[idx]
            + 0.14 * norm_contrast[idx]
            + 0.14 * norm_duration[idx]
            + 0.10 * norm_edge[idx]
            + 0.04 * norm_center[idx]
            + 0.22 * norm_candidate_score[idx]
        )
        if seg.start_frame <= 1:
            prior -= 0.08
        ranked.append({"index": float(idx), "prior_score": float(prior), **features[idx]})
    return ranked


def _overlap_ratio(a: Segment, b: Segment) -> float:
    start = max(int(a.start_frame), int(b.start_frame))
    end = min(int(a.end_frame), int(b.end_frame))
    overlap = max(0, end - start)
    base = max(1, min(a.frame_count, b.frame_count))
    return float(overlap) / float(base)


def _merge_similar_segments(segments: list[Segment]) -> list[Segment]:
    merged: list[Segment] = []
    for seg in sorted(segments, key=lambda item: (item.start_frame, item.end_frame)):
        replaced = False
        for index, existing in enumerate(merged):
            if _overlap_ratio(existing, seg) < 0.82:
                continue
            existing_arm = "arm_cycle" in existing.reason
            next_arm = "arm_cycle" in seg.reason
            if next_arm and not existing_arm:
                merged[index] = seg
            elif next_arm == existing_arm and seg.score > existing.score:
                merged[index] = seg
            replaced = True
            break
        if not replaced:
            merged.append(seg)
    return merged


def _hybrid_segments(
    seq: PoseSequence,
    activity_segments_list: list[Segment],
    *,
    results_list: Sequence[object] | None,
    fps: float | None,
    frame_stride: int,
) -> tuple[list[Segment], dict[str, Any]]:
    if not results_list or fps is None:
        return activity_segments_list, {"arm_cycle_candidates": []}

    arm_candidates, arm_debug = list_classifier_segments(
        results_list,
        fps=float(fps),
        frame_stride=frame_stride,
    )
    suppressed_initial_arm = False
    if len(arm_candidates) >= 2:
        first = arm_candidates[0]
        later = arm_candidates[1:]
        strongest_later = max(later, key=lambda item: (item.score, item.frame_count))
        if (
            first.start_frame <= 1
            and (
                strongest_later.score >= first.score * 1.10
                or strongest_later.frame_count >= first.frame_count * 1.25
            )
        ):
            arm_candidates = later
            suppressed_initial_arm = True
    combined = list(activity_segments_list)
    arm_debug_segments: list[dict[str, float | int | str | None]] = []
    for arm in arm_candidates:
        arm_seg = Segment(
            start_frame=int(arm.start_frame),
            end_frame=int(arm.end_frame),
            score=float(arm.score),
            reason=str(arm.reason),
        )
        arm_debug_segments.append(
            {
                "start_frame": arm_seg.start_frame,
                "end_frame": arm_seg.end_frame,
                "frame_count": arm_seg.frame_count,
                "score": arm_seg.score,
                "reason": arm_seg.reason,
            }
        )
        combined.append(arm_seg)
        overlaps = [seg for seg in activity_segments_list if _overlap_ratio(seg, arm_seg) > 0.20]
        for seg in overlaps:
            combined.append(
                Segment(
                    start_frame=min(seg.start_frame, arm_seg.start_frame),
                    end_frame=max(seg.end_frame, arm_seg.end_frame),
                    score=max(seg.score, arm_seg.score),
                    reason=f"{arm_seg.reason}_activity_union",
                )
            )
    return _merge_similar_segments(combined), {
        **arm_debug,
        "suppressed_initial_arm_candidate": suppressed_initial_arm,
        "arm_cycle_candidates": arm_debug_segments,
    }


def _refine_segment_bounds(
    activity: np.ndarray,
    seg: Segment,
    *,
    min_frames: int,
    pad_frames: int,
) -> Segment:
    total = len(activity)
    start = max(0, min(int(seg.start_frame), total))
    end = max(start + 1, min(int(seg.end_frame), total))
    local = activity[start:end]
    positive = local[local > 0]
    if len(positive) < 4:
        return seg

    if "arm_cycle" in seg.reason:
        baseline = max(float(np.percentile(positive, 18)), float(np.mean(positive) * 0.72), 0.04)
        active_idx = np.where(local >= baseline)[0]
        if len(active_idx) == 0:
            return seg
        left_rel = 0
        right_rel = min(len(local), int(active_idx[-1]) + max(3, pad_frames // 2) + 1)
        refined_start = start + left_rel
        refined_end = start + right_rel
        min_keep = max(min_frames, int(round(seg.frame_count * 0.72)))
        if refined_end - refined_start < min_keep:
            deficit = min_keep - (refined_end - refined_start)
            grow_left = deficit // 2
            grow_right = deficit - grow_left
            refined_start = max(start, refined_start - grow_left)
            refined_end = min(end, refined_end + grow_right)
        if refined_end - refined_start < min_frames:
            refined_start = start
            refined_end = end
        return Segment(
            start_frame=int(refined_start),
            end_frame=int(refined_end),
            score=float(np.mean(activity[refined_start:refined_end])),
            reason=seg.reason + "_refined",
        )

    threshold = max(float(np.percentile(positive, 62)), float(np.mean(positive) * 0.92), 0.06)
    weights = np.clip(local - threshold * 0.35, a_min=0.0, a_max=None)
    if float(np.sum(weights)) <= 1e-6:
        return seg

    cumulative = np.cumsum(weights) / float(np.sum(weights))
    left_rel = int(np.searchsorted(cumulative, 0.07, side="left"))
    right_rel = int(np.searchsorted(cumulative, 0.93, side="right"))
    if right_rel <= left_rel:
        return seg

    trim_pad = max(1, min(4, int(round(pad_frames / 3.0))))
    refined_start = max(start, start + left_rel - trim_pad)
    refined_end = min(end, start + right_rel + trim_pad)
    if refined_end - refined_start < min_frames:
        deficit = min_frames - (refined_end - refined_start)
        grow_left = deficit // 2
        grow_right = deficit - grow_left
        refined_start = max(0, refined_start - grow_left)
        refined_end = min(total, refined_end + grow_right)
    if refined_end - refined_start < min_frames:
        return seg
    return Segment(
        start_frame=int(refined_start),
        end_frame=int(refined_end),
        score=float(np.mean(activity[refined_start:refined_end])),
        reason=seg.reason + "_refined",
    )


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


def detect_hands_down(seq: PoseSequence, threshold: float = 0.25) -> np.ndarray:
    names = seq.names
    xy = seq.xy.astype(np.float32)
    conf = seq.confidence.astype(np.float32)
    required = ["left_shoulder", "right_shoulder", "left_wrist", "right_wrist"]
    if not all(name in names for name in required):
        return np.zeros(len(seq.xy), dtype=bool)

    li = names.index("left_shoulder")
    ri = names.index("right_shoulder")
    lw = names.index("left_wrist")
    rw = names.index("right_wrist")
    center = (xy[:, li] + xy[:, ri]) / 2.0
    shoulder_width = np.linalg.norm(xy[:, li] - xy[:, ri], axis=1)
    scale = np.nanmedian(shoulder_width[shoulder_width > 1e-3])
    if not np.isfinite(scale) or scale < 1e-3:
        scale = 1.0

    left_rel_y = (xy[:, lw, 1] - center[:, 1]) / scale
    right_rel_y = (xy[:, rw, 1] - center[:, 1]) / scale
    
    left_conf = conf[:, lw]
    right_conf = conf[:, rw]
    
    hands_down = np.zeros(len(seq.xy), dtype=bool)
    for t in range(len(seq.xy)):
        has_left = left_conf[t] > 0.25 and np.isfinite(left_rel_y[t])
        has_right = right_conf[t] > 0.25 and np.isfinite(right_rel_y[t])
        
        if has_left and has_right:
            hands_down[t] = (left_rel_y[t] > threshold) and (right_rel_y[t] > threshold)
        elif has_left:
            hands_down[t] = left_rel_y[t] > threshold
        elif has_right:
            hands_down[t] = right_rel_y[t] > threshold
            
    return hands_down


def find_hands_down_cutoff(
    seq: PoseSequence,
    start_frame: int,
    end_frame: int,
    fps: float | None = None,
    frame_stride: int = 1,
    min_frames: int = 12,
) -> int:
    if end_frame - start_frame <= min_frames:
        return end_frame

    hands_down = detect_hands_down(seq)
    
    # 1. Find the first frame where hands are UP (not down).
    # To be robust against transient tracking glitches, we look for a small window
    # of frames where the hands are mostly UP (i.e. mean hands_down <= 0.20).
    window_size = min(5, max(1, (end_frame - start_frame) // 4))
    t_up = None
    for t in range(start_frame, end_frame - window_size + 1):
        if np.mean(hands_down[t : t + window_size]) <= 0.20:
            t_up = t
            break

    if t_up is None:
        # Hands were never raised in this segment. No cut.
        return end_frame

    # 2. Search for the point after the hands-up phase where the hands go down
    # and stay down until the end.
    search_start = t_up + window_size
    best_t = None
    for t in range(search_start, end_frame):
        if hands_down[t]:
            remaining = hands_down[t:end_frame]
            if len(remaining) > 0 and np.mean(remaining) >= 0.80:
                best_t = t
                break
                
    if best_t is not None:
        effective_fps = (fps or 30.0) / frame_stride
        cut_offset = int(round(0.5 * effective_fps))
        new_end = best_t + cut_offset
        return max(start_frame + min_frames, min(end_frame, new_end))
        
    return end_frame


def select_best_segment(
    seq: PoseSequence,
    target_bank: ReferenceBank | None = None,
    results_list: Sequence[object] | None = None,
    fps: float | None = None,
    frame_stride: int = 1,
    min_frames: int = 12,
    max_frames: int | None = None,
    pad_frames: int = 5,
) -> tuple[PoseSequence, Segment, dict[str, Any]]:
    activity = hand_activity_score(seq)
    segments, debug = activity_segments(
        seq,
        min_frames=min_frames,
        max_frames=max_frames,
        pad_frames=pad_frames,
    )
    segments, arm_debug = _hybrid_segments(
        seq,
        segments,
        results_list=results_list,
        fps=fps,
        frame_stride=frame_stride,
    )
    if not segments:
        segment = Segment(0, len(seq.xy), 0.0, "fallback_full_empty")
        return seq, segment, {"segments": [], **debug}

    candidate_priors = _rank_activity_candidates(activity, segments)
    ranked = []
    for seg, prior_meta in zip(segments, candidate_priors):
        refined = _refine_segment_bounds(
            activity,
            seg,
            min_frames=max(8, min_frames),
            pad_frames=pad_frames,
        )
        
        # Apply hands-down cutoff 0.5s after hands go down
        new_end = find_hands_down_cutoff(
            seq,
            refined.start_frame,
            refined.end_frame,
            fps=fps,
            frame_stride=frame_stride,
            min_frames=max(8, min_frames),
        )
        if new_end < refined.end_frame:
            refined = Segment(
                start_frame=refined.start_frame,
                end_frame=new_end,
                score=float(np.mean(activity[refined.start_frame:new_end])),
                reason=refined.reason + "_hands_down_cut",
            )

        candidate = slice_sequence(seq, refined.start_frame, refined.end_frame)
        if target_bank is None:
            arm_bonus = 0.22 if "arm_cycle" in seg.reason else 0.0
            ranked.append((float(prior_meta["prior_score"]) + arm_bonus, refined, None, seg, prior_meta))
            continue
        result = compare_to_reference_bank(candidate, target_bank)
        selection_score = (
            -float(result["bad_fraction"])
            + 0.20 * float(result.get("valid_fraction", 1.0))
            + 0.04 * refined.score
            + 0.18 * float(prior_meta["prior_score"])
            + (0.16 if "arm_cycle" in seg.reason else 0.0)
        )
        ranked.append((selection_score, refined, result, seg, prior_meta))

    ranked.sort(key=lambda item: item[0], reverse=True)
    best_score, best_segment, best_result, _, _ = ranked[0]
    return slice_sequence(seq, best_segment.start_frame, best_segment.end_frame), best_segment, {
        **debug,
        "arm_cycle_debug": arm_debug,
        "selected_score": float(best_score),
        "selected_result": {
            "score": best_result.get("score"),
            "bad_fraction": best_result.get("bad_fraction"),
            "matched_reference_id": best_result.get("matched_reference_id"),
        } if best_result is not None else None,
        "segments": [
            {
                "start_frame": refined.start_frame,
                "end_frame": refined.end_frame,
                "frame_count": refined.frame_count,
                "activity_score": refined.score,
                "reason": refined.reason,
                "coarse_start_frame": coarse.start_frame,
                "coarse_end_frame": coarse.end_frame,
                "coarse_frame_count": coarse.frame_count,
                "coarse_activity_score": coarse.score,
                "prior_score": float(prior_meta["prior_score"]),
                "contrast": float(prior_meta["contrast"]),
                "peak_activity": float(prior_meta["peak_activity"]),
                "edge_margin": float(prior_meta["edge_margin"]),
                "duration_ratio": float(prior_meta["duration_ratio"]),
            }
            for _, refined, _, coarse, prior_meta in ranked
        ],
    }

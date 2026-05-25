from __future__ import annotations

import csv
from dataclasses import dataclass
from math import ceil
from pathlib import Path
from typing import Dict, List, Sequence

import numpy as np
import onnxruntime as ort
from torchvision.transforms import Compose


HAND_LANDMARKS = [
    "wrist",
    "indexTip",
    "indexDIP",
    "indexPIP",
    "indexMCP",
    "middleTip",
    "middleDIP",
    "middlePIP",
    "middleMCP",
    "ringTip",
    "ringDIP",
    "ringPIP",
    "ringMCP",
    "littleTip",
    "littleDIP",
    "littlePIP",
    "littleMCP",
    "thumbTip",
    "thumbIP",
    "thumbMP",
    "thumbCMC",
]

BODY_LANDMARKS = [
    "nose",
    "neck",
    "rightEye",
    "leftEye",
    "rightEar",
    "leftEar",
    "rightShoulder",
    "leftShoulder",
    "rightElbow",
    "leftElbow",
    "rightWrist",
    "leftWrist",
]

LANDMARKS = BODY_LANDMARKS + [
    f"{landmark}{suffix}"
    for landmark in HAND_LANDMARKS
    for suffix in ["_0", "_1"]
]


def load_id2label(csv_path: str | Path) -> Dict[str, str]:
    id2label: Dict[str, str] = {}
    with Path(csv_path).open(encoding="utf-8") as handle:
        for row in csv.reader(handle):
            if len(row) >= 2:
                id2label[row[0].strip()] = row[1].strip()
    return id2label


@dataclass(frozen=True)
class ClassifierSegment:
    start_frame: int
    end_frame: int
    reason: str
    score: float

    @property
    def frame_count(self) -> int:
        return max(0, int(self.end_frame) - int(self.start_frame))


def _calculate_angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = abs(float(radians * 180.0 / np.pi))
    if angle > 180.0:
        angle = 360.0 - angle
    return angle


def _arm_angle(results, side: str, visibility: float) -> float | None:
    pose = getattr(results, "pose_landmarks", None)
    if pose is None:
        return None
    landmarks = pose.landmark
    if side == "left":
        shoulder_idx, elbow_idx, wrist_idx = 11, 13, 15
    else:
        shoulder_idx, elbow_idx, wrist_idx = 12, 14, 16
    if wrist_idx >= len(landmarks):
        return None
    triplet = [landmarks[shoulder_idx], landmarks[elbow_idx], landmarks[wrist_idx]]
    if any(float(getattr(item, "visibility", 0.0)) < float(visibility) for item in triplet):
        return None
    a = np.asarray([triplet[0].x, triplet[0].y], dtype=np.float32)
    b = np.asarray([triplet[1].x, triplet[1].y], dtype=np.float32)
    c = np.asarray([triplet[2].x, triplet[2].y], dtype=np.float32)
    return _calculate_angle(a, b, c)


def _arm_up_fraction(results_list: Sequence[object], start: int, end: int, angle_threshold: float, visibility: float) -> float:
    if end <= start:
        return 0.0
    active = 0
    total = 0
    for results in results_list[start:end]:
        total += 1
        left_angle = _arm_angle(results, "left", visibility)
        right_angle = _arm_angle(results, "right", visibility)
        left_up = left_angle is not None and 0.0 < left_angle < angle_threshold
        right_up = right_angle is not None and 0.0 < right_angle < angle_threshold
        if left_up or right_up:
            active += 1
    return float(active) / float(total or 1)


def list_classifier_segments(
    results_list: Sequence[object],
    *,
    fps: float,
    frame_stride: int = 1,
    preferred_start: int | None = None,
    preferred_end: int | None = None,
    visibility: float = 0.5,
    angle_threshold: float = 140.0,
    min_num_up_frames: int = 10,
    min_num_down_frames: int = 10,
    delay_ms: int = 400,
) -> tuple[list[ClassifierSegment], dict[str, float | int | str | None]]:
    if not results_list:
        return [], {
            "reason": "empty",
            "start_frame": 0,
            "end_frame": 0,
            "frame_count": 0,
            "score": 0.0,
        }

    extracted_fps = max(float(fps) / max(int(frame_stride), 1), 1e-6)
    min_up = max(1, int(ceil(float(min_num_up_frames) / max(int(frame_stride), 1))))
    min_down = max(1, int(ceil(float(min_num_down_frames) / max(int(frame_stride), 1))))
    delay_frames = max(0, int(round((float(delay_ms) / 1000.0) * extracted_fps)))

    def new_state() -> dict[str, float | int | bool | None]:
        return {
            "is_up": False,
            "num_up": 0,
            "num_down": 0,
            "start_idx": None,
            "end_idx": None,
        }

    def step_arm(state: dict[str, float | int | bool | None], angle: float | None, current_idx: int) -> bool:
        is_up = bool(state["is_up"])
        if angle is not None and 0.0 < angle < float(angle_threshold):
            if is_up:
                state["num_down"] = 0
                state["end_idx"] = None
            else:
                if int(state["num_up"]) >= min_up:
                    state["is_up"] = True
                    state["num_up"] = 0
                else:
                    if int(state["num_up"]) == 0:
                        state["start_idx"] = max(0, current_idx - delay_frames)
                    state["num_up"] = int(state["num_up"]) + 1
                    return False
        else:
            if is_up:
                if int(state["num_down"]) >= min_down:
                    state["is_up"] = False
                    state["num_down"] = 0
                else:
                    if int(state["num_down"]) == 0:
                        state["end_idx"] = min(len(results_list), current_idx + delay_frames)
                    state["num_down"] = int(state["num_down"]) + 1
                    return True
            else:
                state["num_up"] = 0
                state["start_idx"] = None
        return bool(state["is_up"])

    def merged_bounds(left_state: dict[str, float | int | bool | None], right_state: dict[str, float | int | bool | None]) -> tuple[int, int] | None:
        starts = [value for value in (left_state["start_idx"], right_state["start_idx"]) if value is not None]
        ends = [value for value in (left_state["end_idx"], right_state["end_idx"]) if value is not None]
        if not starts or not ends:
            return None
        start = int(max(0, min(starts)))
        end = int(min(len(results_list), max(ends)))
        if end <= start:
            return None
        return start, end

    left_state = new_state()
    right_state = new_state()
    segments: list[ClassifierSegment] = []

    for idx, results in enumerate(results_list):
        left_active = step_arm(left_state, _arm_angle(results, "left", visibility), idx)
        right_active = step_arm(right_state, _arm_angle(results, "right", visibility), idx)
        bounds = merged_bounds(left_state, right_state)
        if bounds is not None and not left_active and not right_active:
            start, end = bounds
            up_fraction = _arm_up_fraction(results_list, start, end, angle_threshold, visibility)
            score = (end - start) + 12.0 * up_fraction
            segments.append(ClassifierSegment(start, end, "arm_cycle", score))
            left_state = new_state()
            right_state = new_state()

    final_bounds = merged_bounds(left_state, right_state)
    if final_bounds is not None:
        start, end = final_bounds
        up_fraction = _arm_up_fraction(results_list, start, end, angle_threshold, visibility)
        score = (end - start) + 12.0 * up_fraction
        segments.append(ClassifierSegment(start, end, "arm_cycle_video_end", score))

    return segments, {
        "preferred_start": int(preferred_start) if preferred_start is not None else None,
        "preferred_end": int(preferred_end) if preferred_end is not None else None,
        "num_candidates": int(len(segments)),
        "reason": "arm_cycle_candidates" if segments else "empty",
    }


def select_classifier_segment(
    results_list: Sequence[object],
    *,
    fps: float,
    frame_stride: int = 1,
    preferred_start: int | None = None,
    preferred_end: int | None = None,
    visibility: float = 0.5,
    angle_threshold: float = 140.0,
    min_num_up_frames: int = 10,
    min_num_down_frames: int = 10,
    delay_ms: int = 400,
) -> tuple[list[object], dict[str, float | int | str | None]]:
    if not results_list:
        return [], {
            "reason": "empty",
            "start_frame": 0,
            "end_frame": 0,
            "frame_count": 0,
            "score": 0.0,
        }

    segments, debug = list_classifier_segments(
        results_list,
        fps=fps,
        frame_stride=frame_stride,
        preferred_start=preferred_start,
        preferred_end=preferred_end,
        visibility=visibility,
        angle_threshold=angle_threshold,
        min_num_up_frames=min_num_up_frames,
        min_num_down_frames=min_num_down_frames,
        delay_ms=delay_ms,
    )
    if not segments:
        if preferred_start is not None and preferred_end is not None and int(preferred_end) > int(preferred_start):
            start = max(0, int(preferred_start))
            end = min(len(results_list), int(preferred_end))
            return list(results_list[start:end]), {
                "reason": "fallback_preferred_segment",
                "start_frame": start,
                "end_frame": end,
                "frame_count": max(0, end - start),
                "score": float(end - start),
            }
        return list(results_list), {
            "reason": "fallback_full_video",
            "start_frame": 0,
            "end_frame": len(results_list),
            "frame_count": len(results_list),
            "score": float(len(results_list)),
        }

    def ranking_key(segment: ClassifierSegment) -> tuple[float, float, float]:
        overlap = 0.0
        if preferred_start is not None and preferred_end is not None:
            overlap = float(max(0, min(segment.end_frame, int(preferred_end)) - max(segment.start_frame, int(preferred_start))))
        up_fraction = _arm_up_fraction(results_list, segment.start_frame, segment.end_frame, angle_threshold, visibility)
        return (overlap, up_fraction, segment.score)

    best = max(segments, key=ranking_key)
    return list(results_list[best.start_frame:best.end_frame]), {
        "reason": best.reason,
        "start_frame": int(best.start_frame),
        "end_frame": int(best.end_frame),
        "frame_count": int(best.frame_count),
        "score": float(best.score),
        "preferred_start": int(preferred_start) if preferred_start is not None else None,
        "preferred_end": int(preferred_end) if preferred_end is not None else None,
        "num_candidates": int(debug["num_candidates"]),
    }


class SPOTERONNXInferer:
    def __init__(
        self,
        onnx_path: str | Path,
        id2label: Dict[str, str],
        num_frames: int = 100,
        top_k: int = 3,
        device: str = "auto",
        num_cpu_threads: int = 4,
    ):
        self.top_k = top_k
        self.num_frames = num_frames
        self.id2label = id2label
        self._index_to_gloss = {
            int(idx): gloss
            for idx, gloss in (
                (int(k), v) for k, v in self.id2label.items() if str(k).strip().isdigit()
            )
        }

        so = ort.SessionOptions()
        so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        so.enable_mem_pattern = True
        so.execution_mode = ort.ExecutionMode.ORT_PARALLEL
        if device == "gpu":
            so.intra_op_num_threads = 1
            so.inter_op_num_threads = 1
        else:
            so.intra_op_num_threads = num_cpu_threads
            so.inter_op_num_threads = 1

        providers: list[object] = ["CPUExecutionProvider"]
        if device != "cpu" and "CUDAExecutionProvider" in ort.get_available_providers():
            providers = [
                (
                    "CUDAExecutionProvider",
                    {
                        "arena_extend_strategy": "kNextPowerOfTwo",
                        "gpu_mem_limit": 8 * 1024 * 1024 * 1024,
                        "do_copy_in_default_stream": 1,
                    },
                ),
                "CPUExecutionProvider",
            ]

        self.session = ort.InferenceSession(str(onnx_path), sess_options=so, providers=providers)
        self.transforms = Compose(
            [
                JointSelect(),
                Pad(self.num_frames),
                TensorToDict(),
                SingleBodyDictNormalize(),
                SingleHandDictNormalize(),
                DictToTensor(),
                Shift(),
            ]
        )

    def _predict_probs(self, mediapipe_list: list) -> np.ndarray:
        tensor = self.transforms(mediapipe_list).unsqueeze(0).float()
        input_numpy = tensor.numpy()
        logits = self.session.run(None, {"poses": input_numpy})[0]
        exp = np.exp(logits - np.max(logits, axis=1, keepdims=True))
        probs = exp / np.sum(exp, axis=1, keepdims=True)
        return probs[0]

    def infer_ranked(
        self,
        mediapipe_list: list,
        allowed_glosses: Sequence[str] | None = None,
        top_k: int | None = None,
    ) -> List[Dict[str, float]]:
        probs = self._predict_probs(mediapipe_list)
        allowed = set(allowed_glosses) if allowed_glosses is not None else None

        results = []
        for idx, prob in enumerate(probs.tolist()):
            gloss = self._index_to_gloss.get(idx, f"unk_{idx}")
            if allowed is not None and gloss not in allowed:
                continue
            results.append({"gloss": gloss, "score": float(prob)})

        results.sort(key=lambda item: item["score"], reverse=True)
        limit = self.top_k if top_k is None else max(1, int(top_k))
        return results[:limit]

    def infer(self, mediapipe_list: list) -> List[Dict[str, float]]:
        return self.infer_ranked(mediapipe_list, allowed_glosses=None, top_k=self.top_k)


class JointSelect:
    def __init__(self):
        self.pose_idxs = (0, -1, 5, 2, 8, 7, 12, 11, 14, 13, 16, 15)
        self.hand_idxs = (
            0,
            8, 7, 6, 5,
            12, 11, 10, 9,
            16, 15, 14, 13,
            20, 19, 18, 17,
            4, 3, 2, 1,
        )

    def __parse(self, idxs, landmarks):
        if landmarks is None:
            return np.zeros((len(idxs), 2))
        out = []
        for idx in idxs:
            if idx == -1:
                out.append([0, 0])
            else:
                landmark = landmarks.landmark[idx]
                out.append([landmark.x, landmark.y])
        return np.asarray(out)

    def __call__(self, poses):
        import torch

        total = len(self.pose_idxs) + len(self.hand_idxs) * 2
        arr = np.zeros((len(poses), total, 2), dtype=np.float32)
        for i, pose in enumerate(poses):
            arr[i] = np.vstack(
                [
                    self.__parse(self.pose_idxs, pose.pose_landmarks),
                    self.__parse(self.hand_idxs, pose.left_hand_landmarks),
                    self.__parse(self.hand_idxs, pose.right_hand_landmarks),
                ]
            )
        return torch.from_numpy(arr)


class Pad:
    def __init__(self, num_frames: int = 150):
        self.num_frames = num_frames

    def __call__(self, data):
        import torch

        frames, points, _ = data.shape
        if frames == self.num_frames:
            return data
        if frames < self.num_frames:
            out = torch.zeros((self.num_frames, points, 2), dtype=data.dtype)
            out[:frames] = data
            rest = self.num_frames - frames
            loops = int(np.ceil(rest / frames))
            pad_block = torch.cat([data] * loops, dim=0)[:rest]
            out[frames:] = pad_block
            return out

        indices = np.linspace(0, frames - 1, self.num_frames, dtype=int)
        return data[indices]


class TensorToDict:
    def __call__(self, data):
        arr = data.numpy()
        return {landmark: arr[:, i] for i, landmark in enumerate(LANDMARKS)}


class SingleBodyDictNormalize:
    def __call__(self, row):
        sequence_size = len(row["leftEar"])
        valid = True
        last_start = None
        last_end = None
        for t in range(sequence_size):
            left_shoulder = row["leftShoulder"][t]
            right_shoulder = row["rightShoulder"][t]
            neck = row["neck"][t]
            nose = row["nose"][t]

            if (left_shoulder[0] == 0 or right_shoulder[0] == 0) and (neck[0] == 0 or nose[0] == 0):
                if last_start is None:
                    valid = False
                    continue
                start = last_start
                end = last_end
            else:
                if left_shoulder[0] != 0 and right_shoulder[0] != 0:
                    dist = np.linalg.norm(left_shoulder - right_shoulder)
                else:
                    dist = np.linalg.norm(neck - nose)
                start = [neck[0] - 3 * dist, row["leftEye"][t][1] + dist]
                end = [neck[0] + 3 * dist, start[1] - 6 * dist]
                last_start = start
                last_end = end

            start[0] = max(start[0], 0)
            start[1] = max(start[1], 0)
            end[0] = max(end[0], 0)
            end[1] = max(end[1], 0)

            for landmark in BODY_LANDMARKS:
                if row[landmark][t][0] == 0:
                    continue
                denom_x = end[0] - start[0]
                denom_y = start[1] - end[1]
                if denom_x == 0 or denom_y == 0:
                    valid = False
                    break
                row[landmark][t][0] = (row[landmark][t][0] - start[0]) / denom_x
                row[landmark][t][1] = (row[landmark][t][1] - end[1]) / denom_y
        return row


class SingleHandDictNormalize:
    def __call__(self, row):
        range_size = 2 if "wrist_1" in row else 1
        hand_map = {hand_idx: [f"{landmark}_{hand_idx}" for landmark in HAND_LANDMARKS] for hand_idx in range(range_size)}

        for hand_idx in range(range_size):
            sequence_size = len(row[f"wrist_{hand_idx}"])
            for t in range(sequence_size):
                xs = [row[key][t][0] for key in hand_map[hand_idx] if row[key][t][0] != 0]
                ys = [row[key][t][1] for key in hand_map[hand_idx] if row[key][t][1] != 0]
                if not xs or not ys:
                    continue
                width = max(xs) - min(xs)
                height = max(ys) - min(ys)
                if width > height:
                    dx = 0.1 * width
                    dy = dx + (width - height) / 2
                else:
                    dy = 0.1 * height
                    dx = dy + (height - width) / 2
                start = (min(xs) - dx, min(ys) - dy)
                end = (max(xs) + dx, max(ys) + dy)
                denom_x = end[0] - start[0]
                denom_y = end[1] - start[1]
                if denom_x == 0 or denom_y == 0:
                    continue
                for key in hand_map[hand_idx]:
                    px, py = row[key][t]
                    if px == 0:
                        continue
                    row[key][t][0] = (px - start[0]) / denom_x
                    row[key][t][1] = (py - start[1]) / denom_y
        return row


class DictToTensor:
    def __call__(self, row):
        import torch

        arr = np.stack([row[landmark] for landmark in LANDMARKS], axis=1).astype(np.float32, copy=False)
        return torch.from_numpy(arr)


class Shift:
    def __call__(self, data):
        return data - 0.5

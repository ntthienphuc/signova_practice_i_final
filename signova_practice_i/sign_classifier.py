from __future__ import annotations

import csv
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


class SPOTERONNXInferer:
    def __init__(
        self,
        onnx_path: str | Path,
        id2label: Dict[str, str],
        num_frames: int = 70,
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
        arr = np.zeros((len(poses), total, 2))
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
        last_start = None
        last_end = None
        for t in range(sequence_size):
            left_shoulder = row["leftShoulder"][t]
            right_shoulder = row["rightShoulder"][t]
            neck = row["neck"][t]
            nose = row["nose"][t]

            if (left_shoulder[0] == 0 or right_shoulder[0] == 0) and (neck[0] == 0 or nose[0] == 0):
                if last_start is None:
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
                    continue
                row[landmark][t][0] = (row[landmark][t][0] - start[0]) / denom_x
                row[landmark][t][1] = (row[landmark][t][1] - end[1]) / denom_y
        return row


class SingleHandDictNormalize:
    def __call__(self, row):
        hand_map = {idx: [f"{landmark}_{idx}" for landmark in HAND_LANDMARKS] for idx in range(2)}
        for hand_idx in range(2):
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
                for key in hand_map[hand_idx]:
                    px, py = row[key][t]
                    if px == 0:
                        continue
                    row[key][t][0] = (px - start[0]) / (end[0] - start[0])
                    row[key][t][1] = (py - start[1]) / (end[1] - start[1])
        return row


class DictToTensor:
    def __call__(self, data):
        import torch

        frames = len(data["leftEar"])
        points = len(LANDMARKS)
        out = np.empty((frames, points, 2))
        for i, landmark in enumerate(LANDMARKS):
            out[:, i] = data[landmark]
        return torch.from_numpy(out)


class Shift:
    def __call__(self, data):
        return data - 0.5

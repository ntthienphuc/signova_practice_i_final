from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Tuple

import cv2
import mediapipe as mp
import numpy as np

from .pose_utils import BODY_JOINTS, HAND_POINTS, PoseSequence
from .render import draw_pose


def _empty_frame_points() -> tuple[np.ndarray, np.ndarray, List[str], Dict[str, List[int]]]:
    xy: List[Tuple[float, float]] = []
    conf: List[float] = []
    names: List[str] = []
    groups: Dict[str, List[int]] = {"body": [], "left_hand": [], "right_hand": []}

    for name in BODY_JOINTS:
        groups["body"].append(len(names))
        names.append(name)
        xy.append((np.nan, np.nan))
        conf.append(0.0)
    for point in HAND_POINTS:
        groups["left_hand"].append(len(names))
        names.append(f"left_{point}")
        xy.append((np.nan, np.nan))
        conf.append(0.0)
    for point in HAND_POINTS:
        groups["right_hand"].append(len(names))
        names.append(f"right_{point}")
        xy.append((np.nan, np.nan))
        conf.append(0.0)
    return np.array(xy, dtype=np.float32), np.array(conf, dtype=np.float32), names, groups


def _extract_frame_points(results, width: int, height: int) -> tuple[np.ndarray, np.ndarray, List[str], Dict[str, List[int]]]:
    xy, conf, names, groups = _empty_frame_points()

    if results.pose_landmarks is not None:
        landmarks = results.pose_landmarks.landmark
        for local_idx, (_, mp_idx) in enumerate(BODY_JOINTS.items()):
            landmark = landmarks[mp_idx]
            xy[local_idx] = (landmark.x * width, landmark.y * height)
            conf[local_idx] = float(getattr(landmark, "visibility", 1.0))

    for side, hand_landmarks, offset in (
        ("left_hand", results.left_hand_landmarks, len(BODY_JOINTS)),
        ("right_hand", results.right_hand_landmarks, len(BODY_JOINTS) + len(HAND_POINTS)),
    ):
        if hand_landmarks is None:
            continue
        for i, landmark in enumerate(hand_landmarks.landmark):
            xy[offset + i] = (landmark.x * width, landmark.y * height)
            conf[offset + i] = 1.0

    return xy, conf, names, groups


def extract_video_pose_and_results(
    video_path: str | Path,
    max_frames: int | None = None,
    frame_stride: int = 1,
) -> tuple[PoseSequence, list[Any], dict[str, float]]:
    video_path = Path(video_path)
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 25.0)
    frame_width = float(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0.0)
    frame_height = float(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0.0)

    frames_xy: List[np.ndarray] = []
    frames_conf: List[np.ndarray] = []
    frames_results: List[Any] = []
    names: List[str] | None = None
    groups: Dict[str, List[int]] | None = None
    holistic = None

    frame_idx = 0
    kept = 0
    try:
        holistic = mp.solutions.holistic.Holistic(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            enable_segmentation=False,
            refine_face_landmarks=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        while True:
            if frame_idx % frame_stride != 0:
                if not cap.grab():
                    break
                frame_idx += 1
                continue
            ok, frame = cap.read()
            if not ok:
                break
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb.flags.writeable = False
            results = holistic.process(rgb)
            xy, conf, names, groups = _extract_frame_points(results, frame.shape[1], frame.shape[0])
            frames_xy.append(xy)
            frames_conf.append(conf)
            frames_results.append(results)
            kept += 1
            frame_idx += 1
            if max_frames is not None and kept >= max_frames:
                break
    finally:
        if holistic is not None:
            holistic.close()
        cap.release()

    if not frames_xy or names is None or groups is None:
        raise RuntimeError(f"No frames could be processed from video: {video_path}")

    return (
        PoseSequence(
            xy=np.stack(frames_xy, axis=0),
            confidence=np.stack(frames_conf, axis=0),
            names=names,
            groups=groups,
        ),
        frames_results,
        {
            "fps": fps,
            "frame_width": frame_width,
            "frame_height": frame_height,
        },
    )


def extract_video_pose(video_path: str | Path, max_frames: int | None = None, frame_stride: int = 1) -> PoseSequence:
    pose, _, _ = extract_video_pose_and_results(video_path, max_frames=max_frames, frame_stride=frame_stride)
    return pose


def render_user_overlay_video(
    input_video: str | Path,
    user_pose: PoseSequence,
    bad_masks: np.ndarray,
    output_path: str | Path,
    slow_factor: float = 1.0,
    source_start_frame: int = 0,
    source_end_frame: int | None = None,
) -> Path:
    input_video = Path(input_video)
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(str(input_video))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {input_video}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    output_fps = fps / max(float(slow_factor), 1.0)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 640)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 480)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or len(user_pose.xy))
    writer = cv2.VideoWriter(
        str(output_path),
        cv2.VideoWriter_fourcc(*"mp4v"),
        output_fps,
        (width, height),
    )

    if source_start_frame > 0:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(source_start_frame))
    if source_end_frame is None:
        source_end_frame = frame_count
    render_frame_count = max(1, int(source_end_frame) - int(source_start_frame))

    if len(user_pose.xy) != frame_count:
        from .pose_utils import resample_sequence

        user_pose = resample_sequence(user_pose, max(render_frame_count, 1))
    bad_masks_float = bad_masks.astype(np.float32)
    bad_masks_r = cv2.resize(
        bad_masks_float.T,
        (max(render_frame_count, 1), bad_masks_float.shape[1]),
        interpolation=cv2.INTER_NEAREST,
    ).T > 0.5

    idx = 0
    while True:
        absolute_frame = int(source_start_frame) + idx
        if absolute_frame >= int(source_end_frame):
            break
        ok, frame = cap.read()
        if not ok:
            break
        bad_mask = bad_masks_r[:, min(idx, bad_masks_r.shape[1] - 1)]
        writer.write(draw_pose(frame, user_pose, idx, bad_mask))
        idx += 1

    writer.release()
    cap.release()
    return output_path

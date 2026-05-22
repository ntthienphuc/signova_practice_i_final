from __future__ import annotations

import argparse
import json
import tempfile
from pathlib import Path
from typing import Any
import sys
import re
import unicodedata

import cv2
import numpy as np
import requests

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from signova_practice_i.render import draw_pose
from signova_practice_i.video_engine import extract_video_pose


def ascii_slug(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_text = re.sub(r"[^A-Za-z0-9]+", "_", ascii_text).strip("_")
    return ascii_text or "gloss"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-url", default="http://127.0.0.1:8010")
    parser.add_argument("--mode", choices=["practice_i", "practice_ii"], default="practice_i")
    parser.add_argument("--target-gloss", required=True)
    parser.add_argument("--video-path", required=True)
    parser.add_argument(
        "--reference-manifest",
        default="outputs/reference_bank_20_best_allcam1_fe/display_reference_manifest.json",
    )
    parser.add_argument("--reference-video", default="")
    parser.add_argument("--lesson-glosses", default="")
    parser.add_argument("--out-dir", default="outputs/fe_simulator_exports")
    parser.add_argument("--frame-stride", type=int, default=1)
    parser.add_argument("--segment-min-frames", type=int, default=12)
    parser.add_argument("--segment-pad-frames", type=int, default=8)
    parser.add_argument("--segment-max-frames", type=int, default=80)
    return parser.parse_args()


def load_reference_video(reference_manifest: Path, target_gloss: str) -> Path:
    payload = json.loads(reference_manifest.read_text(encoding="utf-8"))
    for item in payload["references"]:
        if item["gloss"] == target_gloss:
            return Path(item["video_path"])
    raise KeyError(f"No reference video found for gloss: {target_gloss}")


def call_api(args: argparse.Namespace) -> dict[str, Any]:
    endpoint = "practice-i/analyze-video" if args.mode == "practice_i" else "practice-ii/analyze-video"
    data = {
        "target_gloss": args.target_gloss,
        "frame_stride": str(args.frame_stride),
        "auto_segment": "true",
        "segment_min_frames": str(args.segment_min_frames),
        "segment_pad_frames": str(args.segment_pad_frames),
        "segment_max_frames": str(args.segment_max_frames),
        "return_visualization": "true",
    }
    if args.mode == "practice_ii" and args.lesson_glosses.strip():
        data["lesson_glosses"] = args.lesson_glosses
    with Path(args.video_path).open("rb") as handle:
        response = requests.post(
            f"{args.api_url.rstrip('/')}/{endpoint}",
            data=data,
            files={"video": (Path(args.video_path).name, handle, "video/mp4")},
            timeout=240,
        )
    response.raise_for_status()
    return response.json()


def build_bad_mask(visualization: dict[str, Any]) -> np.ndarray:
    joint_names = visualization["joint_names"]
    frame_count = int(visualization["frame_count"])
    name_to_idx = {name: idx for idx, name in enumerate(joint_names)}
    bad_mask = np.zeros((frame_count, len(joint_names)), dtype=bool)
    for item in visualization["joint_status"]:
        if item.get("status") != "bad":
            continue
        frame_idx = int(item["frame"])
        joint_idx = name_to_idx.get(item["body_part"])
        if joint_idx is None:
            continue
        bad_mask[frame_idx, joint_idx] = True
    return bad_mask


def render_pose_segment_video(
    input_video: Path,
    pose_xy: np.ndarray,
    pose_conf: np.ndarray,
    pose_names: list[str],
    output_path: Path,
    *,
    start_frame: int = 0,
    end_frame: int | None = None,
    bad_mask: np.ndarray | None = None,
    good_color: tuple[int, int, int] = (0, 220, 80),
    bad_color: tuple[int, int, int] = (30, 30, 230),
) -> Path:
    cap = cv2.VideoCapture(str(input_video))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {input_video}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 640)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 480)
    full_frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or len(pose_xy))
    if end_frame is None:
        end_frame = full_frame_count
    render_frame_count = max(int(end_frame) - int(start_frame), 1)

    pose_xy_r = pose_xy
    pose_conf_r = pose_conf
    if len(pose_xy_r) != render_frame_count:
        src_x = np.linspace(0.0, 1.0, len(pose_xy_r))
        dst_x = np.linspace(0.0, 1.0, render_frame_count)
        pose_xy_flat = pose_xy_r.reshape(len(pose_xy_r), -1)
        pose_xy_resampled = np.empty((render_frame_count, pose_xy_flat.shape[1]), dtype=np.float32)
        for col in range(pose_xy_flat.shape[1]):
            pose_xy_resampled[:, col] = np.interp(dst_x, src_x, pose_xy_flat[:, col])
        pose_xy_r = pose_xy_resampled.reshape(render_frame_count, pose_xy_r.shape[1], pose_xy_r.shape[2])

        pose_conf_flat = pose_conf_r.reshape(len(pose_conf_r), -1)
        pose_conf_resampled = np.empty((render_frame_count, pose_conf_flat.shape[1]), dtype=np.float32)
        for col in range(pose_conf_flat.shape[1]):
            pose_conf_resampled[:, col] = np.interp(dst_x, src_x, pose_conf_flat[:, col])
        pose_conf_r = pose_conf_resampled.reshape(render_frame_count, pose_conf_r.shape[1])

    if bad_mask is not None and len(bad_mask) != render_frame_count:
        bad_mask_r = cv2.resize(
            bad_mask.astype(np.float32).T,
            (render_frame_count, bad_mask.shape[1]),
            interpolation=cv2.INTER_NEAREST,
        ).T > 0.5
    else:
        bad_mask_r = bad_mask

    output_path.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(
        str(output_path),
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (width, height),
    )

    cap.set(cv2.CAP_PROP_POS_FRAMES, int(start_frame))
    for frame_idx in range(render_frame_count):
        ok, frame = cap.read()
        if not ok:
            break
        seq = type("PoseSeq", (), {})()
        seq.xy = pose_xy_r
        seq.confidence = pose_conf_r
        seq.names = pose_names
        overlay = draw_pose(
            frame,
            seq,
            frame_idx,
            None if bad_mask_r is None else bad_mask_r[frame_idx],
            good_color=good_color,
            bad_color=bad_color,
        )
        writer.write(overlay)

    writer.release()
    cap.release()
    return output_path


def compose_side_by_side(
    user_video: Path,
    ref_video: Path,
    output_path: Path,
    *,
    gloss: str,
    score: float,
) -> Path:
    user_cap = cv2.VideoCapture(str(user_video))
    ref_cap = cv2.VideoCapture(str(ref_video))
    if not user_cap.isOpened():
        raise RuntimeError(f"Cannot open user overlay video: {user_video}")
    if not ref_cap.isOpened():
        raise RuntimeError(f"Cannot open reference overlay video: {ref_video}")

    fps = user_cap.get(cv2.CAP_PROP_FPS) or 25.0
    user_w = int(user_cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 640)
    user_h = int(user_cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 480)
    ref_w = int(ref_cap.get(cv2.CAP_PROP_FRAME_WIDTH) or user_w)
    ref_h = int(ref_cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or user_h)
    panel_h = min(user_h, ref_h)
    user_panel_w = int(user_w * panel_h / max(user_h, 1))
    ref_panel_w = int(ref_w * panel_h / max(ref_h, 1))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(
        str(output_path),
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (user_panel_w + ref_panel_w, panel_h),
    )

    gloss_label = ascii_slug(gloss)
    while True:
        ok_user, user_frame = user_cap.read()
        if not ok_user:
            break
        ok_ref, ref_frame = ref_cap.read()
        if not ok_ref:
            ref_cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ok_ref, ref_frame = ref_cap.read()
            if not ok_ref:
                ref_frame = np.zeros((panel_h, ref_panel_w, 3), dtype=np.uint8)

        user_panel = cv2.resize(user_frame, (user_panel_w, panel_h))
        ref_panel = cv2.resize(ref_frame, (ref_panel_w, panel_h))
        combined = np.concatenate([user_panel, ref_panel], axis=1)
        cv2.putText(combined, "USER TEST", (16, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(combined, "REFERENCE", (user_panel_w + 16, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(
            combined,
            f"gloss={gloss_label} score={score:.1f}",
            (16, panel_h - 18),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.62,
            (255, 255, 255),
            2,
        )
        writer.write(combined)

    writer.release()
    user_cap.release()
    ref_cap.release()
    return output_path


def main() -> None:
    args = parse_args()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    reference_video = Path(args.reference_video) if args.reference_video else load_reference_video(
        Path(args.reference_manifest),
        args.target_gloss,
    )
    response = call_api(args)
    attempt_id = response["attempt_id"]
    attempt_dir = out_dir / f"{ascii_slug(args.target_gloss)}_{attempt_id}"
    attempt_dir.mkdir(parents=True, exist_ok=True)
    (attempt_dir / "api_response.json").write_text(json.dumps(response, ensure_ascii=False, indent=2), encoding="utf-8")

    user_pose = extract_video_pose(args.video_path, frame_stride=1)
    ref_pose = extract_video_pose(reference_video, frame_stride=1)
    segment = response["segment"]
    viz = response["visualization"]
    bad_mask = build_bad_mask(viz)

    user_start = int(segment["start_source_frame"])
    user_end = int(segment["end_source_frame"])
    user_pose_segment_xy = user_pose.xy[user_start:user_end]
    user_pose_segment_conf = user_pose.confidence[user_start:user_end]

    user_overlay_path = attempt_dir / "user_overlay.mp4"
    ref_overlay_path = attempt_dir / "reference_overlay.mp4"
    combined_path = attempt_dir / "fe_side_by_side.mp4"

    render_pose_segment_video(
        Path(args.video_path),
        user_pose_segment_xy,
        user_pose_segment_conf,
        user_pose.names,
        user_overlay_path,
        start_frame=user_start,
        end_frame=user_end,
        bad_mask=bad_mask,
    )
    render_pose_segment_video(
        reference_video,
        ref_pose.xy,
        ref_pose.confidence,
        ref_pose.names,
        ref_overlay_path,
        start_frame=0,
        end_frame=None,
        bad_mask=None,
        good_color=(0, 220, 80),
        bad_color=(0, 220, 80),
    )
    compose_side_by_side(
        user_overlay_path,
        ref_overlay_path,
        combined_path,
        gloss=args.target_gloss,
        score=float(response["score"]),
    )

    print(
        json.dumps(
            {
                "attempt_dir": str(attempt_dir),
                "combined_video": str(combined_path),
                "reference_video": str(reference_video),
                "score": float(response["score"]),
            },
            ensure_ascii=True,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

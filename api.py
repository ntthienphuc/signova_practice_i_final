from __future__ import annotations

import os
import random
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import Any
from urllib.parse import quote

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db import get_db
from app.auth import get_current_user_optional
from app.services.practice import save_practice_attempt

from signova_practice_i.bank_store import BankStore
from signova_practice_i.pose_utils import (
    PoseSequence,
    build_compact_overlay_payload,
    build_visualization_payload,
    compare_to_reference_bank,
)
from signova_practice_i.scoring import (
    decision_for_practice_ii,
    decision_for_target,
    public_result,
    rank_sequence_against_banks,
    with_lesson_scores,
)
from signova_practice_i.segmentation import select_best_segment
from signova_practice_i.sign_classifier import SPOTERONNXInferer, load_id2label, select_classifier_segment
from signova_practice_i.video_engine import extract_video_pose_and_results


APP_DIR = Path(__file__).resolve().parent
DEFAULT_BANK_ROOT = APP_DIR / "outputs" / "reference_bank_20_best_allcam1_fe"
LOCAL_SIGN_MODEL_PATH = APP_DIR / "models" / "spoter_v3.0.onnx"
LOCAL_SIGN_GLOSS_CSV = APP_DIR / "gloss.csv"
DEFAULT_SIGN_MODEL_PATH = LOCAL_SIGN_MODEL_PATH if LOCAL_SIGN_MODEL_PATH.exists() else Path(r"D:\Project\MultiModel\App\models\spoter_v3.0.onnx")
DEFAULT_SIGN_GLOSS_CSV = LOCAL_SIGN_GLOSS_CSV if LOCAL_SIGN_GLOSS_CSV.exists() else Path(r"D:\Project\MultiModel\App\gloss.csv")
PLAYBACK_CACHE_ROOT = APP_DIR / "outputs" / "web_playback_cache"
CURRICULUM_TOPIC_SIZE = 10
CURRICULUM_TITLES = [
    ("topic_1", "Chủ đề 1", "10 từ đầu tiên"),
    ("topic_2", "Chủ đề 2", "10 từ tiếp theo"),
]


def create_app() -> FastAPI:
    bank_root = Path(os.getenv("SIGNOVA_BANK_ROOT", str(DEFAULT_BANK_ROOT)))
    sign_model_path = Path(os.getenv("SIGNOVA_SIGN_MODEL_PATH", str(DEFAULT_SIGN_MODEL_PATH)))
    sign_gloss_csv = Path(os.getenv("SIGNOVA_SIGN_GLOSS_CSV", str(DEFAULT_SIGN_GLOSS_CSV)))
    store = BankStore(bank_root)
    sign_classifier: SPOTERONNXInferer | None = None
    sign_classifier_error: str | None = None
    reference_pose_cache: dict[str, dict[str, Any]] = {}
    reference_study_cache: dict[str, dict[str, Any]] = {}
    reference_duration_cache: dict[str, float] = {}
    curriculum_cache: dict[str, Any] | None = None
    rng = random.SystemRandom()
    playback_cache_dir = PLAYBACK_CACHE_ROOT
    playback_cache_dir.mkdir(parents=True, exist_ok=True)

    app = FastAPI(title="SIGNOVA Practice I/II Engine", version="0.4.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from app.routers import auth as auth_router, curriculum as curriculum_router, progress as progress_router, link as link_router, dashboard as dashboard_router, teacher as teacher_router, mascot as mascot_router
    app.include_router(auth_router.router)
    app.include_router(curriculum_router.router)
    app.include_router(progress_router.router)
    app.include_router(link_router.router)
    app.include_router(dashboard_router.router)
    app.include_router(teacher_router.router)
    app.include_router(mascot_router.router)

    @app.on_event("startup")
    def repair_database_progress():
        from app.db import SessionLocal
        from app.models.attempt import PracticeAttempt
        from app.models.progress import LearnerWordProgress
        
        db = SessionLocal()
        try:
            # 1. Update all attempts with score >= 60.0 to accepted = True
            attempts_to_fix = db.query(PracticeAttempt).filter(
                PracticeAttempt.score >= 60.0,
                PracticeAttempt.accepted == False
            ).all()
            
            if attempts_to_fix:
                print(f"Startup Repair: Fixing {len(attempts_to_fix)} attempts that scored >= 60 but were marked as not accepted.")
                for attempt in attempts_to_fix:
                    attempt.accepted = True
                db.commit()
                
            # 2. Recalculate word progress stats
            all_wp = db.query(LearnerWordProgress).all()
            for wp in all_wp:
                attempts = db.query(PracticeAttempt).filter(
                    PracticeAttempt.learner_user_id == wp.learner_user_id,
                    PracticeAttempt.word_id == wp.word_id
                ).all()
                if attempts:
                    correct_count = sum(1 for a in attempts if a.accepted)
                    failed_count = sum(1 for a in attempts if not a.accepted)
                    best_score = max(a.score for a in attempts)
                    last_score = attempts[-1].score
                    accepted_once = any(a.accepted for a in attempts)
                    
                    wp.correct_attempt_count = correct_count
                    wp.failed_attempt_count = failed_count
                    wp.best_practice1_score = best_score
                    wp.last_practice1_score = last_score
                    wp.accepted_once = accepted_once
            db.commit()
            print("Startup Repair: Database progress stats successfully recalculated and synchronized.")
        except Exception as e:
            print(f"Startup Repair Error: {e}")
            db.rollback()
        finally:
            db.close()

    def get_sign_classifier() -> SPOTERONNXInferer:
        nonlocal sign_classifier, sign_classifier_error
        if sign_classifier is not None:
            return sign_classifier
        if sign_classifier_error is not None:
            raise RuntimeError(sign_classifier_error)
        if not sign_model_path.exists():
            sign_classifier_error = f"Missing sign model: {sign_model_path}"
            raise RuntimeError(sign_classifier_error)
        if not sign_gloss_csv.exists():
            sign_classifier_error = f"Missing sign gloss CSV: {sign_gloss_csv}"
            raise RuntimeError(sign_classifier_error)
        sign_classifier = SPOTERONNXInferer(
            sign_model_path,
            load_id2label(sign_gloss_csv),
            num_frames=100,
            top_k=3,
        )
        return sign_classifier

    def resolve_lesson_glosses(raw_text: str | None, *, require_multi: bool) -> list[str]:
        allowed = set(store.list_glosses())
        if raw_text is None or not raw_text.strip():
            lesson_glosses = store.list_glosses()
        else:
            lesson_glosses = [item.strip() for item in raw_text.split(",") if item.strip()]
            unknown = [item for item in lesson_glosses if item not in allowed]
            if unknown:
                raise HTTPException(status_code=400, detail=f"Unknown lesson_glosses: {unknown}")
        if require_multi and len(lesson_glosses) < 2:
            raise HTTPException(status_code=400, detail="lesson_glosses must contain at least 2 glosses")
        return lesson_glosses

    def safe_slug(text: str) -> str:
        chars = []
        for ch in text:
            if ch.isalnum():
                chars.append(ch.lower())
            else:
                chars.append("_")
        out = "".join(chars).strip("_")
        while "__" in out:
            out = out.replace("__", "_")
        return out or "item"

    def ffmpeg_transcode_h264(source: Path, target: Path) -> Path:
        if target.exists() and target.stat().st_size > 0:
            return target
        target.parent.mkdir(parents=True, exist_ok=True)
        tmp_target = target.with_suffix(".tmp.mp4")
        if tmp_target.exists():
            tmp_target.unlink()
        command = [
            "ffmpeg",
            "-y",
            "-i",
            str(source),
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(tmp_target),
        ]
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0 or not tmp_target.exists():
            raise RuntimeError(f"ffmpeg transcode failed for {source.name}: {result.stderr[-500:]}")
        tmp_target.replace(target)
        return target

    def ensure_attempt_playback(source: Path, attempt_id: str) -> dict[str, str]:
        ext = source.suffix or ".mp4"
        raw_path = playback_cache_dir / "attempts" / f"{attempt_id}{ext}"
        playback_path = playback_cache_dir / "attempts" / f"{attempt_id}_playable.mp4"
        raw_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, raw_path)
        ffmpeg_transcode_h264(raw_path, playback_path)
        return {
            "original_path": str(raw_path),
            "playback_path": str(playback_path),
            "playback_url": f"/playback/attempt/{attempt_id}",
        }

    def ensure_reference_playback(gloss: str, source: Path, video_id: str | None) -> dict[str, str]:
        slug = safe_slug(gloss)
        stem = f"{slug}_{video_id}" if video_id else slug
        playback_path = playback_cache_dir / "references" / f"{stem}_playable.mp4"
        ffmpeg_transcode_h264(source, playback_path)
        return {
            "playback_path": str(playback_path),
            "playback_url": f"/playback/reference/{quote(gloss, safe='')}",
        }

    def ffmpeg_extract_poster(source: Path, target: Path, capture_second: float) -> Path:
        if target.exists() and target.stat().st_size > 0:
            return target
        target.parent.mkdir(parents=True, exist_ok=True)
        tmp_target = target.with_suffix(".tmp.jpg")
        if tmp_target.exists():
            tmp_target.unlink()
        command = [
            "ffmpeg",
            "-y",
            "-ss",
            f"{max(0.0, float(capture_second)):.3f}",
            "-i",
            str(source),
            "-frames:v",
            "1",
            "-q:v",
            "2",
            str(tmp_target),
        ]
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0 or not tmp_target.exists():
            raise RuntimeError(f"ffmpeg poster extract failed for {source.name}: {result.stderr[-500:]}")
        tmp_target.replace(target)
        return target

    def probe_duration_seconds(source: Path) -> float:
        cache_key = str(source.resolve())
        if cache_key in reference_duration_cache:
            return reference_duration_cache[cache_key]
        command = [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(source),
        ]
        result = subprocess.run(command, capture_output=True, text=True)
        duration = 0.0
        if result.returncode == 0:
            try:
                duration = max(0.0, float(result.stdout.strip() or "0"))
            except ValueError:
                duration = 0.0
        reference_duration_cache[cache_key] = duration
        return duration

    def ensure_reference_poster(gloss: str, source: Path, video_id: str | None, capture_second: float) -> dict[str, str]:
        slug = safe_slug(gloss)
        stem = f"{slug}_{video_id}" if video_id else slug
        poster_path = playback_cache_dir / "reference_posters" / f"{stem}.jpg"
        ffmpeg_extract_poster(source, poster_path, capture_second)
        return {
            "poster_path": str(poster_path),
            "poster_url": f"/poster/reference/{quote(gloss, safe='')}",
        }

    def build_reference_asset(gloss: str) -> dict[str, Any] | None:
        asset = store.get_display_reference(gloss)
        if asset is None:
            return None
        return {
            "gloss": gloss,
            "video_id": asset.get("video_id"),
            "video_score": asset.get("score"),
            "video_url": f"/reference-video/{quote(gloss, safe='')}",
            "playback_url": f"/playback/reference/{quote(gloss, safe='')}",
            "video_filename": Path(str(asset["video_path"])).name,
        }

    def build_reference_study_payload(gloss: str) -> dict[str, Any] | None:
        nonlocal reference_study_cache
        if gloss in reference_study_cache:
            return reference_study_cache[gloss]

        asset = store.get_display_reference(gloss)
        if asset is None:
            return None
        source_path = Path(str(asset["video_path"]))
        reference_asset = build_reference_asset(gloss)
        if reference_asset is None:
            return None
        payload = {
            "gloss": gloss,
            "video_id": asset.get("video_id"),
            "score": asset.get("score"),
            "poster_url": f"/learn-image/{quote(gloss, safe='')}",
            "reference": {
                "video_url": reference_asset["video_url"],
                "playback_url": reference_asset["playback_url"],
                "segment": None,
                "video_filename": source_path.name,
            },
        }
        reference_study_cache[gloss] = payload
        return payload

    def build_curriculum() -> dict[str, Any]:
        nonlocal curriculum_cache
        if curriculum_cache is not None:
            return curriculum_cache

        glosses = store.list_glosses()
        topics: list[dict[str, Any]] = []
        for topic_index, (topic_id, title, subtitle) in enumerate(CURRICULUM_TITLES):
            start = topic_index * CURRICULUM_TOPIC_SIZE
            end = start + CURRICULUM_TOPIC_SIZE
            topic_glosses = glosses[start:end]
            if not topic_glosses:
                continue
            words = []
            for local_index, gloss in enumerate(topic_glosses, start=1):
                study = build_reference_study_payload(gloss)
                words.append(
                    {
                        "order": local_index,
                        "gloss": gloss,
                        "checkpoint_group": 1 if local_index <= 5 else 2,
                        "study": study,
                    }
                )
            topics.append(
                {
                    "id": topic_id,
                    "title": title,
                    "subtitle": subtitle,
                    "word_count": len(topic_glosses),
                    "checkpoint_sizes": [5, 10],
                    "glosses": topic_glosses,
                    "words": words,
                }
            )
        curriculum_cache = {"topics": topics}
        return curriculum_cache

    def get_reference_pose_bundle(gloss: str) -> dict[str, Any] | None:
        asset = store.get_display_reference(gloss)
        if asset is None:
            return None
        if gloss in reference_pose_cache:
            return reference_pose_cache[gloss]
        pose, _, video_meta = extract_video_pose_and_results(
            asset["video_path"],
            frame_stride=1,
        )
        bundle = {
            "asset": asset,
            "pose": pose,
            "video_meta": video_meta,
        }
        reference_pose_cache[gloss] = bundle
        return bundle

    def segment_summary(
        *,
        seq: PoseSequence,
        video_meta: dict[str, float],
        frame_stride: int,
        segment: Any | None,
    ) -> dict[str, Any]:
        source_start_frame = (segment.start_frame * frame_stride) if segment is not None else 0
        source_end_frame = (
            (segment.end_frame * frame_stride)
            if segment is not None
            else int(len(seq.xy) * frame_stride)
        )
        fps = max(float(video_meta["fps"]), 1e-6)
        return {
            "start_extracted_frame": int(segment.start_frame) if segment is not None else 0,
            "end_extracted_frame": int(segment.end_frame) if segment is not None else int(len(seq.xy)),
            "start_source_frame": int(source_start_frame),
            "end_source_frame": int(source_end_frame),
            "start_ms": int(round(1000.0 * float(source_start_frame) / fps)),
            "end_ms": int(round(1000.0 * float(source_end_frame) / fps)),
            "frame_count": int(segment.frame_count) if segment is not None else int(len(seq.xy)),
            "reason": segment.reason if segment is not None else "full_video",
        }

    async def analyze_target_attempt(
        *,
        target_gloss: str,
        video: UploadFile,
        lesson_glosses: list[str],
        overlay_frame_count: int,
        max_frames: int | None,
        frame_stride: int,
        auto_segment: bool,
        segment_min_frames: int,
        segment_max_frames: int | None,
        segment_pad_frames: int,
    ) -> dict[str, Any]:
        if target_gloss not in store.list_glosses():
            raise HTTPException(status_code=404, detail=f"Unknown target_gloss: {target_gloss}")
        if target_gloss not in lesson_glosses:
            raise HTTPException(status_code=400, detail="target_gloss must be included in lesson_glosses")
        if frame_stride < 1:
            raise HTTPException(status_code=400, detail="frame_stride must be >= 1")

        suffix = Path(video.filename or "upload.mp4").suffix or ".mp4"
        request_id = uuid.uuid4().hex[:12]
        content = await video.read()
        with tempfile.TemporaryDirectory() as tmpdir:
            input_path = Path(tmpdir) / f"upload{suffix}"
            input_path.write_bytes(content)
            attempt_playback = ensure_attempt_playback(input_path, request_id)
            try:
                user_pose, user_results, video_meta = extract_video_pose_and_results(
                    input_path,
                    max_frames=max_frames,
                    frame_stride=frame_stride,
                )
                target_bank = store.get(target_gloss)
                segment_info = None
                segment = None
                scoring_pose = user_pose
                scoring_results = user_results
                classifier_results = user_results
                classifier_segment_info = {
                    "reason": "full_video",
                    "start_frame": 0,
                    "end_frame": len(user_results),
                    "frame_count": len(user_results),
                }
                if auto_segment:
                    scoring_pose, segment, segment_info = select_best_segment(
                        user_pose,
                        target_bank=target_bank,
                        results_list=user_results,
                        fps=float(video_meta["fps"]),
                        frame_stride=frame_stride,
                        min_frames=segment_min_frames,
                        max_frames=segment_max_frames,
                        pad_frames=segment_pad_frames,
                    )
                    scoring_results = user_results[segment.start_frame:segment.end_frame]
                    classifier_results, classifier_segment_info = select_classifier_segment(
                        user_results,
                        fps=float(video_meta["fps"]),
                        frame_stride=frame_stride,
                    )
                    if not classifier_results:
                        classifier_results = scoring_results

                relevant_banks = store.all_banks(lesson_glosses)
                target_result = compare_to_reference_bank(scoring_pose, target_bank)
                ranking = rank_sequence_against_banks(scoring_pose, relevant_banks)
                target_rank = next(i + 1 for i, item in enumerate(ranking) if item["gloss"] == target_gloss)
            except HTTPException:
                raise
            except Exception as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc

        user_segment = segment_summary(
            seq=user_pose,
            video_meta=video_meta,
            frame_stride=frame_stride,
            segment=segment,
        )
        reference_asset = build_reference_asset(target_gloss)
        reference_segment = None
        reference_overlay_pose = None
        reference_video_meta = None
        if reference_asset is not None:
            reference_bundle = get_reference_pose_bundle(target_gloss)
            assert reference_bundle is not None
            reference_pose_full = reference_bundle["pose"]
            reference_video_meta = reference_bundle["video_meta"]
            reference_seg = None
            reference_scoring_pose = reference_pose_full
            if auto_segment:
                reference_scoring_pose, reference_seg, _ = select_best_segment(
                    reference_pose_full,
                    target_bank=target_bank,
                    fps=float(reference_video_meta["fps"]),
                    min_frames=segment_min_frames,
                    max_frames=segment_max_frames,
                    pad_frames=segment_pad_frames,
                )
            reference_segment = segment_summary(
                seq=reference_pose_full,
                video_meta=reference_video_meta,
                frame_stride=1,
                segment=reference_seg,
            )
            reference_overlay_pose = reference_scoring_pose

        if reference_overlay_pose is None or reference_video_meta is None:
            reference_overlay_pose = scoring_pose
            reference_video_meta = video_meta
            reference_segment = user_segment

        overlay = build_compact_overlay_payload(
            user_seq=scoring_pose,
            reference_seq=reference_overlay_pose,
            bad_mask=target_result["bad_mask"],
            joint_names=scoring_pose.names,
            user_video_meta=video_meta,
            reference_video_meta=reference_video_meta,
            frame_count=overlay_frame_count,
        )

        visualization = build_visualization_payload(
            scoring_pose,
            target_result,
            source_fps=float(video_meta["fps"]),
            source_start_frame=int(user_segment["start_source_frame"]),
            source_end_frame=int(user_segment["end_source_frame"]),
        )

        return {
            "attempt_id": request_id,
            "target_gloss": target_gloss,
            "lesson_glosses": lesson_glosses,
            "frames_processed": int(len(user_pose.xy)),
            "frames_scored": int(len(scoring_pose.xy)),
            "auto_segment": auto_segment,
            "segment": user_segment,
            "segment_debug": segment_info,
            "target_result": target_result,
            "target_rank": target_rank,
            "bank_ranking": ranking,
            "scoring_results": scoring_results,
            "classifier_results": classifier_results,
            "classifier_segment_debug": classifier_segment_info,
            "reference": {
                "matched_reference_id": target_result["matched_reference_id"],
                "matched_template_index": target_result["matched_template_index"],
                "display_video": reference_asset,
                "segment": reference_segment,
            },
            "playback": {
                "strategy": "frontend_seeks_segment_and_draws_progress_overlay",
                "overlay_frame_count": int(overlay_frame_count),
                "user_video_url": attempt_playback["playback_url"],
                "user_segment": user_segment,
                "reference_video_url": (reference_asset["playback_url"] if reference_asset is not None else None),
                "reference_segment": reference_segment,
            },
            "overlay": overlay,
            "visualization": visualization,
        }

    def build_feedback_block(analysis: dict[str, Any]) -> dict[str, Any]:
        target_result = analysis["target_result"]
        main_errors = analysis["visualization"]["main_errors"]
        valid_fraction = float(target_result.get("valid_fraction", 1.0))
        if valid_fraction < 0.55:
            overall = "Tracking quality is low. Keep both hands visible and retry once."
        elif main_errors:
            overall = f"Most correction is needed around {main_errors[0]['body_part']}."
        else:
            overall = "Good attempt. Keep the overall movement close to the reference."
        return {
            **public_result(target_result),
            "overall": overall,
            "main_errors": main_errors,
            "tracking_quality": "low" if valid_fraction < 0.55 else "good",
        }

    def build_practice_i_response(analysis: dict[str, Any]) -> dict[str, Any]:
        decision = decision_for_target(
            analysis["target_result"],
            analysis["target_rank"],
            analysis["bank_ranking"][0]["score"] if analysis["bank_ranking"] else None,
        )
        return {
            "attempt_id": analysis["attempt_id"],
            "practice_mode": "practice_i",
            "target_gloss": analysis["target_gloss"],
            "lesson_glosses": analysis["lesson_glosses"],
            "score": float(analysis["target_result"]["score"]),
            "decision": {
                **decision,
                "wrong_word_detected": False,
                "predicted_wrong_gloss": None,
            },
            "segment": analysis["segment"],
            "playback": analysis["playback"],
            "overlay": analysis["overlay"],
            "feedback": build_feedback_block(analysis),
            "visualization": analysis["visualization"],
            "reference": analysis["reference"],
            "target_rank": analysis["target_rank"],
            "top3_bank_matches": analysis["bank_ranking"][:3],
        }

    def build_practice_ii_response(
        analysis: dict[str, Any],
        *,
        classifier_top_k: int,
        wrong_word_min_lesson_score: float,
        wrong_word_min_margin: float,
    ) -> dict[str, Any]:
        classifier = get_sign_classifier()
        classifier_results = analysis.get("classifier_results") or analysis["scoring_results"]
        ranked_predictions = classifier.infer_ranked(
            classifier_results,
            allowed_glosses=None,
            top_k=max(20, len(analysis["lesson_glosses"]), classifier_top_k),
        )
        normalized_predictions = with_lesson_scores(ranked_predictions, analysis["lesson_glosses"])
        decision = decision_for_practice_ii(
            target_gloss=analysis["target_gloss"],
            target_result=analysis["target_result"],
            target_rank=analysis["target_rank"],
            bank_top1_gloss=(analysis["bank_ranking"][0]["gloss"] if analysis["bank_ranking"] else None),
            classifier_predictions=normalized_predictions,
            top1_score=(analysis["bank_ranking"][0]["score"] if analysis["bank_ranking"] else None),
            wrong_word_min_lesson_score=wrong_word_min_lesson_score,
            wrong_word_min_margin=wrong_word_min_margin,
        )
        feedback = build_feedback_block(analysis)
        if decision["wrong_word_detected"] and decision.get("predicted_wrong_gloss"):
            feedback["overall"] = (
                f"It looks like you may have signed "
                f"{decision['predicted_wrong_gloss']} instead of {analysis['target_gloss']}."
            )
        elif decision["low_tracking_quality"]:
            feedback["overall"] = "Tracking quality is low. Keep both hands visible and retry once."
        return {
            "attempt_id": analysis["attempt_id"],
            "practice_mode": "practice_ii",
            "target_gloss": analysis["target_gloss"],
            "lesson_glosses": analysis["lesson_glosses"],
            "score": float(analysis["target_result"]["score"]),
            "decision": decision,
            "segment": analysis["segment"],
            "playback": analysis["playback"],
            "overlay": analysis["overlay"],
            "feedback": feedback,
            "visualization": analysis["visualization"],
            "reference": analysis["reference"],
            "classifier": {
                "predicted_gloss": normalized_predictions[0]["gloss"] if normalized_predictions else None,
                "predicted_lesson_score": normalized_predictions[0]["lesson_score"] if normalized_predictions else None,
                "predicted_raw_score": normalized_predictions[0]["raw_score"] if normalized_predictions else None,
                "segment": analysis.get("classifier_segment_debug"),
                "top_k": normalized_predictions[: max(1, classifier_top_k)],
            },
            "followup": {
                "mode": "practice_i_target_feedback",
                "focus_gloss": analysis["target_gloss"],
            },
            "target_rank": analysis["target_rank"],
            "top3_bank_matches": analysis["bank_ranking"][:3],
        }

    @app.get("/health")
    def health() -> dict[str, object]:
        practice_ii_ready = sign_model_path.exists() and sign_gloss_csv.exists()
        return {
            "ok": True,
            "bank_root": str(bank_root),
            "gloss_count": len(store.list_glosses()),
            "practice_ii_ready": practice_ii_ready,
            "sign_model_path": str(sign_model_path),
            "sign_gloss_csv": str(sign_gloss_csv),
            "render_mode": "compact_overlay_plus_segment_timing",
        }

    @app.get("/app-config")
    def app_config() -> dict[str, object]:
        curriculum = build_curriculum()
        return {
            "glosses": store.list_glosses(),
            "topics": store.list_topics(),
            "curriculum_topics": [
                {
                    "id": topic["id"],
                    "title": topic["title"],
                    "subtitle": topic["subtitle"],
                    "word_count": topic["word_count"],
                }
                for topic in curriculum["topics"]
            ],
            "practice_modes": ["practice_i", "practice_ii"],
            "random_practice_ii_sizes": [5, 10],
            "reference_video_available": bool(store.display_references),
            "overlay_strategy": "progress_aligned_segment_from_api",
        }

    @app.get("/glosses")
    def glosses() -> dict[str, object]:
        return {"glosses": store.list_glosses()}

    @app.get("/topics")
    def topics() -> dict[str, object]:
        return {"topics": store.list_topics()}

    @app.get("/curriculum")
    def curriculum() -> dict[str, Any]:
        return build_curriculum()

    @app.get("/vocabulary/{gloss}")
    def vocabulary_detail(gloss: str) -> dict[str, Any]:
        if gloss not in store.list_glosses():
            raise HTTPException(status_code=404, detail=f"Unknown gloss: {gloss}")
        study = build_reference_study_payload(gloss)
        if study is None:
            raise HTTPException(status_code=404, detail=f"No reference data for gloss: {gloss}")
        return study

    @app.get("/practice-i/task/random")
    def practice_i_task_random() -> dict[str, object]:
        target_gloss = rng.choice(store.list_glosses())
        return {
            "practice_mode": "practice_i",
            "target_gloss": target_gloss,
            "lesson_glosses": [target_gloss],
            "reference": build_reference_asset(target_gloss),
        }

    @app.get("/practice-ii/task/random")
    def practice_ii_task_random(lesson_size: int = 5) -> dict[str, object]:
        available = store.list_glosses()
        if lesson_size < 2 or lesson_size > len(available):
            raise HTTPException(status_code=400, detail=f"lesson_size must be between 2 and {len(available)}")
        lesson_glosses = rng.sample(available, lesson_size)
        target_gloss = rng.choice(lesson_glosses)
        return {
            "practice_mode": "practice_ii",
            "target_gloss": target_gloss,
            "lesson_glosses": lesson_glosses,
            "reference": build_reference_asset(target_gloss),
        }

    @app.get("/reference-video/{gloss}")
    def reference_video(gloss: str) -> FileResponse:
        asset = store.get_display_reference(gloss)
        if asset is None:
            raise HTTPException(status_code=404, detail=f"No display reference video for gloss: {gloss}")
        path = Path(str(asset["video_path"]))
        if not path.exists():
            raise HTTPException(status_code=404, detail=f"Missing reference video file for gloss: {gloss}")
        return FileResponse(path, media_type="video/mp4", filename=path.name)

    @app.get("/playback/reference/{gloss}")
    def reference_playback(gloss: str) -> FileResponse:
        asset = store.get_display_reference(gloss)
        if asset is None:
            raise HTTPException(status_code=404, detail=f"No display reference video for gloss: {gloss}")
        playback = ensure_reference_playback(
            gloss,
            Path(str(asset["video_path"])),
            (str(asset.get("video_id")) if asset.get("video_id") is not None else None),
        )
        path = Path(playback["playback_path"])
        return FileResponse(path, media_type="video/mp4", filename=path.name)

    @app.get("/poster/reference/{gloss}")
    def reference_poster(gloss: str) -> FileResponse:
        asset = store.get_display_reference(gloss)
        if asset is None:
            raise HTTPException(status_code=404, detail=f"No reference poster for gloss: {gloss}")
        source_path = Path(str(asset["video_path"]))
        duration_seconds = probe_duration_seconds(source_path)
        capture_second = 0.8
        if duration_seconds > 0:
            capture_second = min(max(duration_seconds * 0.35, 0.4), max(0.4, duration_seconds - 0.2))
        poster = ensure_reference_poster(
            gloss,
            source_path,
            (str(asset.get("video_id")) if asset.get("video_id") is not None else None),
            capture_second,
        )
        path = Path(poster["poster_path"])
        return FileResponse(path, media_type="image/jpeg", filename=path.name)

    @app.get("/learn-image/{gloss}")
    def learn_image(gloss: str) -> FileResponse:
        from urllib.parse import unquote
        decoded_gloss = unquote(gloss)
        
        img_path = APP_DIR / "outputs" / "learn_img" / f"{decoded_gloss}.png"
        
        if img_path.exists():
            return FileResponse(img_path, media_type="image/png", filename=img_path.name)
            
        # Fallback to standard poster frame extraction
        asset = store.get_display_reference(decoded_gloss)
        if asset is None:
            raise HTTPException(status_code=404, detail=f"No reference image/poster for gloss: {decoded_gloss}")
        source_path = Path(str(asset["video_path"]))
        duration_seconds = probe_duration_seconds(source_path)
        capture_second = 0.8
        if duration_seconds > 0:
            capture_second = min(max(duration_seconds * 0.35, 0.4), max(0.4, duration_seconds - 0.2))
        poster = ensure_reference_poster(
            decoded_gloss,
            source_path,
            (str(asset.get("video_id")) if asset.get("video_id") is not None else None),
            capture_second,
        )
        path = Path(poster["poster_path"])
        return FileResponse(path, media_type="image/jpeg", filename=path.name)

    @app.get("/playback/attempt/{attempt_id}")
    def attempt_playback(attempt_id: str) -> FileResponse:
        path = playback_cache_dir / "attempts" / f"{attempt_id}_playable.mp4"
        if not path.exists():
            raise HTTPException(status_code=404, detail=f"Missing attempt playback for attempt_id={attempt_id}")
        return FileResponse(path, media_type="video/mp4", filename=path.name)

    @app.post("/practice-i/analyze-video")
    async def practice_i_analyze_video(
        target_gloss: str = Form(...),
        video: UploadFile = File(...),
        lesson_glosses: str = Form(""),
        overlay_frame_count: int = Form(32),
        max_frames: int | None = Form(None),
        frame_stride: int = Form(2),
        auto_segment: bool = Form(True),
        segment_min_frames: int = Form(12),
        segment_max_frames: int | None = Form(None),
        segment_pad_frames: int = Form(8),
        return_visualization: bool = Form(False),
        db: Session = Depends(get_db),
        current_user: Any = Depends(get_current_user_optional),
    ) -> dict[str, object]:
        lesson = resolve_lesson_glosses(lesson_glosses, require_multi=False)
        analysis = await analyze_target_attempt(
            target_gloss=target_gloss,
            video=video,
            lesson_glosses=lesson,
            overlay_frame_count=overlay_frame_count,
            max_frames=max_frames,
            frame_stride=frame_stride,
            auto_segment=auto_segment,
            segment_min_frames=segment_min_frames,
            segment_max_frames=segment_max_frames,
            segment_pad_frames=segment_pad_frames,
        )
        response = build_practice_i_response(analysis)
        if not return_visualization:
            response.pop("visualization", None)
            
        if current_user is not None:
            save_practice_attempt(db, current_user.id, response, "practice_i")
            
        return response

    @app.post("/practice-ii/analyze-video")
    async def practice_ii_analyze_video(
        target_gloss: str = Form(...),
        lesson_glosses: str = Form(""),
        video: UploadFile = File(...),
        overlay_frame_count: int = Form(32),
        max_frames: int | None = Form(None),
        frame_stride: int = Form(2),
        auto_segment: bool = Form(True),
        segment_min_frames: int = Form(12),
        segment_max_frames: int | None = Form(None),
        segment_pad_frames: int = Form(8),
        classifier_top_k: int = Form(3),
        wrong_word_min_lesson_score: float = Form(0.45),
        wrong_word_min_margin: float = Form(0.10),
        assignment_package_id: str | None = Form(None),
        return_visualization: bool = Form(False),
        db: Session = Depends(get_db),
        current_user: Any = Depends(get_current_user_optional),
    ) -> dict[str, object]:
        lesson = resolve_lesson_glosses(lesson_glosses, require_multi=True)
        analysis = await analyze_target_attempt(
            target_gloss=target_gloss,
            video=video,
            lesson_glosses=lesson,
            overlay_frame_count=overlay_frame_count,
            max_frames=max_frames,
            frame_stride=frame_stride,
            auto_segment=auto_segment,
            segment_min_frames=segment_min_frames,
            segment_max_frames=segment_max_frames,
            segment_pad_frames=segment_pad_frames,
        )
        try:
            response = build_practice_ii_response(
                analysis,
                classifier_top_k=classifier_top_k,
                wrong_word_min_lesson_score=wrong_word_min_lesson_score,
                wrong_word_min_margin=wrong_word_min_margin,
            )
            if not return_visualization:
                response.pop("visualization", None)
                
            if current_user is not None:
                try:
                    save_practice_attempt(
                        db,
                        current_user.id,
                        response,
                        "practice_ii",
                        custom_package_id=assignment_package_id,
                    )
                except ValueError as exc:
                    raise HTTPException(status_code=400, detail=str(exc)) from exc
                
            return response
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc

    # Backward-compatible aliases during migration.
    @app.post("/practice-i/video")
    async def practice_i_video(
        target_gloss: str = Form(...),
        video: UploadFile = File(...),
        lesson_glosses: str = Form(""),
        overlay_frame_count: int = Form(32),
        max_frames: int | None = Form(None),
        frame_stride: int = Form(2),
        auto_segment: bool = Form(True),
        segment_min_frames: int = Form(12),
        segment_max_frames: int | None = Form(None),
        segment_pad_frames: int = Form(8),
        db: Session = Depends(get_db),
        current_user: Any = Depends(get_current_user_optional),
    ) -> dict[str, object]:
        lesson = resolve_lesson_glosses(lesson_glosses, require_multi=False)
        analysis = await analyze_target_attempt(
            target_gloss=target_gloss,
            video=video,
            lesson_glosses=lesson,
            overlay_frame_count=overlay_frame_count,
            max_frames=max_frames,
            frame_stride=frame_stride,
            auto_segment=auto_segment,
            segment_min_frames=segment_min_frames,
            segment_max_frames=segment_max_frames,
            segment_pad_frames=segment_pad_frames,
        )
        response = build_practice_i_response(analysis)
        if current_user is not None:
            save_practice_attempt(db, current_user.id, response, "practice_i")
        return response

    @app.post("/practice-ii/video")
    async def practice_ii_video(
        target_gloss: str = Form(...),
        lesson_glosses: str = Form(""),
        video: UploadFile = File(...),
        overlay_frame_count: int = Form(32),
        max_frames: int | None = Form(None),
        frame_stride: int = Form(2),
        auto_segment: bool = Form(True),
        segment_min_frames: int = Form(12),
        segment_max_frames: int | None = Form(None),
        segment_pad_frames: int = Form(8),
        classifier_top_k: int = Form(3),
        wrong_word_min_lesson_score: float = Form(0.45),
        wrong_word_min_margin: float = Form(0.10),
        assignment_package_id: str | None = Form(None),
        db: Session = Depends(get_db),
        current_user: Any = Depends(get_current_user_optional),
    ) -> dict[str, object]:
        lesson = resolve_lesson_glosses(lesson_glosses, require_multi=True)
        analysis = await analyze_target_attempt(
            target_gloss=target_gloss,
            video=video,
            lesson_glosses=lesson,
            overlay_frame_count=overlay_frame_count,
            max_frames=max_frames,
            frame_stride=frame_stride,
            auto_segment=auto_segment,
            segment_min_frames=segment_min_frames,
            segment_max_frames=segment_max_frames,
            segment_pad_frames=segment_pad_frames,
        )
        try:
            response = build_practice_ii_response(
                analysis,
                classifier_top_k=classifier_top_k,
                wrong_word_min_lesson_score=wrong_word_min_lesson_score,
                wrong_word_min_margin=wrong_word_min_margin,
            )
            if current_user is not None:
                try:
                    save_practice_attempt(
                        db,
                        current_user.id,
                        response,
                        "practice_ii",
                        custom_package_id=assignment_package_id,
                    )
                except ValueError as exc:
                    raise HTTPException(status_code=400, detail=str(exc)) from exc
            return response
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc

    return app


app = create_app()

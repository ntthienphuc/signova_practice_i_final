from sqlalchemy.orm import Session
from app.models.curriculum import Word, Topic
from app.models.progress import LearnerWordProgress, LearnerTopicProgress
from app.models.attempt import PracticeAttempt, PracticeAttemptFeedback, PracticeAttemptMetrics
from app.models.custom_package import CustomPackage
from app.models.link import SchoolLearnerLink
from app.models.profile import LearnerProfile
from app.models.gamification import StreakLog
from datetime import datetime, date, timezone
from typing import Any, Dict, List
import uuid
import math
import numbers

try:
    import numpy as np
except ModuleNotFoundError:  # pragma: no cover - numpy is installed in API runtime
    np = None


def sanitize_for_json(obj: Any) -> Any:
    """Recursively replace NaN/Inf float values with None so PostgreSQL JSON
    columns don't reject the payload (NaN is not valid JSON per RFC 8259)."""
    if np is not None:
        if isinstance(obj, np.ndarray):
            return sanitize_for_json(obj.tolist())
        if isinstance(obj, np.generic):
            return sanitize_for_json(obj.item())
    if isinstance(obj, bool) or obj is None or isinstance(obj, str):
        return obj
    if isinstance(obj, numbers.Real):
        value = float(obj)
        if not math.isfinite(value):
            return None
        if isinstance(obj, int):
            return obj
        return value
    if isinstance(obj, dict):
        return {str(k): sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [sanitize_for_json(item) for item in obj]
    return obj


def save_practice_attempt(
    db: Session,
    learner_id: uuid.UUID,
    analysis_result: Dict[str, Any],
    practice_mode: str, # practice_i, practice_ii
    custom_package_id: str | uuid.UUID | None = None,
) -> PracticeAttempt:
    target_gloss = analysis_result["target_gloss"]
    lesson_glosses = analysis_result["lesson_glosses"]
    score = float(analysis_result["score"])
    
    # Decision flags
    decision = analysis_result.get("decision", {})
    accepted = bool(decision.get("accept_as_target", False) or decision.get("accepted", False))
    wrong_word_detected = bool(decision.get("wrong_word_detected", False))
    predicted_wrong_gloss = decision.get("predicted_wrong_gloss")
    target_rank = analysis_result.get("target_rank")
    
    # Segment info
    segment = analysis_result.get("segment", {})
    segment_start_ms = segment.get("start_ms")
    segment_end_ms = segment.get("end_ms")
    
    # Find word and topic in DB
    word = db.query(Word).filter(Word.gloss == target_gloss).first()
    topic_id = word.topic_id if word else None
    word_id = word.id if word else None
    package_uuid: uuid.UUID | None = None
    if custom_package_id:
        package_uuid = custom_package_id if isinstance(custom_package_id, uuid.UUID) else uuid.UUID(str(custom_package_id))
        pkg = db.query(CustomPackage).filter(CustomPackage.id == package_uuid).first()
        if not pkg:
            raise ValueError("Custom package not found")
        if target_gloss not in (pkg.glosses or []):
            raise ValueError("target_gloss is not included in the assigned custom package")

        direct_ids = set(str(item) for item in (pkg.assigned_student_ids or []))
        class_names = db.query(SchoolLearnerLink.class_name).filter(
            SchoolLearnerLink.school_user_id == pkg.created_by,
            SchoolLearnerLink.learner_user_id == learner_id,
            SchoolLearnerLink.status == "approved",
        ).all()
        linked_classes = {row[0] for row in class_names if row[0]}
        assigned_by_class = bool(pkg.assigned_class_name and pkg.assigned_class_name in linked_classes)
        assigned_directly = str(learner_id) in direct_ids
        if not (assigned_by_class or assigned_directly):
            raise ValueError("This custom package is not assigned to the learner")
    
    # 1. Create PracticeAttempt record
    attempt = PracticeAttempt(
        learner_user_id=learner_id,
        topic_id=topic_id,
        word_id=word_id,
        custom_package_id=package_uuid,
        practice_mode=practice_mode,
        target_gloss=target_gloss,
        lesson_glosses_json=lesson_glosses,
        uploaded_video_path=analysis_result.get("playback", {}).get("user_video_url"),
        score=score,
        accepted=accepted,
        wrong_word_detected=wrong_word_detected,
        predicted_wrong_gloss=predicted_wrong_gloss,
        target_rank=target_rank,
        segment_start_ms=segment_start_ms,
        segment_end_ms=segment_end_ms,
        frame_stride=analysis_result.get("frames_processed", 2) # fallback to processed
    )
    db.add(attempt)
    db.flush() # Generate attempt.id
    
    # 2. Create Feedback record
    # NOTE: sanitize_for_json is required here — np.nanmedian on empty arrays
    # produces float('nan') which is invalid JSON per RFC 8259 and rejected by PostgreSQL.
    feedback_data = analysis_result.get("feedback", {})
    feedback = PracticeAttemptFeedback(
        attempt_id=attempt.id,
        overall_text=feedback_data.get("overall"),
        main_errors_json=sanitize_for_json(feedback_data.get("main_errors")),
        decision_json=sanitize_for_json(decision),
        top_matches_json=sanitize_for_json(analysis_result.get("top3_bank_matches")),
        overlay_meta_json=sanitize_for_json(analysis_result.get("overlay"))
    )
    db.add(feedback)
    
    # 3. Create Metrics record
    target_res = analysis_result.get("target_result", {})
    metrics = PracticeAttemptMetrics(
        attempt_id=attempt.id,
        valid_fraction=float(target_res.get("valid_fraction", 1.0)),
        pose_sequence_length=int(analysis_result.get("frames_scored", 0))
    )
    db.add(metrics)
    
    # Update Learner Profile & Progress
    profile = db.query(LearnerProfile).filter(LearnerProfile.user_id == learner_id).first()
    if profile:
        # Update Streak logs
        today = date.today()
        streak_log = db.query(StreakLog).filter(
            StreakLog.learner_user_id == learner_id,
            StreakLog.date == today
        ).first()
        
        xp_gained = 0
        
        # XP calculation
        if practice_mode == "practice_i":
            xp_gained += 10 # Base attempt XP
            if accepted:
                xp_gained += 15 # Bonus for passing
        else:
            xp_gained += 20 # Practice II base XP
            if accepted:
                xp_gained += 30 # Bonus
                
        profile.xp += xp_gained
        
        if not streak_log:
            # First activity today
            streak_log = StreakLog(
                learner_user_id=learner_id,
                date=today,
                xp_earned=xp_gained
            )
            db.add(streak_log)
            # Increment streak if active yesterday
            # For simplicity, we just increment or reset streak logic here:
            yesterday = today - date.resolution # 1 day timedelta
            yesterday_log = db.query(StreakLog).filter(
                StreakLog.learner_user_id == learner_id,
                StreakLog.date == yesterday
            ).first()
            if yesterday_log:
                profile.learning_streak += 1
            else:
                profile.learning_streak = 1
        else:
            streak_log.xp_earned += xp_gained
            
        # 4. Update Word & Topic Progress
        if word_id:
            # Word Progress
            wp = db.query(LearnerWordProgress).filter(
                LearnerWordProgress.learner_user_id == learner_id,
                LearnerWordProgress.word_id == word_id
            ).first()
            if not wp:
                wp = LearnerWordProgress(
                    learner_user_id=learner_id,
                    word_id=word_id,
                    studied=True,
                    practice1_attempt_count=1,
                    best_practice1_score=score,
                    last_practice1_score=score,
                    accepted_once=accepted,
                    correct_attempt_count=1 if accepted else 0,
                    failed_attempt_count=0 if accepted else 1
                )
                db.add(wp)
            else:
                wp.practice1_attempt_count += 1
                wp.last_practice1_score = score
                if wp.best_practice1_score is None or score > wp.best_practice1_score:
                    wp.best_practice1_score = score
                if accepted:
                    wp.accepted_once = True
                    wp.correct_attempt_count += 1
                else:
                    wp.failed_attempt_count += 1
            
            # Topic Progress
            if topic_id:
                tp = db.query(LearnerTopicProgress).filter(
                    LearnerTopicProgress.learner_user_id == learner_id,
                    LearnerTopicProgress.topic_id == topic_id
                ).first()
                
                if not tp:
                    tp = LearnerTopicProgress(
                        learner_user_id=learner_id,
                        topic_id=topic_id,
                        completed_words=1 if wp.studied else 0,
                        completed=False
                    )
                    db.add(tp)
                
                # Check for Checkpoints in Practice II
                if practice_mode == "practice_ii":
                    # If lesson has 5 words, it might be Checkpoint 1
                    if len(lesson_glosses) == 5 and accepted:
                        tp.checkpoint5_passed = True
                        profile.xp += 50 # big reward
                    # If lesson has 10 words, it is likely the final review
                    elif len(lesson_glosses) == 10 and accepted:
                        tp.practice2_final_passed = True
                        tp.completed = True
                        profile.xp += 100 # major reward
                        
    db.commit()
    
    try:
        from app.services.gamification import check_and_award_badges
        check_and_award_badges(db, learner_id)
    except Exception as e:
        # Prevent badge checking failures from breaking the core attempt flow
        print(f"Error checking or awarding badges: {e}")
        
    return attempt

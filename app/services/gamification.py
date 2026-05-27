from sqlalchemy.orm import Session
from app.models.gamification import Badge, LearnerBadge, StreakLog
from app.models.attempt import PracticeAttempt
from app.models.progress import LearnerWordProgress, LearnerTopicProgress
from app.models.profile import LearnerProfile
import uuid
from datetime import datetime, timezone
from typing import List

def check_and_award_badges(db: Session, learner_id: uuid.UUID) -> List[Badge]:
    awarded_badges = []
    
    all_badges = db.query(Badge).all()
    earned_badge_ids = {lb.badge_id for lb in db.query(LearnerBadge).filter(LearnerBadge.learner_user_id == learner_id).all()}
    
    attempts_count = db.query(PracticeAttempt).filter(PracticeAttempt.learner_user_id == learner_id).count()
    accepted_attempts_count = db.query(PracticeAttempt).filter(
        PracticeAttempt.learner_user_id == learner_id,
        PracticeAttempt.accepted == True
    ).count()
    
    best_score_record = db.query(PracticeAttempt).filter(PracticeAttempt.learner_user_id == learner_id).order_by(PracticeAttempt.score.desc()).first()
    best_score = best_score_record.score if best_score_record else 0.0
    
    profile = db.query(LearnerProfile).filter(LearnerProfile.user_id == learner_id).first()
    streak = profile.learning_streak if profile else 0
    
    words_studied = db.query(LearnerWordProgress).filter(
        LearnerWordProgress.learner_user_id == learner_id,
        LearnerWordProgress.studied == True
    ).count()
    
    completed_topics = db.query(LearnerTopicProgress).filter(
        LearnerTopicProgress.learner_user_id == learner_id,
        LearnerTopicProgress.completed == True
    ).count()
    
    checkpoint_passed = db.query(LearnerTopicProgress).filter(
        LearnerTopicProgress.learner_user_id == learner_id,
        LearnerTopicProgress.checkpoint5_passed == True
    ).count()

    for badge in all_badges:
        if badge.id in earned_badge_ids:
            continue
            
        should_award = False
        code = badge.code
        
        if code == "first_attempt" and attempts_count >= 1:
            should_award = True
        elif code == "first_correct_word" and accepted_attempts_count >= 1:
            should_award = True
        elif code == "five_words_done" and words_studied >= 5:
            should_award = True
        elif code == "checkpoint_clear" and checkpoint_passed >= 1:
            should_award = True
        elif code == "topic_finisher" and completed_topics >= 1:
            should_award = True
        elif code == "three_day_streak" and streak >= 3:
            should_award = True
        elif code == "practice_master_80" and best_score >= 80.0:
            should_award = True
        elif code == "practice_master_90" and best_score >= 90.0:
            should_award = True
            
        if should_award:
            lb = LearnerBadge(
                learner_user_id=learner_id,
                badge_id=badge.id,
                earned_at=datetime.now(timezone.utc)
            )
            db.add(lb)
            awarded_badges.append(badge)
            
            if profile:
                profile.xp += 50
                
    if awarded_badges:
        db.commit()
        
    return awarded_badges

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.profile import LearnerProfile
from app.models.curriculum import Topic, Word
from app.models.progress import LearnerTopicProgress, LearnerWordProgress
from app.schemas.progress import UserProgressSummary, WordViewedRequest, ResumeStateRequest
from datetime import datetime, timezone

router = APIRouter(prefix="/progress", tags=["progress"])

@router.get("/me", response_model=UserProgressSummary)
def get_my_progress(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "learner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only learners have progress")

    profile = current_user.learner_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Learner profile not found")

    topic_progress_list = db.query(LearnerTopicProgress).filter(
        LearnerTopicProgress.learner_user_id == current_user.id
    ).all()

    result = []
    for tp in topic_progress_list:
        studied_count = db.query(LearnerWordProgress).join(Word).filter(
            LearnerWordProgress.learner_user_id == current_user.id,
            Word.topic_id == tp.topic_id,
            LearnerWordProgress.studied == True
        ).count()
        result.append({
            "topic_id": tp.topic_id,
            "completed_words": studied_count,
            "checkpoint5_passed": tp.checkpoint5_passed,
            "practice2_final_passed": tp.practice2_final_passed,
            "completed": tp.completed,
            "last_word_index": tp.last_word_index,
            "updated_at": tp.updated_at,
        })

    return {
        "learning_streak": profile.learning_streak,
        "xp": profile.xp,
        "resume_state": profile.resume_state_json,
        "topic_progress": result,
    }

@router.get("/topic/{topic_id}")
def get_topic_progress(topic_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "learner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only learners have progress")
        
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    tp = db.query(LearnerTopicProgress).filter(
        LearnerTopicProgress.learner_user_id == current_user.id,
        LearnerTopicProgress.topic_id == topic_id
    ).first()
    
    if not tp:
        tp = LearnerTopicProgress(
            learner_user_id=current_user.id,
            topic_id=topic_id,
            completed_words=0,
            completed=False
        )
        db.add(tp)
        db.commit()
        db.refresh(tp)
        
    words = db.query(Word).filter(Word.topic_id == topic_id).order_by(Word.order_index).all()
    words_progress = []
    
    for w in words:
        wp = db.query(LearnerWordProgress).filter(
            LearnerWordProgress.learner_user_id == current_user.id,
            LearnerWordProgress.word_id == w.id
        ).first()
        
        if not wp:
            wp = LearnerWordProgress(
                learner_user_id=current_user.id,
                word_id=w.id,
                studied=False,
                practice1_attempt_count=0,
                accepted_once=False
            )
            db.add(wp)
            db.flush()
            
        words_progress.append({
            "word_id": w.id,
            "gloss": w.gloss,
            "studied": wp.studied,
            "practice1_attempt_count": wp.practice1_attempt_count,
            "best_practice1_score": wp.best_practice1_score,
            "last_practice1_score": wp.last_practice1_score,
            "accepted_once": wp.accepted_once,
            "updated_at": wp.updated_at
        })
        
    db.commit()
    
    return {
        "topic_id": tp.topic_id,
        "completed_words": tp.completed_words,
        "checkpoint5_passed": tp.checkpoint5_passed,
        "practice2_final_passed": tp.practice2_final_passed,
        "completed": tp.completed,
        "last_word_index": tp.last_word_index,
        "words": words_progress
    }

@router.post("/word-viewed")
def mark_word_viewed(req: WordViewedRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "learner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only learners can study vocabulary")
        
    word = db.query(Word).filter(Word.id == req.word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
        
    wp = db.query(LearnerWordProgress).filter(
        LearnerWordProgress.learner_user_id == current_user.id,
        LearnerWordProgress.word_id == req.word_id
    ).first()
    
    is_newly_studied = False
    if not wp:
        wp = LearnerWordProgress(
            learner_user_id=current_user.id,
            word_id=req.word_id,
            studied=True,
            practice1_attempt_count=0,
            accepted_once=False
        )
        db.add(wp)
        is_newly_studied = True
    elif not wp.studied:
        wp.studied = True
        is_newly_studied = True
        
    if is_newly_studied:
        profile = current_user.learner_profile
        profile.xp += 5
        
        tp = db.query(LearnerTopicProgress).filter(
            LearnerTopicProgress.learner_user_id == current_user.id,
            LearnerTopicProgress.topic_id == word.topic_id
        ).first()
        
        if not tp:
            tp = LearnerTopicProgress(
                learner_user_id=current_user.id,
                topic_id=word.topic_id,
                completed_words=1,
                last_word_index=word.order_index,
                completed=False
            )
            db.add(tp)
        else:
            studied_count = db.query(LearnerWordProgress).join(Word).filter(
                LearnerWordProgress.learner_user_id == current_user.id,
                Word.topic_id == word.topic_id,
                LearnerWordProgress.studied == True
            ).count()
            tp.completed_words = studied_count
            if word.order_index > tp.last_word_index:
                tp.last_word_index = word.order_index
                
    db.commit()
    return {"ok": True, "xp_earned": 5 if is_newly_studied else 0}

@router.post("/resume")
def update_resume_state(req: ResumeStateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "learner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only learners have resume states")
        
    profile = current_user.learner_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Learner profile not found")
        
    profile.resume_state_json = {
        "topic_id": req.topic_id,
        "last_active_stage": req.last_active_stage,
        "current_word_index": req.current_word_index,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    db.commit()
    return {"ok": True}

@router.get("/review-words")
def get_review_words(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "learner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only learners can review words")
        
    progress_list = db.query(LearnerWordProgress).filter(
        LearnerWordProgress.learner_user_id == current_user.id,
        LearnerWordProgress.studied == True
    ).all()
    
    words_data = []
    for p in progress_list:
        w = db.query(Word).filter(Word.id == p.word_id).first()
        if not w:
            continue
            
        words_data.append({
            "word_id": p.word_id,
            "gloss": w.gloss,
            "topic_id": w.topic_id,
            "practice1_attempt_count": p.practice1_attempt_count,
            "failed_attempt_count": p.failed_attempt_count,
            "correct_attempt_count": p.correct_attempt_count,
            "best_practice1_score": p.best_practice1_score,
            "last_practice1_score": p.last_practice1_score,
            "accepted_once": p.accepted_once,
            "updated_at": p.updated_at
        })
        
    words_data.sort(
        key=lambda x: (
            -x["failed_attempt_count"],
            x["last_practice1_score"] if x["last_practice1_score"] is not None else 100.0
        )
    )
    
    return {"words": words_data}

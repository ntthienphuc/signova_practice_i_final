from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.db import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.profile import LearnerProfile
from app.models.link import ParentLearnerLink, SchoolLearnerLink
from app.models.progress import LearnerTopicProgress, LearnerWordProgress
from app.models.curriculum import Word
from app.models.attempt import PracticeAttempt
from app.models.gamification import LearnerBadge, Badge
from typing import Any, List, Optional
import uuid

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

def get_learner_dashboard_data(db: Session, learner: User) -> dict:
    profile = learner.learner_profile
    if not profile:
        return {}
        
    progress_list = db.query(LearnerTopicProgress).filter(
        LearnerTopicProgress.learner_user_id == learner.id
    ).all()
    
    formatted_progress = []
    for tp in progress_list:
        formatted_progress.append({
            "topic_id": tp.topic_id,
            "completed_words": tp.completed_words,
            "completed": tp.completed,
            "checkpoint5_passed": tp.checkpoint5_passed,
            "practice2_final_passed": tp.practice2_final_passed
        })
        
    recent_attempts = db.query(PracticeAttempt).filter(
        PracticeAttempt.learner_user_id == learner.id
    ).order_by(PracticeAttempt.created_at.desc()).limit(5).all()
    
    formatted_attempts = []
    for att in recent_attempts:
        formatted_attempts.append({
            "id": att.id,
            "practice_mode": att.practice_mode,
            "target_gloss": att.target_gloss,
            "score": att.score,
            "accepted": att.accepted,
            "created_at": att.created_at
        })
        
    badges = db.query(Badge).join(LearnerBadge).filter(
        LearnerBadge.learner_user_id == learner.id
    ).all()
    
    formatted_badges = []
    for b in badges:
        formatted_badges.append({
            "id": b.id,
            "code": b.code,
            "name": b.name,
            "description": b.description,
            "icon": b.icon
        })
        
    return {
        "learner_id": learner.id,
        "username": learner.username,
        "display_name": profile.display_name,
        "avatar_url": profile.avatar_url,
        "learning_streak": profile.learning_streak,
        "xp": profile.xp,
        "resume_state": profile.resume_state_json,
        "topic_progress": formatted_progress,
        "recent_attempts": formatted_attempts,
        "badges": formatted_badges
    }

@router.get("/learner")
def get_learner_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Learners do not have access to any dashboard
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Learners do not have access to dashboard features"
    )

@router.get("/parent")
def get_parent_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "parent":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can view parent dashboard")
        
    links = db.query(ParentLearnerLink).filter(
        ParentLearnerLink.parent_user_id == current_user.id,
        ParentLearnerLink.status == "approved"
    ).all()
    
    kids_data = []
    for link in links:
        kid = db.query(User).filter(User.id == link.learner_user_id).first()
        if kid:
            summary = get_learner_dashboard_data(db, kid)
            kids_data.append(summary)
            
    # Get parent's own progress (initialize learner profile if not exists)
    from app.routers.progress import get_or_create_learner_profile
    get_or_create_learner_profile(current_user, db)
    parent_self_data = get_learner_dashboard_data(db, current_user)
    
    # Get/Generate AI recommendation
    from app.services.gemini import generate_recommendation
    rec = generate_recommendation(db, current_user)
    ai_recommendation = {
        "recommendation": rec.recommendation_text,
        "action_items": rec.action_items_json,
        "updated_at": rec.updated_at
    }
            
    return {
        "linked_learners": kids_data,
        "self_progress": parent_self_data,
        "ai_recommendation": ai_recommendation
    }

@router.get("/school")
def get_school_dashboard(class_name: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "school":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only schools can view school dashboard")
        
    query = db.query(SchoolLearnerLink).filter(
        SchoolLearnerLink.school_user_id == current_user.id,
        SchoolLearnerLink.status == "approved"
    )
    
    if class_name:
        query = query.filter(SchoolLearnerLink.class_name == class_name)
        
    links = query.all()
    
    students_data = []
    for link in links:
        student = db.query(User).filter(User.id == link.learner_user_id).first()
        if student:
            summary = get_learner_dashboard_data(db, student)
            summary.update({
                "class_name": link.class_name,
                "student_code": link.student_code,
                "linked_at": link.approved_at
            })
            students_data.append(summary)
            
    # Get/Generate AI recommendation
    from app.services.gemini import generate_recommendation
    rec = generate_recommendation(db, current_user)
    ai_recommendation = {
        "recommendation": rec.recommendation_text,
        "action_items": rec.action_items_json,
        "updated_at": rec.updated_at
    }
            
    return {
        "linked_learners": students_data,
        "ai_recommendation": ai_recommendation
    }

@router.post("/refresh-ai")
def refresh_ai_recommendation(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ["parent", "school"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parent and school accounts can refresh recommendations"
        )
    from app.services.gemini import generate_recommendation
    rec = generate_recommendation(db, current_user, force_refresh=True)
    return {
        "recommendation": rec.recommendation_text,
        "action_items": rec.action_items_json,
        "updated_at": rec.updated_at
    }

@router.get("/learner/{learner_id}")
def get_linked_learner_detail(learner_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        learner_uuid = uuid.UUID(learner_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid learner ID format")
        
    is_authorized = False
    
    if current_user.role == "parent":
        link = db.query(ParentLearnerLink).filter(
            ParentLearnerLink.parent_user_id == current_user.id,
            ParentLearnerLink.learner_user_id == learner_uuid,
            ParentLearnerLink.status == "approved"
        ).first()
        if link:
            is_authorized = True
            
    elif current_user.role == "school":
        link = db.query(SchoolLearnerLink).filter(
            SchoolLearnerLink.school_user_id == current_user.id,
            SchoolLearnerLink.learner_user_id == learner_uuid,
            SchoolLearnerLink.status == "approved"
        ).first()
        if link:
            is_authorized = True
            
    elif current_user.role == "admin":
        is_authorized = True
        
    elif current_user.id == learner_uuid:
        is_authorized = True
        
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this learner's details"
        )
        
    learner = db.query(User).options(joinedload(User.learner_profile)).filter(User.id == learner_uuid).first()
    if not learner:
        raise HTTPException(status_code=404, detail=f"Learner {learner_id} not found")
        
    return get_learner_dashboard_data(db, learner)

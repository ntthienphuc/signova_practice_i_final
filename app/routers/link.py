from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.profile import LearnerProfile, ParentProfile, SchoolProfile
from app.models.link import ParentLearnerLink, SchoolLearnerLink
from app.schemas.link import LinkRequest, SchoolLinkRequest, PendingLinksResponse, LearnerSearchResult, LinkResponse
from datetime import datetime, timezone
from typing import List
from uuid import UUID

router = APIRouter(prefix="/links", tags=["links"])

@router.get("/search-learner", response_model=List[LearnerSearchResult])
def search_learner(query: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ["parent", "school"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents or schools can search learners")
        
    if len(query) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters long")
        
    learners = db.query(User).filter(
        User.role == "learner",
        User.username.ilike(f"%{query}%")
    ).limit(10).all()
    
    results = []
    for l in learners:
        profile = l.learner_profile
        results.append({
            "id": l.id,
            "username": l.username,
            "display_name": profile.display_name if profile else l.username,
            "avatar_url": profile.avatar_url if profile else None
        })
    return results

@router.post("/parent/request", response_model=LinkResponse)
def request_parent_link(req: LinkRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "parent":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can request learner linkage")
        
    learner = db.query(User).filter(User.username == req.learner_username, User.role == "learner").first()
    if not learner:
        raise HTTPException(status_code=404, detail="Learner not found")
        
    existing = db.query(ParentLearnerLink).filter(
        ParentLearnerLink.parent_user_id == current_user.id,
        ParentLearnerLink.learner_user_id == learner.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail=f"Link request already exists with status: {existing.status}")
        
    link = ParentLearnerLink(
        parent_user_id=current_user.id,
        learner_user_id=learner.id,
        status="pending"
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link

@router.post("/school/request", response_model=LinkResponse)
def request_school_link(req: SchoolLinkRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "school":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only schools can request learner linkage")
        
    learner = db.query(User).filter(User.username == req.learner_username, User.role == "learner").first()
    if not learner:
        raise HTTPException(status_code=404, detail="Learner not found")
        
    existing = db.query(SchoolLearnerLink).filter(
        SchoolLearnerLink.school_user_id == current_user.id,
        SchoolLearnerLink.learner_user_id == learner.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail=f"Link request already exists with status: {existing.status}")
        
    link = SchoolLearnerLink(
        school_user_id=current_user.id,
        learner_user_id=learner.id,
        class_name=req.class_name,
        student_code=req.student_code,
        status="pending"
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link

@router.get("/pending", response_model=PendingLinksResponse)
def get_pending_links(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "learner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only learners can view pending link requests")
        
    parent_links = db.query(ParentLearnerLink).filter(
        ParentLearnerLink.learner_user_id == current_user.id,
        ParentLearnerLink.status == "pending"
    ).all()
    
    school_links = db.query(SchoolLearnerLink).filter(
        SchoolLearnerLink.learner_user_id == current_user.id,
        SchoolLearnerLink.status == "pending"
    ).all()
    
    formatted_parents = []
    for pl in parent_links:
        parent_user = db.query(User).filter(User.id == pl.parent_user_id).first()
        parent_profile = parent_user.parent_profile if parent_user else None
        formatted_parents.append({
            "id": pl.id,
            "parent_user_id": pl.parent_user_id,
            "parent_display_name": parent_profile.display_name if parent_profile else "Parent",
            "status": pl.status,
            "created_at": pl.created_at,
            "approved_at": pl.approved_at
        })
        
    formatted_schools = []
    for sl in school_links:
        school_user = db.query(User).filter(User.id == sl.school_user_id).first()
        school_profile = school_user.school_profile if school_user else None
        formatted_schools.append({
            "id": sl.id,
            "school_user_id": sl.school_user_id,
            "school_name": school_profile.school_name if school_profile else "School",
            "class_name": sl.class_name,
            "student_code": sl.student_code,
            "status": sl.status,
            "created_at": sl.created_at,
            "approved_at": sl.approved_at
        })
        
    return {
        "parent_links": formatted_parents,
        "school_links": formatted_schools
    }

@router.post("/parent/{id}/approve")
def approve_parent_link(id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "learner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only learners can approve link requests")
        
    link = db.query(ParentLearnerLink).filter(
        ParentLearnerLink.id == id,
        ParentLearnerLink.learner_user_id == current_user.id
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link request not found")
        
    link.status = "approved"
    link.approved_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}

@router.post("/parent/{id}/reject")
def reject_parent_link(id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "learner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only learners can reject link requests")
        
    link = db.query(ParentLearnerLink).filter(
        ParentLearnerLink.id == id,
        ParentLearnerLink.learner_user_id == current_user.id
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link request not found")
        
    link.status = "rejected"
    db.commit()
    return {"ok": True}

@router.post("/school/{id}/approve")
def approve_school_link(id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "learner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only learners can approve link requests")
        
    link = db.query(SchoolLearnerLink).filter(
        SchoolLearnerLink.id == id,
        SchoolLearnerLink.learner_user_id == current_user.id
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link request not found")
        
    link.status = "approved"
    link.approved_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}

@router.post("/school/{id}/reject")
def reject_school_link(id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "learner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only learners can reject link requests")
        
    link = db.query(SchoolLearnerLink).filter(
        SchoolLearnerLink.id == id,
        SchoolLearnerLink.learner_user_id == current_user.id
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link request not found")
        
    link.status = "rejected"
    db.commit()
    return {"ok": True}

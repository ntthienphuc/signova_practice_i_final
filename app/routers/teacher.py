"""
Teacher/School custom vocabulary package endpoints.
Allows school-role users to create named word packages from the bank.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from pathlib import Path
import os
import uuid

from app.db import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.custom_package import CustomPackage
from app.models.attempt import PracticeAttempt
from app.models.link import SchoolLearnerLink
from signova_practice_i.bank_store import BankStore

router = APIRouter(prefix="/teacher", tags=["teacher"])

APP_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_BANK_ROOT = APP_DIR / "outputs" / "reference_bank_20_best_allcam1_fe"
bank_root = Path(os.getenv("SIGNOVA_BANK_ROOT", str(DEFAULT_BANK_ROOT)))


def get_bank_store() -> BankStore:
    return BankStore(bank_root)


def require_school(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "school":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school/teacher accounts can use this feature"
        )
    return current_user


# ─── Schemas ────────────────────────────────────────────────────────────────

class BankWordItem(BaseModel):
    gloss: str
    has_reference: bool


class CreatePackageRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    glosses: List[str] = Field(..., min_length=2)


class AssignPackageRequest(BaseModel):
    assigned_class_name: Optional[str] = Field(None, max_length=50)
    assigned_student_ids: Optional[List[str]] = Field(default_factory=list)


class PackageResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    glosses: List[str]
    assigned_class_name: Optional[str]
    assigned_student_ids: Optional[List[str]]
    created_at: str

    class Config:
        from_attributes = True


def _assigned_learners_for_package(db: Session, pkg: CustomPackage) -> list[dict]:
    learners: dict[str, dict] = {}

    if pkg.assigned_class_name:
        links = db.query(SchoolLearnerLink).filter(
            SchoolLearnerLink.school_user_id == pkg.created_by,
            SchoolLearnerLink.class_name == pkg.assigned_class_name,
            SchoolLearnerLink.status == "approved",
        ).all()
        for link in links:
            learner = db.query(User).filter(User.id == link.learner_user_id).first()
            if learner:
                learners[str(learner.id)] = {
                    "learner_id": str(learner.id),
                    "username": learner.username,
                    "display_name": getattr(learner.learner_profile, "display_name", None),
                    "class_name": link.class_name,
                    "student_code": link.student_code,
                }

    for raw_id in pkg.assigned_student_ids or []:
        try:
            learner_id = uuid.UUID(str(raw_id))
        except ValueError:
            continue
        link = db.query(SchoolLearnerLink).filter(
            SchoolLearnerLink.school_user_id == pkg.created_by,
            SchoolLearnerLink.learner_user_id == learner_id,
            SchoolLearnerLink.status == "approved",
        ).first()
        learner = db.query(User).filter(User.id == learner_id).first()
        if learner:
            learners[str(learner.id)] = {
                "learner_id": str(learner.id),
                "username": learner.username,
                "display_name": getattr(learner.learner_profile, "display_name", None),
                "class_name": link.class_name if link else None,
                "student_code": link.student_code if link else None,
            }

    return list(learners.values())


def _package_progress(db: Session, pkg: CustomPackage) -> dict:
    assigned_learners = _assigned_learners_for_package(db, pkg)
    glosses = list(pkg.glosses or [])
    word_count = max(1, len(glosses))
    student_progress = []
    completed_count = 0
    total_scores: list[float] = []

    for learner in assigned_learners:
        learner_uuid = uuid.UUID(learner["learner_id"])
        attempts = db.query(PracticeAttempt).filter(
            PracticeAttempt.custom_package_id == pkg.id,
            PracticeAttempt.learner_user_id == learner_uuid,
            PracticeAttempt.practice_mode == "practice_ii",
        ).order_by(PracticeAttempt.created_at.desc()).all()

        best_by_gloss: dict[str, PracticeAttempt] = {}
        for attempt in attempts:
            if attempt.target_gloss not in glosses:
                continue
            current = best_by_gloss.get(attempt.target_gloss)
            if current is None or attempt.score > current.score:
                best_by_gloss[attempt.target_gloss] = attempt

        completed_glosses = [
            gloss
            for gloss, attempt in best_by_gloss.items()
            if attempt.accepted or float(attempt.score) >= 60.0
        ]
        scores = [float(attempt.score) for attempt in best_by_gloss.values()]
        total_scores.extend(scores)
        is_completed = len(set(completed_glosses)) >= len(glosses) if glosses else False
        if is_completed:
            completed_count += 1

        latest = attempts[0] if attempts else None
        student_progress.append({
            **learner,
            "attempt_count": len(attempts),
            "completed_words": len(set(completed_glosses)),
            "total_words": len(glosses),
            "completion_rate": round(len(set(completed_glosses)) / word_count, 3),
            "completed": is_completed,
            "average_score": round(sum(scores) / len(scores), 1) if scores else None,
            "best_score": round(max(scores), 1) if scores else None,
            "last_score": round(float(latest.score), 1) if latest else None,
            "last_attempt_at": latest.created_at.isoformat() if latest and latest.created_at else None,
            "wrong_word_count": sum(1 for attempt in attempts if attempt.wrong_word_detected),
        })

    student_progress.sort(key=lambda item: (item["completed"], item["completion_rate"], item["last_attempt_at"] or ""), reverse=True)
    return {
        "assigned_count": len(assigned_learners),
        "completed_count": completed_count,
        "completion_rate": round(completed_count / max(1, len(assigned_learners)), 3),
        "average_score": round(sum(total_scores) / len(total_scores), 1) if total_scores else None,
        "student_progress": student_progress,
    }


def _package_response(pkg: CustomPackage, db: Session, *, include_progress: bool = False) -> dict:
    payload = {
        "id": str(pkg.id),
        "title": pkg.title,
        "description": pkg.description,
        "glosses": pkg.glosses or [],
        "word_count": len(pkg.glosses or []),
        "assigned_class_name": pkg.assigned_class_name,
        "assigned_student_ids": pkg.assigned_student_ids or [],
        "created_at": pkg.created_at.isoformat() if pkg.created_at else None,
    }
    if include_progress:
        payload["assignment_progress"] = _package_progress(db, pkg)
    return payload


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/word-bank", summary="List all available glosses from the word bank")
def list_word_bank(current_user: User = Depends(require_school)):
    """Return all glosses available in the sign language reference bank."""
    store = get_bank_store()
    try:
        all_glosses = store.list_glosses()
    except Exception:
        all_glosses = []

    words = []
    for gloss in sorted(all_glosses):
        asset = store.get_display_reference(gloss)
        words.append(BankWordItem(
            gloss=gloss,
            has_reference=asset is not None
        ))

    return {"words": [w.model_dump() for w in words], "total": len(words)}


@router.get("/packages", summary="List custom packages created by this teacher")
def list_packages(current_user: User = Depends(require_school), db: Session = Depends(get_db)):
    packages = db.query(CustomPackage).filter(
        CustomPackage.created_by == current_user.id
    ).order_by(CustomPackage.created_at.desc()).all()

    return {
        "packages": [_package_response(pkg, db, include_progress=True) for pkg in packages]
    }


@router.post("/packages", summary="Create a new custom vocabulary package")
def create_package(
    body: CreatePackageRequest,
    current_user: User = Depends(require_school),
    db: Session = Depends(get_db)
):
    # Validate glosses exist in bank
    store = get_bank_store()
    try:
        available = set(store.list_glosses())
    except Exception:
        available = set()

    invalid = [g for g in body.glosses if g not in available]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Following glosses not found in word bank: {invalid}"
        )

    pkg = CustomPackage(
        id=uuid.uuid4(),
        title=body.title,
        description=body.description,
        glosses=list(body.glosses),
        created_by=current_user.id,
    )
    db.add(pkg)
    db.commit()
    db.refresh(pkg)

    return _package_response(pkg, db, include_progress=True)


@router.post("/packages/{package_id}/assign", summary="Assign custom package to a class or specific students")
def assign_package(
    package_id: str,
    body: AssignPackageRequest,
    current_user: User = Depends(require_school),
    db: Session = Depends(get_db)
):
    try:
        pkg_uuid = uuid.UUID(package_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid package ID")

    pkg = db.query(CustomPackage).filter(
        CustomPackage.id == pkg_uuid,
        CustomPackage.created_by == current_user.id
    ).first()

    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    pkg.assigned_class_name = body.assigned_class_name or None
    
    # Validate and store student UUIDs
    valid_student_ids = []
    if body.assigned_student_ids:
        for sid in body.assigned_student_ids:
            try:
                valid_student_ids.append(str(uuid.UUID(sid)))
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid student ID format: {sid}")
                
    pkg.assigned_student_ids = valid_student_ids
    
    db.commit()
    db.refresh(pkg)
    
    return _package_response(pkg, db, include_progress=True)


@router.delete("/packages/{package_id}", summary="Delete a custom package")
def delete_package(
    package_id: str,
    current_user: User = Depends(require_school),
    db: Session = Depends(get_db)
):
    try:
        pkg_uuid = uuid.UUID(package_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid package ID")

    pkg = db.query(CustomPackage).filter(
        CustomPackage.id == pkg_uuid,
        CustomPackage.created_by == current_user.id
    ).first()

    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    db.delete(pkg)
    db.commit()
    return {"message": "Package deleted successfully"}


@router.get("/assigned-packages", summary="Get custom packages assigned to the current student")
def get_assigned_packages(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models.link import SchoolLearnerLink
    # Find school learner links where learner is the current user
    links = db.query(SchoolLearnerLink).filter(
        SchoolLearnerLink.learner_user_id == current_user.id,
        SchoolLearnerLink.status == "approved"
    ).all()
    
    if not links:
        return {"packages": []}
        
    # Get all packages assigned to this student or their class(es)
    school_ids = [link.school_user_id for link in links]
    class_names = [link.class_name for link in links if link.class_name]
    
    from sqlalchemy import or_
    packages = db.query(CustomPackage).filter(
        CustomPackage.created_by.in_(school_ids)
    ).all()
    
    assigned = []
    for pkg in packages:
        is_assigned = False
        if pkg.assigned_class_name and pkg.assigned_class_name in class_names:
            is_assigned = True
        elif pkg.assigned_student_ids and str(current_user.id) in pkg.assigned_student_ids:
            is_assigned = True
            
        if is_assigned:
            teacher_user = db.query(User).filter(User.id == pkg.created_by).first()
            teacher_name = teacher_user.username if teacher_user else "Giáo viên"
            
            assigned.append({
                "id": str(pkg.id),
                "title": pkg.title,
                "description": pkg.description,
                "glosses": pkg.glosses or [],
                "word_count": len(pkg.glosses or []),
                "teacher_name": teacher_name,
                "created_at": pkg.created_at.isoformat() if pkg.created_at else None,
            })
            
    return {"packages": assigned}

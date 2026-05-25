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
    glosses: List[str] = Field(..., min_length=1)


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
        "packages": [
            {
                "id": str(pkg.id),
                "title": pkg.title,
                "description": pkg.description,
                "glosses": pkg.glosses or [],
                "word_count": len(pkg.glosses or []),
                "assigned_class_name": pkg.assigned_class_name,
                "assigned_student_ids": pkg.assigned_student_ids or [],
                "created_at": pkg.created_at.isoformat() if pkg.created_at else None,
            }
            for pkg in packages
        ]
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

    return {
        "id": str(pkg.id),
        "title": pkg.title,
        "description": pkg.description,
        "glosses": pkg.glosses or [],
        "word_count": len(pkg.glosses or []),
        "assigned_class_name": pkg.assigned_class_name,
        "assigned_student_ids": pkg.assigned_student_ids or [],
        "created_at": pkg.created_at.isoformat() if pkg.created_at else None,
    }


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
    
    return {
        "id": str(pkg.id),
        "title": pkg.title,
        "description": pkg.description,
        "glosses": pkg.glosses or [],
        "word_count": len(pkg.glosses or []),
        "assigned_class_name": pkg.assigned_class_name,
        "assigned_student_ids": pkg.assigned_student_ids or [],
        "created_at": pkg.created_at.isoformat() if pkg.created_at else None,
    }


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

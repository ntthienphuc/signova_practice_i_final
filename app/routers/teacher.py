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


class PackageResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    glosses: List[str]
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

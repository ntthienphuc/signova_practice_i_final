from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db import get_db
from app.auth import get_current_user, get_current_user_optional
from app.models.user import User
from app.models.profile import LearnerProfile
from app.services import mascot as mascot_service

router = APIRouter(prefix="/mascot", tags=["mascot"])


def _require_learner(current_user: User, db: Session) -> LearnerProfile:
    if current_user.role != "learner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only learners can access the mascot shop")
    profile = db.query(LearnerProfile).filter(LearnerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learner profile not found")
    return profile


class PurchaseRequest(BaseModel):
    item_key: str


class EquipRequest(BaseModel):
    item_key: str | None = None


@router.get("/shop")
def get_shop(
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    learner_id = current_user.id if (current_user and current_user.role == "learner") else None
    return {"items": mascot_service.get_shop(db, learner_user_id=learner_id)}


@router.post("/purchase")
def purchase_item(
    req: PurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _require_learner(current_user, db)
    return mascot_service.purchase_item(db, learner=profile, item_key=req.item_key)


@router.post("/equip")
def equip_item(
    req: EquipRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_learner(current_user, db)
    return mascot_service.equip_item(db, learner_user_id=current_user.id, item_key=req.item_key)


@router.get("/config")
def get_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_learner(current_user, db)
    return mascot_service.get_config(db, learner_user_id=current_user.id)

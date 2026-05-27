from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.mascot import MascotItem, LearnerMascotItem, LearnerMascotConfig
from app.models.profile import LearnerProfile


def get_shop(db: Session, learner_user_id: UUID | None = None) -> list[dict]:
    items = db.query(MascotItem).filter(MascotItem.is_available == True).order_by(MascotItem.xp_cost).all()

    owned_keys: set[str] = set()
    if learner_user_id:
        rows = db.query(LearnerMascotItem.item_key).filter(
            LearnerMascotItem.learner_user_id == learner_user_id
        ).all()
        owned_keys = {r.item_key for r in rows}

    return [
        {
            "item_key": item.item_key,
            "name": item.name,
            "description": item.description,
            "preview_filename": item.preview_filename,
            "mascot_filename": item.mascot_filename,
            "xp_cost": item.xp_cost,
            "is_available": item.is_available,
            "owned": item.item_key in owned_keys,
        }
        for item in items
    ]


def purchase_item(db: Session, learner: LearnerProfile, item_key: str) -> dict:
    item = db.query(MascotItem).filter(
        MascotItem.item_key == item_key,
        MascotItem.is_available == True
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    already_owned = db.query(LearnerMascotItem).filter(
        LearnerMascotItem.learner_user_id == learner.user_id,
        LearnerMascotItem.item_key == item_key,
    ).first()
    if already_owned:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Item already owned")

    if learner.xp < item.xp_cost:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Not enough XP. Need {item.xp_cost}, have {learner.xp}",
        )

    learner.xp -= item.xp_cost
    db.add(LearnerMascotItem(learner_user_id=learner.user_id, item_key=item_key))
    db.commit()
    db.refresh(learner)

    return {"xp_remaining": learner.xp, "item_key": item_key}


def equip_item(db: Session, learner_user_id: UUID, item_key: str | None) -> dict:
    if item_key is not None:
        owned = db.query(LearnerMascotItem).filter(
            LearnerMascotItem.learner_user_id == learner_user_id,
            LearnerMascotItem.item_key == item_key,
        ).first()
        if not owned:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Item not owned")

    config = db.query(LearnerMascotConfig).filter(
        LearnerMascotConfig.learner_user_id == learner_user_id
    ).first()

    if config:
        config.active_item_key = item_key
    else:
        config = LearnerMascotConfig(learner_user_id=learner_user_id, active_item_key=item_key)
        db.add(config)

    db.commit()
    return {"active_item_key": item_key}


def get_config(db: Session, learner_user_id: UUID) -> dict:
    config = db.query(LearnerMascotConfig).filter(
        LearnerMascotConfig.learner_user_id == learner_user_id
    ).first()

    owned_rows = db.query(LearnerMascotItem.item_key).filter(
        LearnerMascotItem.learner_user_id == learner_user_id
    ).all()

    return {
        "active_item_key": config.active_item_key if config else None,
        "owned_items": [r.item_key for r in owned_rows],
    }

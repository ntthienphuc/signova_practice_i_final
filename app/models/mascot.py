from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, UniqueConstraint, Uuid, func
from app.models.base import Base


class MascotItem(Base):
    __tablename__ = "mascot_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    item_key = Column(String(64), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    preview_filename = Column(String(100), nullable=False)
    mascot_filename = Column(String(100), nullable=False)
    xp_cost = Column(Integer, nullable=False)
    is_available = Column(Boolean, nullable=False, default=True)


class LearnerMascotItem(Base):
    __tablename__ = "learner_mascot_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    learner_user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_key = Column(String(64), ForeignKey("mascot_items.item_key", ondelete="CASCADE"), nullable=False)
    purchased_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("learner_user_id", "item_key", name="uq_learner_mascot_item"),
    )


class LearnerMascotConfig(Base):
    __tablename__ = "learner_mascot_config"

    learner_user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    active_item_key = Column(String(64), ForeignKey("mascot_items.item_key", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

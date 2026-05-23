from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Date, UniqueConstraint, Uuid, JSON, func
import uuid
from app.models.base import Base

class Badge(Base):
    __tablename__ = "badges"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    icon = Column(String(255), nullable=True)
    rule_type = Column(String(50), nullable=False) # e.g. attempts_count, streak_days, score_threshold
    rule_config_json = Column(JSON, nullable=True)

class LearnerBadge(Base):
    __tablename__ = "learner_badges"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    learner_user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_id = Column(Uuid, ForeignKey("badges.id", ondelete="CASCADE"), nullable=False)
    earned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("learner_user_id", "badge_id", name="uq_learner_badge"),
    )

class StreakLog(Base):
    __tablename__ = "streak_logs"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    learner_user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    xp_earned = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("learner_user_id", "date", name="uq_learner_streak_date"),
    )

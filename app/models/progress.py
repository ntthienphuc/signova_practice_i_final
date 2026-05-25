from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, UniqueConstraint, Float, Uuid, func
import uuid
from app.models.base import Base

class LearnerTopicProgress(Base):
    __tablename__ = "learner_topic_progress"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    learner_user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(String(50), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    completed_words = Column(Integer, nullable=False, default=0)
    checkpoint5_passed = Column(Boolean, nullable=False, default=False)
    practice2_final_passed = Column(Boolean, nullable=False, default=False)
    completed = Column(Boolean, nullable=False, default=False)
    last_word_index = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("learner_user_id", "topic_id", name="uq_learner_topic"),
    )

class LearnerWordProgress(Base):
    __tablename__ = "learner_word_progress"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    learner_user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    word_id = Column(Uuid, ForeignKey("words.id", ondelete="CASCADE"), nullable=False)
    studied = Column(Boolean, nullable=False, default=False)
    practice1_attempt_count = Column(Integer, nullable=False, default=0)
    best_practice1_score = Column(Float, nullable=True)
    last_practice1_score = Column(Float, nullable=True)
    accepted_once = Column(Boolean, nullable=False, default=False)
    failed_attempt_count = Column(Integer, nullable=False, default=0)
    correct_attempt_count = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("learner_user_id", "word_id", name="uq_learner_word"),
    )

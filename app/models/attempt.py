from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Float, Text, Uuid, JSON, Index, func
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base

class PracticeAttempt(Base):
    __tablename__ = "practice_attempts"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    learner_user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(String(50), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    word_id = Column(Uuid, ForeignKey("words.id", ondelete="SET NULL"), nullable=True)
    custom_package_id = Column(Uuid, ForeignKey("custom_packages.id", ondelete="SET NULL"), nullable=True, index=True)
    practice_mode = Column(String(20), nullable=False) # practice_i, practice_ii
    target_gloss = Column(String(100), nullable=False)
    lesson_glosses_json = Column(JSON, nullable=False)
    uploaded_video_path = Column(String(255), nullable=True)
    score = Column(Float, nullable=False)
    accepted = Column(Boolean, nullable=False, default=False)
    wrong_word_detected = Column(Boolean, nullable=False, default=False)
    predicted_wrong_gloss = Column(String(100), nullable=True)
    target_rank = Column(Integer, nullable=True)
    segment_start_ms = Column(Integer, nullable=True)
    segment_end_ms = Column(Integer, nullable=True)
    frame_stride = Column(Integer, nullable=False, default=2)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_practice_attempts_learner_created", "learner_user_id", "created_at"),
    )

    # Relationships
    feedback = relationship("PracticeAttemptFeedback", back_populates="attempt", uselist=False, cascade="all, delete-orphan")
    metrics = relationship("PracticeAttemptMetrics", back_populates="attempt", uselist=False, cascade="all, delete-orphan")

class PracticeAttemptFeedback(Base):
    __tablename__ = "practice_attempt_feedback"

    attempt_id = Column(Uuid, ForeignKey("practice_attempts.id", ondelete="CASCADE"), primary_key=True)
    overall_text = Column(Text, nullable=True)
    main_errors_json = Column(JSON, nullable=True)
    decision_json = Column(JSON, nullable=True)
    top_matches_json = Column(JSON, nullable=True)
    overlay_meta_json = Column(JSON, nullable=True)

    # Relationships
    attempt = relationship("PracticeAttempt", back_populates="feedback")

class PracticeAttemptMetrics(Base):
    __tablename__ = "practice_attempt_metrics"

    attempt_id = Column(Uuid, ForeignKey("practice_attempts.id", ondelete="CASCADE"), primary_key=True)
    valid_fraction = Column(Float, nullable=False)
    pose_sequence_length = Column(Integer, nullable=False)
    analysis_duration_ms = Column(Integer, nullable=True)

    # Relationships
    attempt = relationship("PracticeAttempt", back_populates="metrics")

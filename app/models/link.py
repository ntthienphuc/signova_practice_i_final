from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, Uuid, func
import uuid
from app.models.base import Base

class ParentLearnerLink(Base):
    __tablename__ = "parent_learner_links"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    parent_user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    learner_user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), nullable=False, default="pending") # pending, approved, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("parent_user_id", "learner_user_id", name="uq_parent_learner"),
    )

class SchoolLearnerLink(Base):
    __tablename__ = "school_learner_links"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    school_user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    learner_user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    class_name = Column(String(50), nullable=True)
    student_code = Column(String(50), nullable=True)
    status = Column(String(20), nullable=False, default="pending") # pending, approved, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("school_user_id", "learner_user_id", name="uq_school_learner"),
    )

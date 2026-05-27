from sqlalchemy import Column, String, DateTime, Uuid, func
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False) # learner, parent, school, admin
    status = Column(String(20), nullable=False, default="active") # active, pending, blocked
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    learner_profile = relationship("LearnerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    parent_profile = relationship("ParentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    school_profile = relationship("SchoolProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

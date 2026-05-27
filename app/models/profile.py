from sqlalchemy import Column, String, Date, Integer, ForeignKey, Uuid, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base

class LearnerProfile(Base):
    __tablename__ = "learner_profiles"

    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    display_name = Column(String(100), nullable=False)
    dob = Column(Date, nullable=True)
    avatar_url = Column(String(255), nullable=True)
    learning_streak = Column(Integer, nullable=False, default=0)
    xp = Column(Integer, nullable=False, default=0)
    resume_state_json = Column(JSON, nullable=True)

    # Relationships
    user = relationship("User", back_populates="learner_profile")

class ParentProfile(Base):
    __tablename__ = "parent_profiles"

    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    display_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)

    # Relationships
    user = relationship("User", back_populates="parent_profile")

class SchoolProfile(Base):
    __tablename__ = "school_profiles"

    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    school_name = Column(String(150), nullable=False)
    contact_name = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)

    # Relationships
    user = relationship("User", back_populates="school_profile")

from sqlalchemy import Column, String, DateTime, Uuid, JSON, Text, func
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base


class CustomPackage(Base):
    """A custom vocabulary package created by a school/teacher user."""
    __tablename__ = "custom_packages"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    glosses = Column(JSON, nullable=False, default=list)  # ["HELLO", "THANK_YOU", ...]
    created_by = Column(Uuid, nullable=False, index=True)  # school user_id
    assigned_class_name = Column(String(50), nullable=True)
    assigned_student_ids = Column(JSON, nullable=True, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

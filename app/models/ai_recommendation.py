from sqlalchemy import Column, DateTime, ForeignKey, Uuid, Text, JSON, func
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base

class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    recommendation_text = Column(Text, nullable=False)
    action_items_json = Column(JSON, nullable=False, default=list) # List of strings
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship to user
    user = relationship("User")

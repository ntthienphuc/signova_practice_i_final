from sqlalchemy import Column, String, Integer, ForeignKey, Uuid
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base

class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(50), primary_key=True) # e.g. 'topic_1'
    slug = Column(String(50), unique=True, nullable=False)
    title = Column(String(100), nullable=False)
    subtitle = Column(String(255), nullable=True)
    order_index = Column(Integer, nullable=False, default=0)

    # Relationships
    words = relationship("Word", back_populates="topic", cascade="all, delete-orphan")

class Word(Base):
    __tablename__ = "words"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    gloss = Column(String(100), unique=True, index=True, nullable=False)
    topic_id = Column(String(50), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    order_index = Column(Integer, nullable=False)
    checkpoint_group = Column(Integer, nullable=False, default=1)
    poster_url = Column(String(255), nullable=True)
    reference_video_url = Column(String(255), nullable=True)
    reference_playback_url = Column(String(255), nullable=True)
    reference_start_ms = Column(Integer, nullable=True)
    reference_end_ms = Column(Integer, nullable=True)

    # Relationships
    topic = relationship("Topic", back_populates="words")

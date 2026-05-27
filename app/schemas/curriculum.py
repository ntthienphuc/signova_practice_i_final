from pydantic import BaseModel
from uuid import UUID
from typing import List, Optional

class WordBase(BaseModel):
    id: UUID
    gloss: str
    topic_id: str
    order_index: int
    checkpoint_group: int
    poster_url: Optional[str] = None
    reference_video_url: Optional[str] = None
    reference_playback_url: Optional[str] = None
    reference_start_ms: Optional[int] = None
    reference_end_ms: Optional[int] = None

    class Config:
        from_attributes = True

class TopicBase(BaseModel):
    id: str
    slug: str
    title: str
    subtitle: Optional[str] = None
    order_index: int

    class Config:
        from_attributes = True

class WordStudySchema(BaseModel):
    order: int
    gloss: str
    checkpoint_group: int
    study: Optional[dict] = None

class TopicDetailSchema(TopicBase):
    word_count: int
    checkpoint_sizes: List[int] = [5, 10]
    glosses: List[str]
    words: List[WordStudySchema]

class CurriculumSchema(BaseModel):
    topics: List[TopicDetailSchema]

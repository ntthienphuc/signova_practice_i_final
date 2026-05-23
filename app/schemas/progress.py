from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class WordProgressResponse(BaseModel):
    word_id: UUID
    gloss: str
    studied: bool
    practice1_attempt_count: int
    best_practice1_score: Optional[float] = None
    last_practice1_score: Optional[float] = None
    accepted_once: bool
    updated_at: datetime

    class Config:
        from_attributes = True

class TopicProgressResponse(BaseModel):
    topic_id: str
    completed_words: int
    checkpoint5_passed: bool
    practice2_final_passed: bool
    completed: bool
    last_word_index: int
    updated_at: datetime

    class Config:
        from_attributes = True

class UserProgressSummary(BaseModel):
    learning_streak: int
    xp: int
    resume_state: Optional[dict] = None
    topic_progress: List[TopicProgressResponse]

class WordViewedRequest(BaseModel):
    word_id: UUID

class ResumeStateRequest(BaseModel):
    topic_id: str
    last_active_stage: str # learn, practice_i, quiz_intro, practice_ii, summary
    current_word_index: int

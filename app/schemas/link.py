from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List

class LinkRequest(BaseModel):
    learner_username: str

class SchoolLinkRequest(LinkRequest):
    class_name: Optional[str] = None
    student_code: Optional[str] = None

class LinkResponse(BaseModel):
    id: UUID
    status: str # pending, approved, rejected
    created_at: datetime
    approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ParentLinkDetail(LinkResponse):
    parent_user_id: UUID
    parent_display_name: str

class SchoolLinkDetail(LinkResponse):
    school_user_id: UUID
    school_name: str
    class_name: Optional[str] = None
    student_code: Optional[str] = None

class PendingLinksResponse(BaseModel):
    parent_links: List[ParentLinkDetail]
    school_links: List[SchoolLinkDetail]

class LearnerSearchResult(BaseModel):
    id: UUID
    username: str
    display_name: str
    avatar_url: Optional[str] = None

from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime, date
from typing import Optional

class UserBase(BaseModel):
    id: UUID
    username: str
    email: Optional[EmailStr] = None
    role: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class LearnerProfileSchema(BaseModel):
    display_name: str
    dob: Optional[date] = None
    avatar_url: Optional[str] = None
    learning_streak: int
    xp: int
    resume_state_json: Optional[dict] = None

    class Config:
        from_attributes = True

class ParentProfileSchema(BaseModel):
    display_name: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True

class SchoolProfileSchema(BaseModel):
    school_name: str
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None

    class Config:
        from_attributes = True

class UserMeResponse(UserBase):
    learner_profile: Optional[LearnerProfileSchema] = None
    parent_profile: Optional[ParentProfileSchema] = None
    school_profile: Optional[SchoolProfileSchema] = None

class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    dob: Optional[str] = None # YYYY-MM-DD
    phone: Optional[str] = None
    school_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None

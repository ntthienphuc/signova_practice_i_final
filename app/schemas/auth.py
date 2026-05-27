from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    email: Optional[EmailStr] = None
    display_name: Optional[str] = None
    role: str = Field(default="learner") # learner, parent, school
    
    # Specific fields for profiles based on role
    dob: Optional[str] = None # For learner (YYYY-MM-DD)
    phone: Optional[str] = None # For parent
    school_name: Optional[str] = None # For school or learner
    contact_name: Optional[str] = None # For school
    contact_phone: Optional[str] = None # For school

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str # user id
    role: str
    exp: int

class CreateChildRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    display_name: Optional[str] = None
    dob: Optional[str] = None # For learner (YYYY-MM-DD)

class CreateStudentRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    display_name: Optional[str] = None
    class_name: Optional[str] = None
    student_code: Optional[str] = None

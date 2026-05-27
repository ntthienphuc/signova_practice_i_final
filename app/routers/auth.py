from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db import get_db
from app.auth.hash import hash_password, verify_password
from app.auth.jwt import create_access_token, create_refresh_token, decode_refresh_token
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.profile import LearnerProfile, ParentProfile, SchoolProfile
from app.models.link import ParentLearnerLink, SchoolLearnerLink
from app.schemas.auth import RegisterRequest, TokenResponse, CreateChildRequest, CreateStudentRequest
from app.schemas.user import UserMeResponse, ProfileUpdateRequest
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    if req.email:
        if db.query(User).filter(User.email == req.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
            
    display_name = req.display_name if req.display_name else req.username
        
    hashed = hash_password(req.password)
    user = User(
        username=req.username,
        email=req.email,
        password_hash=hashed,
        role=req.role,
        status="active"
    )
    db.add(user)
    db.flush() # To get user.id
    
    # Create profile based on role
    if req.role == "learner":
        profile = LearnerProfile(
            user_id=user.id,
            display_name=display_name,
            dob=datetime.strptime(req.dob, "%Y-%m-%d").date() if req.dob else None,
            avatar_url=None,
            learning_streak=0,
            xp=0
        )
        db.add(profile)
    elif req.role == "parent":
        profile = ParentProfile(
            user_id=user.id,
            display_name=display_name,
            phone=req.phone
        )
        db.add(profile)
    elif req.role == "school":
        profile = SchoolProfile(
            user_id=user.id,
            school_name=req.school_name or display_name,
            contact_name=req.contact_name,
            contact_phone=req.contact_phone
        )
        db.add(profile)
    else:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid role specified")
        
    db.commit()
    
    # Generate tokens
    access = create_access_token({"sub": str(user.id), "role": user.role})
    refresh = create_refresh_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=access, refresh_token=refresh)

@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    if user.status != "active":
        raise HTTPException(status_code=400, detail="User account is inactive or blocked")
        
    access = create_access_token({"sub": str(user.id), "role": user.role})
    refresh = create_refresh_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=access, refresh_token=refresh)

@router.post("/refresh", response_model=TokenResponse)
def refresh(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_refresh_token(refresh_token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.status != "active":
        raise HTTPException(status_code=401, detail="User not found or inactive")
        
    access = create_access_token({"sub": str(user.id), "role": user.role})
    new_refresh = create_refresh_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=access, refresh_token=new_refresh)

@router.get("/me", response_model=UserMeResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/update-profile")
def update_profile(req: ProfileUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "learner":
        profile = current_user.learner_profile
        if profile:
            if req.display_name:
                profile.display_name = req.display_name
            if req.dob:
                try:
                    profile.dob = datetime.strptime(req.dob, "%Y-%m-%d").date()
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid DOB format, must be YYYY-MM-DD")
    elif current_user.role == "parent":
        profile = current_user.parent_profile
        if profile:
            if req.display_name:
                profile.display_name = req.display_name
            if req.phone is not None:
                profile.phone = req.phone
    elif current_user.role == "school":
        profile = current_user.school_profile
        if profile:
            if req.school_name:
                profile.school_name = req.school_name
            if req.contact_name is not None:
                profile.contact_name = req.contact_name
            if req.contact_phone is not None:
                profile.contact_phone = req.contact_phone
    else:
        raise HTTPException(status_code=400, detail="Invalid user role for profile update")
        
    db.commit()
    return {"ok": True}

@router.post("/create-child")
def create_child(req: CreateChildRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "parent":
        raise HTTPException(status_code=403, detail="Only parents can create child accounts")
        
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed = hash_password(req.password)
    child_user = User(
        username=req.username,
        password_hash=hashed,
        role="learner",
        status="active"
    )
    db.add(child_user)
    db.flush()
    
    display_name = req.display_name if req.display_name else req.username
    dob_val = None
    if req.dob:
        try:
            dob_val = datetime.strptime(req.dob, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid DOB format, must be YYYY-MM-DD")
            
    profile = LearnerProfile(
        user_id=child_user.id,
        display_name=display_name,
        dob=dob_val,
        avatar_url=None,
        learning_streak=0,
        xp=0
    )
    db.add(profile)
    
    # Auto approve link
    link = ParentLearnerLink(
        parent_user_id=current_user.id,
        learner_user_id=child_user.id,
        status="approved",
        approved_at=datetime.utcnow()
    )
    db.add(link)
    
    db.commit()
    return {"ok": True, "child_id": str(child_user.id)}

@router.post("/create-student")
def create_student(req: CreateStudentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "school":
        raise HTTPException(status_code=403, detail="Only schools can create student accounts")
        
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed = hash_password(req.password)
    student_user = User(
        username=req.username,
        password_hash=hashed,
        role="learner",
        status="active"
    )
    db.add(student_user)
    db.flush()
    
    display_name = req.display_name if req.display_name else req.username
    profile = LearnerProfile(
        user_id=student_user.id,
        display_name=display_name,
        dob=None,
        avatar_url=None,
        learning_streak=0,
        xp=0
    )
    db.add(profile)
    
    # Auto approve link
    link = SchoolLearnerLink(
        school_user_id=current_user.id,
        learner_user_id=student_user.id,
        class_name=req.class_name,
        student_code=req.student_code,
        status="approved",
        approved_at=datetime.utcnow()
    )
    db.add(link)
    
    db.commit()
    return {"ok": True, "student_id": str(student_user.id)}

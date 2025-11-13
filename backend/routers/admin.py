from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from services.database import get_db
from services.auth_service import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    create_spoof_token,
    get_current_admin_user
)
from config import settings
from models.user import User
from schemas.user import AdminCreate, User as UserSchema, Token, UserLogin, SpoofRequest

router = APIRouter()

@router.post("/register", response_model=UserSchema)
async def register_admin(admin: AdminCreate, db: Session = Depends(get_db)):
    """Register a new admin user"""
    # Check if user already exists
    db_user = db.query(User).filter(User.email == admin.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new admin user
    hashed_password = get_password_hash(admin.password)
    db_user = User(
        email=admin.email,
        hashed_password=hashed_password,
        name=admin.name,
        age=admin.age,
        height=admin.height,
        weight=admin.weight,
        gender=admin.gender,
        activity_level=admin.activity_level,
        dietary_restrictions=admin.dietary_restrictions,
        allergies=admin.allergies,
        avatar=admin.avatar,
        bio=admin.bio,
        location=admin.location,
        is_admin=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=Token)
async def login_admin(admin_credentials: UserLogin, db: Session = Depends(get_db)):
    """Login admin and return access token"""
    user = db.query(User).filter(User.email == admin_credentials.email).first()
    
    if not user or not verify_password(admin_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "admin": True}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users", response_model=List[UserSchema])
async def get_all_users(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    users = db.query(User).all()
    return users

@router.post("/spoof", response_model=Token)
async def spoof_user(
    spoof_request: SpoofRequest,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Spoof another user (admin only)"""
    # Check if target user exists
    target_user = db.query(User).filter(User.email == spoof_request.user_email).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent spoofing other admins
    if target_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot spoof another admin user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    spoof_token = create_spoof_token(
        admin_email=current_admin.email,
        target_email=target_user.email,
        expires_delta=access_token_expires
    )
    
    return {"access_token": spoof_token, "token_type": "bearer"}

@router.get("/me", response_model=UserSchema)
async def get_current_admin(current_admin: User = Depends(get_current_admin_user)):
    """Get current admin user info"""
    return current_admin
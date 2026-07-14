from datetime import timedelta
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List, Optional

from services.database import get_db
from services.auth_service import (
    verify_password,
    get_password_hash,
    create_spoof_token,
    create_token_pair,
    get_current_admin_user,
)
from config import settings
from models.user import User
from schemas.user import (
    AdminCreate,
    User as UserSchema,
    Token,
    UserLogin,
    SpoofRequest,
    UserAdminUpdate,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _authorize_admin_registration(db: Session, admin_secret: Optional[str]) -> None:
    """Lock down open admin registration.

    Rules:
    - If ADMIN_REGISTRATION_SECRET is configured, require matching X-Admin-Secret.
    - In production, ADMIN_REGISTRATION_SECRET is required (enforced in Settings).
    - In development without a secret, only the first admin may self-register.
    """
    existing_admins = db.query(User).filter(User.is_admin == True).count()  # noqa: E712

    if settings.ADMIN_REGISTRATION_SECRET:
        if admin_secret != settings.ADMIN_REGISTRATION_SECRET:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid or missing X-Admin-Secret header",
            )
        return

    if settings.ENVIRONMENT == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin registration is disabled",
        )

    if existing_admins > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin registration is locked. Set ADMIN_REGISTRATION_SECRET to add more admins.",
        )


@router.post("/register", response_model=UserSchema)
async def register_admin(
    admin: AdminCreate,
    db: Session = Depends(get_db),
    x_admin_secret: Optional[str] = Header(default=None, alias="X-Admin-Secret"),
):
    """Register a new admin user (protected)."""
    _authorize_admin_registration(db, x_admin_secret)

    db_user = db.query(User).filter(User.email == admin.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

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
        is_admin=True,
        is_verified=True,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    logger.info("Admin registered: %s", db_user.email)
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
            detail="Admin access required",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    return create_token_pair(user.email, extra={"admin": True})


@router.get("/users", response_model=List[UserSchema])
async def get_all_users(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get all users (admin only)"""
    users = db.query(User).order_by(User.id.asc()).all()
    return users


@router.patch("/users/{user_id}", response_model=UserSchema)
async def update_user_admin_fields(
    user_id: int,
    payload: UserAdminUpdate,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Activate/deactivate or mark users verified (admin only)."""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if target.id == current_admin.id and payload.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own admin account",
        )

    if target.is_admin and payload.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot deactivate another admin user",
        )

    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    for field, value in data.items():
        setattr(target, field, value)

    db.commit()
    db.refresh(target)
    logger.info(
        "Admin %s updated user %s fields=%s",
        current_admin.email,
        target.email,
        list(data.keys()),
    )
    return target


@router.post("/spoof", response_model=Token)
async def spoof_user(
    spoof_request: SpoofRequest,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Spoof another user (admin only)"""
    target_user = db.query(User).filter(User.email == spoof_request.user_email).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if target_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot spoof another admin user",
        )

    if not target_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot spoof inactive user",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    spoof_token = create_spoof_token(
        admin_email=current_admin.email,
        target_email=target_user.email,
        expires_delta=access_token_expires,
    )
    refresh = create_token_pair(target_user.email)["refresh_token"]

    logger.warning(
        "Admin spoof: admin=%s target=%s",
        current_admin.email,
        target_user.email,
    )

    return {
        "access_token": spoof_token,
        "refresh_token": refresh,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserSchema)
async def get_current_admin(current_admin: User = Depends(get_current_admin_user)):
    """Get current admin user info"""
    return current_admin

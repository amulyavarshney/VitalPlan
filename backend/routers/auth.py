from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import logging

from services.database import get_db
from services.auth_service import (
    verify_password,
    get_password_hash,
    create_token_pair,
    verify_token,
    create_password_reset_token,
    create_email_verification_token,
    email_verification_required,
)
from services.rate_limit import auth_rate_limiter, password_reset_limiter, client_key
from services.email_service import send_password_reset_email, send_verification_email
from config import settings
from models.user import User
from schemas.user import (
    UserCreate,
    User as UserSchema,
    RegisterResponse,
    Token,
    UserLogin,
    RefreshRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    EmailVerificationConfirm,
    EmailVerificationResend,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _ensure_verified_for_login(user: User) -> None:
    if email_verification_required() and not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Check your inbox or request a new verification link.",
        )


@router.post("/register", response_model=RegisterResponse)
async def register(user: UserCreate, request: Request, db: Session = Depends(get_db)):
    """Register a new user"""
    auth_rate_limiter.check(client_key(request, "register"))

    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    require_verification = email_verification_required()
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        name=user.name,
        age=user.age,
        height=user.height,
        weight=user.weight,
        gender=user.gender,
        activity_level=user.activity_level,
        dietary_restrictions=user.dietary_restrictions,
        allergies=user.allergies,
        avatar=user.avatar,
        bio=user.bio,
        location=user.location,
        is_admin=False,
        is_verified=not require_verification,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    response = RegisterResponse.model_validate(db_user)
    response.verification_required = require_verification

    if require_verification:
        token = create_email_verification_token(db_user.email)
        try:
            delivery = send_verification_email(to_email=db_user.email, verification_token=token)
            response.delivery = delivery["mode"]
        except Exception:
            logger.exception("Verification email failed for %s", db_user.email)
            if settings.ENVIRONMENT == "production":
                raise HTTPException(status_code=500, detail="Unable to send verification email")
            response.delivery = "failed"

        response.message = "Account created. Please verify your email before signing in."
        if settings.ENVIRONMENT != "production":
            response.verification_token = token
            response.verification_url = (
                f"{settings.FRONTEND_URL.rstrip('/')}/verify-email?token={token}"
            )
    else:
        response.message = "Account created successfully."

    return response


@router.post("/verify-email")
async def verify_email(
    payload: EmailVerificationConfirm,
    request: Request,
    db: Session = Depends(get_db),
):
    """Confirm email ownership with a verification token."""
    auth_rate_limiter.check(client_key(request, "verify-email"))

    token_data = verify_token(payload.token, expected_type="email_verification")
    if token_data is None:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    email = token_data.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    user.is_verified = True
    db.commit()
    return {"message": "Email verified successfully. You can sign in now."}


@router.post("/verify-email/resend")
async def resend_verification_email(
    payload: EmailVerificationResend,
    request: Request,
    db: Session = Depends(get_db),
):
    """Resend email verification link (always returns a generic message)."""
    password_reset_limiter.check(client_key(request, "verify-email-resend"))

    response = {
        "message": "If that email exists and is unverified, a verification link has been sent.",
    }
    user = db.query(User).filter(User.email == payload.email).first()
    if user and user.is_active and not user.is_verified:
        token = create_email_verification_token(user.email)
        try:
            delivery = send_verification_email(to_email=user.email, verification_token=token)
            response["delivery"] = delivery["mode"]
        except Exception:
            logger.exception("Verification resend failed for %s", user.email)
            if settings.ENVIRONMENT == "production":
                raise HTTPException(status_code=500, detail="Unable to send verification email")
            response["delivery"] = "failed"

        if settings.ENVIRONMENT != "production":
            response["verification_token"] = token
            response["verification_url"] = (
                f"{settings.FRONTEND_URL.rstrip('/')}/verify-email?token={token}"
            )

    return response


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Login user and return access + refresh tokens"""
    auth_rate_limiter.check(client_key(request, "login"))

    user = db.query(User).filter(User.email == user_credentials.email).first()

    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    _ensure_verified_for_login(user)
    return create_token_pair(user.email)


@router.post("/refresh", response_model=Token)
async def refresh_access_token(payload: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    """Exchange a refresh token for a new access/refresh pair"""
    auth_rate_limiter.check(client_key(request, "refresh"))

    token_data = verify_token(payload.refresh_token, expected_type="refresh")
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = token_data.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    _ensure_verified_for_login(user)
    return create_token_pair(user.email)


@router.post("/password-reset/request")
async def request_password_reset(
    payload: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Request a password reset email (console fallback when SMTP unset)."""
    password_reset_limiter.check(client_key(request, "password-reset"))

    user = db.query(User).filter(User.email == payload.email).first()
    response = {
        "message": "If that email exists, a password reset link has been sent.",
    }

    if user and user.is_active:
        token = create_password_reset_token(user.email)
        logger.info("Password reset requested for %s", user.email)
        try:
            delivery = send_password_reset_email(to_email=user.email, reset_token=token)
            response["delivery"] = delivery["mode"]
        except Exception:
            logger.exception("Password reset email failed for %s", user.email)
            if settings.ENVIRONMENT == "production":
                raise HTTPException(status_code=500, detail="Unable to send reset email")
            response["delivery"] = "failed"

        # Helpful for local/testing when SMTP is not configured
        if settings.ENVIRONMENT != "production":
            response["reset_token"] = token
            response["reset_url"] = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"
            response["note"] = "Token/URL returned only in non-production environments"

    return response


@router.post("/password-reset/confirm")
async def confirm_password_reset(
    payload: PasswordResetConfirm,
    request: Request,
    db: Session = Depends(get_db),
):
    """Confirm password reset with a valid token."""
    password_reset_limiter.check(client_key(request, "password-reset-confirm"))

    token_data = verify_token(payload.token, expected_type="password_reset")
    if token_data is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    email = token_data.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@router.post("/token", response_model=Token)
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """OAuth2 compatible token login"""
    auth_rate_limiter.check(client_key(request, "token"))

    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    _ensure_verified_for_login(user)
    return create_token_pair(user.email)

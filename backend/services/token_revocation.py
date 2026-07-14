"""JWT revocation via jti denylist."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from config import settings
from models.revoked_token import RevokedToken


def revoke_jti(db: Session, jti: str, expires_at: datetime) -> None:
    if not jti:
        return
    existing = db.query(RevokedToken).filter(RevokedToken.jti == jti).first()
    if existing:
        return
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    db.add(RevokedToken(jti=jti, expires_at=expires_at))
    db.commit()


def is_jti_revoked(db: Session, jti: Optional[str]) -> bool:
    if not jti:
        return False
    row = db.query(RevokedToken).filter(RevokedToken.jti == jti).first()
    return row is not None


def revoke_token_string(db: Session, token: str) -> bool:
    """Revoke a JWT by embedding its jti. Returns True if revoked."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return False
    jti = payload.get("jti")
    exp = payload.get("exp")
    if not jti or not exp:
        return False
    revoke_jti(db, jti, datetime.fromtimestamp(exp, tz=timezone.utc))
    return True


def purge_expired_revocations(db: Session) -> int:
    now = datetime.now(timezone.utc)
    deleted = (
        db.query(RevokedToken)
        .filter(RevokedToken.expires_at < now)
        .delete(synchronize_session=False)
    )
    db.commit()
    return deleted

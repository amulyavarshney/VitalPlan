from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from services.database import get_db
from services.auth_service import get_current_user, verify_password
from services.account_deletion import permanently_delete_user
from services.audit_service import log_audit
from services.data_export import export_user_data
from models.user import User
from schemas.user import AccountDeleteRequest, User as UserSchema, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserSchema)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.get("/me/export")
async def export_current_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download a JSON export of the signed-in user's data."""
    payload = export_user_data(db, current_user)
    filename = f"vitalplan-export-user-{current_user.id}.json"
    return JSONResponse(
        content=payload,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.put("/me", response_model=UserSchema)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user information"""
    update_data = user_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user


@router.delete("/me")
async def delete_current_user(
    payload: AccountDeleteRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently erase the signed-in account and related data (GDPR erasure)."""
    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
        )
    user_id = current_user.id
    email = current_user.email
    log_audit(
        db,
        action="user.delete",
        resource_type="user",
        actor=current_user,
        resource_id=str(user_id),
        details={"email": email},
        request=request,
    )
    permanently_delete_user(db, current_user)
    return {"message": "Account permanently deleted"}
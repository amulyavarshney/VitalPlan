from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from services.database import get_db
from services.auth_service import get_current_user
from services.data_export import export_user_data
from models.user import User
from schemas.user import User as UserSchema, UserUpdate

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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deactivate current user account"""
    current_user.is_active = False
    db.commit()

    return {"message": "Account deactivated successfully"}
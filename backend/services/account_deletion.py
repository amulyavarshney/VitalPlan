"""Permanently erase a user's account and related records."""
from __future__ import annotations

from sqlalchemy.orm import Session

from models.diet_plan import DietPlan
from models.goal import Goal
from models.order import Order
from models.scanned_food import ScannedFood
from models.user import User
from services.storage_service import delete_upload


def permanently_delete_user(db: Session, user: User) -> None:
    """Delete all user-owned rows, upload blobs, then the user row itself."""
    user_id = user.id

    scans = db.query(ScannedFood).filter(ScannedFood.user_id == user_id).all()
    for scan in scans:
        delete_upload(scan.image_url)

    db.query(Goal).filter(Goal.user_id == user_id).delete(synchronize_session=False)
    db.query(DietPlan).filter(DietPlan.user_id == user_id).delete(synchronize_session=False)
    db.query(Order).filter(Order.user_id == user_id).delete(synchronize_session=False)
    db.query(ScannedFood).filter(ScannedFood.user_id == user_id).delete(synchronize_session=False)
    db.delete(user)
    db.commit()

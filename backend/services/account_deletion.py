"""Permanently erase a user's account and related records."""
from __future__ import annotations

from sqlalchemy.orm import Session

from models.diet_plan import DietPlan
from models.goal import Goal
from models.order import Order
from models.scanned_food import ScannedFood
from models.user import User


def permanently_delete_user(db: Session, user: User) -> None:
    """Delete all user-owned rows, then the user row itself."""
    user_id = user.id
    db.query(Goal).filter(Goal.user_id == user_id).delete(synchronize_session=False)
    db.query(DietPlan).filter(DietPlan.user_id == user_id).delete(synchronize_session=False)
    db.query(Order).filter(Order.user_id == user_id).delete(synchronize_session=False)
    db.query(ScannedFood).filter(ScannedFood.user_id == user_id).delete(synchronize_session=False)
    db.delete(user)
    db.commit()

"""Build a portable JSON export of a user's VitalPlan data."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from sqlalchemy.orm import Session

from models.diet_plan import DietPlan
from models.goal import Goal
from models.order import Order
from models.scanned_food import ScannedFood
from models.user import User


def _iso(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def export_user_data(db: Session, user: User) -> Dict[str, Any]:
    goals = db.query(Goal).filter(Goal.user_id == user.id).order_by(Goal.id.asc()).all()
    plans = db.query(DietPlan).filter(DietPlan.user_id == user.id).order_by(DietPlan.id.desc()).all()
    orders = db.query(Order).filter(Order.user_id == user.id).order_by(Order.id.desc()).all()
    scans = (
        db.query(ScannedFood)
        .filter(ScannedFood.user_id == user.id)
        .order_by(ScannedFood.analyzed_at.desc())
        .limit(200)
        .all()
    )

    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "format_version": 1,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "age": user.age,
            "height": user.height,
            "weight": user.weight,
            "gender": user.gender,
            "activity_level": user.activity_level,
            "dietary_restrictions": user.dietary_restrictions or [],
            "allergies": user.allergies or [],
            "bio": user.bio,
            "location": user.location,
            "is_verified": bool(user.is_verified),
            "created_at": _iso(user.created_at),
        },
        "goals": [
            {
                "id": g.id,
                "type": g.type,
                "title": g.title,
                "description": g.description,
                "priority": g.priority,
                "target_date": _iso(g.target_date),
                "is_active": g.is_active,
                "created_at": _iso(g.created_at),
            }
            for g in goals
        ],
        "diet_plans": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "meals": p.meals,
                "supplements": p.supplements,
                "ai_recommendations": p.ai_recommendations,
                "total_calories": p.total_calories,
                "macros": p.macros,
                "goals": p.goals,
                "is_active": p.is_active,
                "created_at": _iso(p.created_at),
            }
            for p in plans
        ],
        "orders": [
            {
                "id": o.id,
                "items": o.items,
                "total": o.total,
                "status": o.status,
                "vendor": o.vendor,
                "delivery_address": o.delivery_address,
                "payment_method": o.payment_method,
                "payment_status": o.payment_status,
                "payment_provider": o.payment_provider,
                "paid_at": _iso(o.paid_at),
                "created_at": _iso(o.created_at),
            }
            for o in orders
        ],
        "scanned_foods": [
            {
                "id": s.id,
                "name": s.name,
                "brand": s.brand,
                "barcode": s.barcode,
                "calories": s.calories,
                "serving_size": s.serving_size,
                "macros": s.macros,
                "nutrition_details": s.nutrition_details,
                "ai_insights": s.ai_insights,
                "confidence": s.confidence,
                "image_url": s.image_url,
                "analyzed_at": _iso(s.analyzed_at),
            }
            for s in scans
        ],
    }

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from services.database import get_db
from services.auth_service import get_current_user
from models.user import User
from models.order import Order

router = APIRouter()

@router.post("/")
async def create_order(
    order_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new order"""
    try:
        db_order = Order(
            user_id=current_user.id,
            items=order_data.get("items", []),
            total=order_data.get("total", 0),
            vendor=order_data.get("vendor", "local"),
            delivery_address=order_data.get("delivery_address", ""),
            payment_method=order_data.get("payment_method", "card"),
            status="pending"
        )
        
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        
        return {
            "message": "Order created successfully",
            "order_id": db_order.id,
            "status": db_order.status
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create order: {str(e)}"
        )

@router.get("/")
async def get_user_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's order history"""
    orders = db.query(Order)\
        .filter(Order.user_id == current_user.id)\
        .order_by(Order.created_at.desc())\
        .all()
    
    return orders

@router.get("/{order_id}")
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific order"""
    order = db.query(Order)\
        .filter(Order.id == order_id, Order.user_id == current_user.id)\
        .first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order

@router.put("/{order_id}/status")
async def update_order_status(
    order_id: int,
    status_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update order status (for testing purposes)"""
    order = db.query(Order)\
        .filter(Order.id == order_id, Order.user_id == current_user.id)\
        .first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    new_status = status_data.get("status")
    if new_status not in ["pending", "processing", "shipped", "delivered"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    order.status = new_status
    db.commit()
    
    return {"message": f"Order status updated to {new_status}"}
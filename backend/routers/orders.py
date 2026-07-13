from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from services.database import get_db
from services.auth_service import get_current_user
from models.user import User
from models.order import Order
from schemas.order import OrderCreate, Order as OrderSchema, OrderStatusUpdate, OrderCreateResponse

router = APIRouter()


@router.post("/", response_model=OrderCreateResponse)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new order"""
    try:
        db_order = Order(
            user_id=current_user.id,
            items=[item.model_dump() for item in order_data.items],
            total=order_data.total,
            vendor=order_data.vendor,
            delivery_address=order_data.delivery_address,
            payment_method=order_data.payment_method,
            status="pending",
        )

        db.add(db_order)
        db.commit()
        db.refresh(db_order)

        return OrderCreateResponse(
            message="Order created successfully",
            order_id=db_order.id,
            status=db_order.status,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create order: {str(e)}",
        )


@router.get("/", response_model=List[OrderSchema])
async def get_user_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's order history"""
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return orders


@router.get("/{order_id}", response_model=OrderSchema)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific order"""
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return order


@router.put("/{order_id}/status")
async def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update order status"""
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status_data.status
    db.commit()

    return {"message": f"Order status updated to {status_data.status}"}

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List

from services.database import get_db
from services.auth_service import get_current_user
from services.payment_service import (
    cancel_payment_intent,
    create_payment_intent,
    confirm_payment,
    payment_public_config,
)
from services.order_payment import apply_payment_result
from services.order_pricing import compute_order_totals, totals_match
from services.rate_limit import client_key, order_rate_limiter
from models.user import User
from models.order import Order
from schemas.order import (
    OrderCreate,
    Order as OrderSchema,
    OrderStatusUpdate,
    OrderCreateResponse,
    OrderPayRequest,
    PaymentInfo,
)

router = APIRouter()

CANCELLABLE_PAYMENT_STATUSES = {"unpaid", "requires_action", "failed"}
NON_CANCELLABLE_ORDER_STATUSES = {"delivered", "shipped"}


@router.get("/payments/config")
async def get_payment_config(current_user: User = Depends(get_current_user)):
    """Public payment configuration for the authenticated client."""
    return payment_public_config()


@router.post("/", response_model=OrderCreateResponse)
async def create_order(
    order_data: OrderCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new order and initialize payment."""
    order_rate_limiter.check(client_key(request, f"create:{current_user.id}"))
    pricing = compute_order_totals(items=order_data.items, vendor=order_data.vendor)
    if not totals_match(order_data.total, pricing["total"]):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Order total mismatch. Expected {pricing['total']:.2f} "
                f"(subtotal {pricing['subtotal']:.2f} + delivery {pricing['delivery_fee']:.2f} "
                f"+ tax {pricing['tax']:.2f}), got {order_data.total:.2f}"
            ),
        )

    try:
        db_order = Order(
            user_id=current_user.id,
            items=[item.model_dump() for item in order_data.items],
            total=pricing["total"],
            vendor=order_data.vendor,
            delivery_address=order_data.delivery_address,
            payment_method=order_data.payment_method,
            status="pending",
            payment_status="unpaid",
        )

        db.add(db_order)
        db.commit()
        db.refresh(db_order)

        payment = await create_payment_intent(
            amount=pricing["total"],
            order_id=db_order.id,
            customer_email=current_user.email,
        )

        db_order.payment_intent_id = payment["payment_intent_id"]
        db_order.payment_provider = payment["provider"]
        db_order.payment_status = "requires_action"
        db.commit()
        db.refresh(db_order)

        return OrderCreateResponse(
            message="Order created successfully",
            order_id=db_order.id,
            status=db_order.status,
            payment_status=db_order.payment_status,
            payment=PaymentInfo(
                provider=payment["provider"],
                payment_intent_id=payment["payment_intent_id"],
                client_secret=payment.get("client_secret"),
                publishable_key=payment.get("publishable_key"),
                status=payment["status"],
            ),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create order: {str(e)}",
        )


@router.post("/{order_id}/pay", response_model=OrderSchema)
async def pay_order(
    order_id: int,
    payload: OrderPayRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Confirm payment for an order (demo auto-succeeds; Stripe verifies intent)."""
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.payment_status == "paid":
        return order

    intent_id = payload.payment_intent_id or order.payment_intent_id
    if not intent_id:
        raise HTTPException(status_code=400, detail="Missing payment intent")

    try:
        result = await confirm_payment(intent_id)
    except Exception as exc:
        apply_payment_result(db, order, status="failed", provider=order.payment_provider or "demo")
        raise HTTPException(status_code=402, detail=str(exc))

    order.payment_intent_id = result["payment_intent_id"]
    return apply_payment_result(
        db,
        order,
        status=result["status"] if result["status"] in {"succeeded", "processing"} else "succeeded",
        provider=result["provider"],
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


@router.post("/{order_id}/cancel", response_model=OrderSchema)
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel an unpaid/open order owned by the current user."""
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == "cancelled":
        return order

    if order.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Paid orders cannot be cancelled")

    if order.status in NON_CANCELLABLE_ORDER_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Orders with status '{order.status}' cannot be cancelled",
        )

    payment_status = (order.payment_status or "unpaid").lower()
    if payment_status not in CANCELLABLE_PAYMENT_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Orders with payment status '{payment_status}' cannot be cancelled",
        )

    if order.payment_intent_id:
        await cancel_payment_intent(order.payment_intent_id)

    order.status = "cancelled"
    order.payment_status = "cancelled"
    db.commit()
    db.refresh(order)
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

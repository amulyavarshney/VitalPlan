"""Shared order payment state transitions."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from models.order import Order


def find_order_by_payment_intent(db: Session, payment_intent_id: str) -> Optional[Order]:
    return db.query(Order).filter(Order.payment_intent_id == payment_intent_id).first()


def apply_payment_result(
    db: Session,
    order: Order,
    *,
    status: str,
    provider: str = "stripe",
) -> Order:
    """Idempotently update order payment fields from a confirmed payment status."""
    if status in {"succeeded", "processing"}:
        if order.payment_status != "paid":
            order.payment_status = "paid"
            order.payment_provider = provider
            order.paid_at = datetime.now(timezone.utc)
            if order.status in {None, "pending", "unpaid"}:
                order.status = "processing"
        db.commit()
        db.refresh(order)
        return order

    if status == "failed":
        if order.payment_status != "paid":
            order.payment_status = "failed"
            order.payment_provider = provider
            db.commit()
            db.refresh(order)
        return order

    return order

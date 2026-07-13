"""Stripe webhook endpoints (no JWT — signature verified)."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from config import settings
from services.database import get_db
from services.order_payment import apply_payment_result, find_order_by_payment_intent
from services.payment_service import (
    extract_payment_intent_update,
    parse_stripe_event,
    verify_stripe_signature,
    webhooks_enabled,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
    stripe_signature: str = Header(default="", alias="Stripe-Signature"),
):
    if not webhooks_enabled():
        raise HTTPException(
            status_code=503,
            detail="Stripe webhooks are not configured (set STRIPE_WEBHOOK_SECRET)",
        )

    payload = await request.body()
    if not verify_stripe_signature(payload, stripe_signature):
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    try:
        event = parse_stripe_event(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid payload: {exc}") from exc

    update = extract_payment_intent_update(event)
    if not update:
        return {"received": True, "handled": False, "type": event.get("type")}

    intent_id, status = update
    order = find_order_by_payment_intent(db, intent_id)
    if not order:
        logger.warning("Stripe webhook for unknown payment intent %s", intent_id)
        return {"received": True, "handled": False, "reason": "order_not_found"}

    apply_payment_result(db, order, status=status, provider="stripe")
    logger.info(
        "Stripe webhook applied event=%s intent=%s order=%s status=%s",
        event.get("type"),
        intent_id,
        order.id,
        order.payment_status,
    )
    return {
        "received": True,
        "handled": True,
        "order_id": order.id,
        "payment_status": order.payment_status,
        "environment": settings.ENVIRONMENT,
    }

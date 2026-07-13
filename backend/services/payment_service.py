"""Payment processing with Stripe (when configured) or demo mode."""
from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, Optional

import httpx

from config import settings

logger = logging.getLogger(__name__)


def payments_enabled() -> bool:
    return bool(settings.STRIPE_SECRET_KEY)


async def create_payment_intent(
    *,
    amount: float,
    currency: str = "usd",
    order_id: int,
    customer_email: str,
    metadata: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """Create a payment intent.

    Stripe mode: creates a real PaymentIntent.
    Demo mode: returns a local payment reference that can be confirmed immediately.
    """
    amount_cents = max(int(round(amount * 100)), 50)
    meta = {"order_id": str(order_id), "email": customer_email, **(metadata or {})}

    if not payments_enabled():
        payment_id = f"demo_pi_{uuid.uuid4().hex[:16]}"
        logger.info("Demo payment intent created for order %s: %s", order_id, payment_id)
        return {
            "provider": "demo",
            "payment_intent_id": payment_id,
            "client_secret": f"{payment_id}_secret_demo",
            "amount": amount,
            "currency": currency,
            "status": "requires_confirmation",
        }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            "https://api.stripe.com/v1/payment_intents",
            data={
                "amount": str(amount_cents),
                "currency": currency,
                "automatic_payment_methods[enabled]": "true",
                "receipt_email": customer_email,
                "metadata[order_id]": str(order_id),
                "metadata[email]": customer_email,
                **{f"metadata[{k}]": v for k, v in (metadata or {}).items()},
            },
            auth=(settings.STRIPE_SECRET_KEY, ""),
        )
        if response.status_code >= 400:
            logger.error("Stripe PaymentIntent failed: %s", response.text)
            raise RuntimeError("Unable to create Stripe payment")

        payload = response.json()
        return {
            "provider": "stripe",
            "payment_intent_id": payload["id"],
            "client_secret": payload["client_secret"],
            "amount": amount,
            "currency": currency,
            "status": payload.get("status", "requires_payment_method"),
            "publishable_key": settings.STRIPE_PUBLISHABLE_KEY,
        }


async def confirm_payment(payment_intent_id: str) -> Dict[str, Any]:
    """Verify a payment intent is complete.

    Demo intents always succeed.
    Stripe intents must already be confirmed client-side (Elements) or succeeded.
    """
    if payment_intent_id.startswith("demo_pi_"):
        return {
            "provider": "demo",
            "payment_intent_id": payment_intent_id,
            "status": "succeeded",
        }

    if not payments_enabled():
        raise RuntimeError("Stripe is not configured")

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"https://api.stripe.com/v1/payment_intents/{payment_intent_id}",
            auth=(settings.STRIPE_SECRET_KEY, ""),
        )
        if response.status_code >= 400:
            logger.error("Stripe retrieve failed: %s", response.text)
            raise RuntimeError("Unable to confirm Stripe payment")

        payload = response.json()
        status = payload.get("status")
        if status not in {"succeeded", "processing"}:
            raise RuntimeError(f"Payment not completed (status={status})")

        return {
            "provider": "stripe",
            "payment_intent_id": payment_intent_id,
            "status": status,
        }


def payment_public_config() -> Dict[str, Any]:
    return {
        "provider": "stripe" if payments_enabled() else "demo",
        "publishable_key": settings.STRIPE_PUBLISHABLE_KEY if payments_enabled() else None,
        "stripe_enabled": payments_enabled() and bool(settings.STRIPE_PUBLISHABLE_KEY),
    }

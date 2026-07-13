import hashlib
import hmac
import json
import time
from unittest.mock import patch

from config import settings


def _sign_payload(payload: bytes, secret: str, timestamp: int | None = None) -> str:
    ts = str(timestamp or int(time.time()))
    signed = f"{ts}.{payload.decode('utf-8')}".encode("utf-8")
    digest = hmac.new(secret.encode("utf-8"), signed, hashlib.sha256).hexdigest()
    return f"t={ts},v1={digest}"


def test_stripe_webhook_marks_order_paid(client, auth_headers, monkeypatch):
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_dummy")
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_test_secret")

    intent_id = "pi_test_webhook_123"
    with patch(
        "routers.orders.create_payment_intent",
        return_value={
            "provider": "stripe",
            "payment_intent_id": intent_id,
            "client_secret": f"{intent_id}_secret",
            "publishable_key": "pk_test",
            "status": "requires_payment_method",
            "amount": 19.99,
            "currency": "usd",
        },
    ):
        created = client.post(
            "/api/orders/",
            headers=auth_headers,
            json={
                "items": [
                    {
                        "id": "item-wh-2",
                        "name": "Omega-3",
                        "quantity": 1,
                        "price": 19.99,
                        "type": "supplement",
                    }
                ],
                "total": 19.99,
                "vendor": "amazon",
                "delivery_address": "1 Test Ave",
                "payment_method": "card",
            },
        )
    assert created.status_code == 200
    order_id = created.json()["order_id"]

    event = {
        "id": "evt_test_1",
        "type": "payment_intent.succeeded",
        "data": {"object": {"id": intent_id, "status": "succeeded"}},
    }
    payload = json.dumps(event).encode("utf-8")
    signature = _sign_payload(payload, "whsec_test_secret")

    response = client.post(
        "/api/webhooks/stripe",
        content=payload,
        headers={"Stripe-Signature": signature, "Content-Type": "application/json"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["handled"] is True
    assert body["order_id"] == order_id
    assert body["payment_status"] == "paid"

    # Idempotent second delivery
    response2 = client.post(
        "/api/webhooks/stripe",
        content=payload,
        headers={"Stripe-Signature": signature, "Content-Type": "application/json"},
    )
    assert response2.status_code == 200
    assert response2.json()["payment_status"] == "paid"

    fetched = client.get(f"/api/orders/{order_id}", headers=auth_headers)
    assert fetched.status_code == 200
    assert fetched.json()["payment_status"] == "paid"
    assert fetched.json()["status"] == "processing"


def test_stripe_webhook_rejects_bad_signature(client, monkeypatch):
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_dummy")
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_test_secret")

    payload = b'{"type":"payment_intent.succeeded","data":{"object":{"id":"pi_x"}}}'
    response = client.post(
        "/api/webhooks/stripe",
        content=payload,
        headers={"Stripe-Signature": "t=1,v1=deadbeef", "Content-Type": "application/json"},
    )
    assert response.status_code == 400


def test_stripe_webhook_unconfigured(client, monkeypatch):
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "")
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "")
    response = client.post(
        "/api/webhooks/stripe",
        content=b"{}",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 503

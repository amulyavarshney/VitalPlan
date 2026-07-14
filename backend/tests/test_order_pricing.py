from services.order_pricing import compute_order_totals


def test_order_total_must_include_delivery_and_tax(client, auth_headers):
    bad = client.post(
        "/api/orders/",
        headers=auth_headers,
        json={
            "items": [
                {
                    "id": "item-1",
                    "name": "Whey Protein",
                    "quantity": 1,
                    "price": 49.99,
                    "type": "supplement",
                }
            ],
            "total": 49.99,
            "vendor": "amazon",
            "delivery_address": "123 Main Street",
            "payment_method": "card",
        },
    )
    assert bad.status_code == 400
    assert "mismatch" in bad.json()["error"]["message"].lower() or "mismatch" in str(
        bad.json()["error"]["detail"]
    ).lower()

    pricing = compute_order_totals(
        items=[{"price": 49.99, "quantity": 1}],
        vendor="amazon",
    )
    good = client.post(
        "/api/orders/",
        headers=auth_headers,
        json={
            "items": [
                {
                    "id": "item-1",
                    "name": "Whey Protein",
                    "quantity": 1,
                    "price": 49.99,
                    "type": "supplement",
                }
            ],
            "total": pricing["total"],
            "vendor": "amazon",
            "delivery_address": "123 Main Street",
            "payment_method": "card",
        },
    )
    assert good.status_code == 200
    assert good.json()["payment"]["provider"] == "demo"


def test_compute_order_totals_local_vendor():
    pricing = compute_order_totals(
        items=[{"price": 10.0, "quantity": 2}],
        vendor="local",
    )
    assert pricing["subtotal"] == 20.0
    assert pricing["delivery_fee"] == 2.99
    assert pricing["tax"] == 1.6
    assert pricing["total"] == 24.59

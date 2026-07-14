def test_create_and_list_orders(client, auth_headers):
    create = client.post(
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
            "total": 59.98,
            "vendor": "amazon",
            "delivery_address": "123 Main Street",
            "payment_method": "card",
        },
    )
    assert create.status_code == 200
    body = create.json()
    assert body["order_id"] >= 1
    assert body["status"] == "pending"
    assert body["payment"]["provider"] == "demo"

    listed = client.get("/api/orders/", headers=auth_headers)
    assert listed.status_code == 200
    assert len(listed.json()) >= 1


def test_reject_invalid_order_payload(client, auth_headers):
    response = client.post(
        "/api/orders/",
        headers=auth_headers,
        json={
            "items": [],
            "total": 5.99,
            "vendor": "amazon",
            "delivery_address": "ab",
        },
    )
    assert response.status_code == 422


def test_cancel_unpaid_order(client, auth_headers):
    create = client.post(
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
            "total": 59.98,
            "vendor": "amazon",
            "delivery_address": "123 Main Street",
            "payment_method": "card",
        },
    )
    assert create.status_code == 200
    order_id = create.json()["order_id"]

    cancelled = client.post(f"/api/orders/{order_id}/cancel", headers=auth_headers)
    assert cancelled.status_code == 200
    body = cancelled.json()
    assert body["status"] == "cancelled"
    assert body["payment_status"] == "cancelled"

    again = client.post(f"/api/orders/{order_id}/cancel", headers=auth_headers)
    assert again.status_code == 200
    assert again.json()["status"] == "cancelled"


def test_cannot_cancel_paid_order(client, auth_headers):
    create = client.post(
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
            "total": 59.98,
            "vendor": "amazon",
            "delivery_address": "123 Main Street",
            "payment_method": "card",
        },
    )
    order_id = create.json()["order_id"]
    intent = create.json()["payment"]["payment_intent_id"]
    paid = client.post(
        f"/api/orders/{order_id}/pay",
        headers=auth_headers,
        json={"payment_intent_id": intent},
    )
    assert paid.status_code == 200
    assert paid.json()["payment_status"] == "paid"

    cancelled = client.post(f"/api/orders/{order_id}/cancel", headers=auth_headers)
    assert cancelled.status_code == 400

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
            "total": 49.99,
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
            "total": 10,
            "vendor": "amazon",
            "delivery_address": "ab",
        },
    )
    assert response.status_code == 422

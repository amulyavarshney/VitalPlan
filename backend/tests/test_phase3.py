def test_create_order_and_pay_demo(client, auth_headers):
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
    assert body["payment_status"] == "requires_action"
    assert body["payment"]["provider"] == "demo"

    paid = client.post(
        f"/api/orders/{body['order_id']}/pay",
        headers=auth_headers,
        json={"payment_intent_id": body["payment"]["payment_intent_id"]},
    )
    assert paid.status_code == 200
    assert paid.json()["payment_status"] == "paid"
    assert paid.json()["status"] == "processing"


def test_password_reset_flow(client):
    client.post(
        "/api/auth/register",
        json={"email": "resetme@example.com", "password": "secret12", "name": "Reset Me"},
    )

    requested = client.post(
        "/api/auth/password-reset/request",
        json={"email": "resetme@example.com"},
    )
    assert requested.status_code == 200
    token = requested.json().get("reset_token")
    assert token

    confirmed = client.post(
        "/api/auth/password-reset/confirm",
        json={"token": token, "new_password": "newsecret99"},
    )
    assert confirmed.status_code == 200

    old_login = client.post(
        "/api/auth/login",
        json={"email": "resetme@example.com", "password": "secret12"},
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/api/auth/login",
        json={"email": "resetme@example.com", "password": "newsecret99"},
    )
    assert new_login.status_code == 200

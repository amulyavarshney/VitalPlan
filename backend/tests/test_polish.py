from unittest.mock import patch


def test_payment_config_demo_mode(client, auth_headers):
    response = client.get("/api/orders/payments/config", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "demo"
    assert body["stripe_enabled"] is False
    assert body["publishable_key"] is None


def test_password_reset_includes_delivery_and_url(client):
    client.post(
        "/api/auth/register",
        json={"email": "polish-reset@example.com", "password": "secret12", "name": "Polish"},
    )

    with patch("routers.auth.send_password_reset_email") as mock_send:
        mock_send.return_value = {"delivered": False, "mode": "console"}
        requested = client.post(
            "/api/auth/password-reset/request",
            json={"email": "polish-reset@example.com"},
        )

    assert requested.status_code == 200
    body = requested.json()
    assert body["delivery"] == "console"
    assert body["reset_token"]
    assert "/reset-password?token=" in body["reset_url"]
    mock_send.assert_called_once()

from unittest.mock import patch

from config import settings


def test_email_verification_flow(client, monkeypatch):
    monkeypatch.setattr(settings, "EMAIL_VERIFICATION_REQUIRED", True)
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")

    with patch("routers.auth.send_verification_email") as mock_send:
        mock_send.return_value = {"delivered": False, "mode": "console"}
        registered = client.post(
            "/api/auth/register",
            json={"email": "verifyme@example.com", "password": "secret12", "name": "Verify Me"},
        )

    assert registered.status_code == 200
    body = registered.json()
    assert body["verification_required"] is True
    assert body["is_verified"] is False
    token = body["verification_token"]
    assert token
    assert "/verify-email?token=" in body["verification_url"]
    mock_send.assert_called_once()

    blocked = client.post(
        "/api/auth/login",
        json={"email": "verifyme@example.com", "password": "secret12"},
    )
    assert blocked.status_code == 403

    confirmed = client.post("/api/auth/verify-email", json={"token": token})
    assert confirmed.status_code == 200

    allowed = client.post(
        "/api/auth/login",
        json={"email": "verifyme@example.com", "password": "secret12"},
    )
    assert allowed.status_code == 200
    assert allowed.json()["access_token"]


def test_register_auto_verifies_when_not_required(client, monkeypatch):
    monkeypatch.setattr(settings, "EMAIL_VERIFICATION_REQUIRED", False)
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")

    registered = client.post(
        "/api/auth/register",
        json={"email": "autoverify@example.com", "password": "secret12", "name": "Auto"},
    )
    assert registered.status_code == 200
    assert registered.json()["verification_required"] is False
    assert registered.json()["is_verified"] is True

    login = client.post(
        "/api/auth/login",
        json={"email": "autoverify@example.com", "password": "secret12"},
    )
    assert login.status_code == 200

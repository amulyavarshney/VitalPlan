from models.user import User
from services.auth_service import create_token_pair, get_password_hash
from services.storage_service import public_upload_url, verify_upload_signature


def _admin_headers(db_session, email="ops-admin@example.com"):
    admin = User(
        email=email,
        hashed_password=get_password_hash("secret12"),
        name="Ops Admin",
        is_admin=True,
        is_verified=True,
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    tokens = create_token_pair(admin.email, extra={"admin": True})
    return {"Authorization": f"Bearer {tokens['access_token']}"}, admin


def test_metrics_endpoint(client):
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "vitalplan_http_requests_total" in response.text


def test_logout_revokes_refresh_token(client):
    client.post(
        "/api/auth/register",
        json={"email": "logout@example.com", "password": "secret12", "name": "Logout"},
    )
    login = client.post(
        "/api/auth/login",
        json={"email": "logout@example.com", "password": "secret12"},
    )
    assert login.status_code == 200
    refresh = login.json()["refresh_token"]
    access = login.json()["access_token"]

    logged_out = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {access}"},
        json={"refresh_token": refresh},
    )
    assert logged_out.status_code == 200

    again = client.post("/api/auth/refresh", json={"refresh_token": refresh})
    assert again.status_code == 401


def test_admin_audit_records_user_update(client, db_session):
    headers, _admin = _admin_headers(db_session)
    client.post(
        "/api/auth/register",
        json={"email": "audited@example.com", "password": "secret12", "name": "Audited"},
    )
    member = db_session.query(User).filter(User.email == "audited@example.com").first()
    assert member is not None

    patched = client.patch(
        f"/api/admin/users/{member.id}",
        headers=headers,
        json={"is_verified": True},
    )
    assert patched.status_code == 200

    audit = client.get("/api/admin/audit", headers=headers)
    assert audit.status_code == 200
    body = audit.json()
    assert body["total"] >= 1
    actions = {row["action"] for row in body["items"]}
    assert "user.update" in actions


def test_upload_requires_signature(client, tmp_path, monkeypatch):
    monkeypatch.setattr("services.storage_service.settings.UPLOAD_DIR", str(tmp_path))
    monkeypatch.setattr("services.storage_service.settings.S3_BUCKET", "")

    from services.storage_service import save_upload

    key = save_upload(b"fake-image", "image/jpeg", subdir="scans")
    denied = client.get(f"/api/uploads/{key}")
    assert denied.status_code == 401

    url = public_upload_url(key)
    assert url is not None
    allowed = client.get(url)
    assert allowed.status_code == 200

    # Signature helper sanity check
    from urllib.parse import parse_qs, urlparse

    parsed = urlparse(url)
    qs = parse_qs(parsed.query)
    assert verify_upload_signature(key, qs["exp"][0], qs["sig"][0])

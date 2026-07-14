from models.user import User
from services.auth_service import create_token_pair, get_password_hash


def _admin_headers(db_session, email="phase7-admin@example.com"):
    admin = User(
        email=email,
        hashed_password=get_password_hash("secret12"),
        name="Phase7 Admin",
        is_admin=True,
        is_verified=True,
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    tokens = create_token_pair(admin.email, extra={"admin": True})
    return {"Authorization": f"Bearer {tokens['access_token']}"}, admin


def test_admin_can_list_and_deactivate_user(client, db_session):
    headers, admin = _admin_headers(db_session)

    client.post(
        "/api/auth/register",
        json={"email": "member@example.com", "password": "secret12", "name": "Member"},
    )
    member = db_session.query(User).filter(User.email == "member@example.com").first()
    assert member is not None

    listed = client.get("/api/admin/users", headers=headers)
    assert listed.status_code == 200
    emails = {u["email"] for u in listed.json()}
    assert "member@example.com" in emails
    assert admin.email in emails

    updated = client.patch(
        f"/api/admin/users/{member.id}",
        headers=headers,
        json={"is_active": False},
    )
    assert updated.status_code == 200
    assert updated.json()["is_active"] is False

    login = client.post(
        "/api/auth/login",
        json={"email": "member@example.com", "password": "secret12"},
    )
    assert login.status_code == 403


def test_admin_cannot_deactivate_self(client, db_session):
    headers, admin = _admin_headers(db_session, email="self-admin@example.com")
    response = client.patch(
        f"/api/admin/users/{admin.id}",
        headers=headers,
        json={"is_active": False},
    )
    assert response.status_code == 400


def test_non_admin_cannot_access_admin_users(client, auth_headers):
    response = client.get("/api/admin/users", headers=auth_headers)
    assert response.status_code == 403

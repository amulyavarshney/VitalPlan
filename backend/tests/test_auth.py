def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"


def test_register_login_and_me(client):
    register = client.post(
        "/api/auth/register",
        json={
            "email": "alice@example.com",
            "password": "secret12",
            "name": "Alice",
        },
    )
    assert register.status_code == 200
    assert register.json()["email"] == "alice@example.com"

    login = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "secret12"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    me = client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["name"] == "Alice"


def test_reject_short_password(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "short@example.com", "password": "123", "name": "Short"},
    )
    assert response.status_code == 422


def test_inactive_user_cannot_use_token(client, db_session):
    register = client.post(
        "/api/auth/register",
        json={"email": "inactive@example.com", "password": "secret12", "name": "Inactive"},
    )
    assert register.status_code == 200

    login = client.post(
        "/api/auth/login",
        json={"email": "inactive@example.com", "password": "secret12"},
    )
    token = login.json()["access_token"]

    from models.user import User

    user = db_session.query(User).filter(User.email == "inactive@example.com").first()
    user.is_active = False
    db_session.commit()

    me = client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 403


def test_admin_registration_locked_after_first(client):
    first = client.post(
        "/api/admin/register",
        json={"email": "admin1@example.com", "password": "secret12", "name": "Admin One"},
    )
    assert first.status_code == 200

    second = client.post(
        "/api/admin/register",
        json={"email": "admin2@example.com", "password": "secret12", "name": "Admin Two"},
    )
    assert second.status_code == 403

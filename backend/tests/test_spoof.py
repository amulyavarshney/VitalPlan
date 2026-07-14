from models.user import User
from services.auth_service import create_token_pair, get_password_hash


def test_admin_spoof_and_act_as_user(client, db_session):
    admin = User(
        email="spoof-admin@example.com",
        hashed_password=get_password_hash("secret12"),
        name="Spoof Admin",
        is_admin=True,
        is_verified=True,
        is_active=True,
    )
    member = User(
        email="spoof-target@example.com",
        hashed_password=get_password_hash("secret12"),
        name="Target",
        is_admin=False,
        is_verified=True,
        is_active=True,
    )
    db_session.add_all([admin, member])
    db_session.commit()

    admin_tokens = create_token_pair(admin.email, extra={"admin": True})
    headers = {"Authorization": f"Bearer {admin_tokens['access_token']}"}

    spoofed = client.post(
        "/api/admin/spoof",
        headers=headers,
        json={"user_email": "spoof-target@example.com"},
    )
    assert spoofed.status_code == 200
    target_token = spoofed.json()["access_token"]

    me = client.get("/api/users/me", headers={"Authorization": f"Bearer {target_token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "spoof-target@example.com"
    assert me.json()["is_admin"] is False

from models.user import User


def test_hard_delete_requires_password(client, auth_headers):
    response = client.request(
        "DELETE",
        "/api/users/me",
        headers=auth_headers,
        json={"password": "wrong-password"},
    )
    assert response.status_code == 401


def test_hard_delete_erases_user(client, auth_headers, db_session):
    me = client.get("/api/users/me", headers=auth_headers)
    assert me.status_code == 200
    user_id = me.json()["id"]

    client.post(
        "/api/goals/",
        headers=auth_headers,
        json={
            "type": "muscle-building",
            "title": "Build muscle",
            "description": "Gain lean mass",
            "priority": "high",
        },
    )

    deleted = client.request(
        "DELETE",
        "/api/users/me",
        headers=auth_headers,
        json={"password": "secret12"},
    )
    assert deleted.status_code == 200
    assert "permanently" in deleted.json()["message"].lower()

    assert db_session.query(User).filter(User.id == user_id).first() is None

    after = client.get("/api/users/me", headers=auth_headers)
    assert after.status_code == 401


def test_api_sets_csp_header(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    csp = response.headers.get("content-security-policy", "")
    assert "default-src 'none'" in csp
    assert "frame-ancestors 'none'" in csp

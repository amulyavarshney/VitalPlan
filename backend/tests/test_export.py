def test_export_user_data(client, auth_headers):
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

    response = client.get("/api/users/me/export", headers=auth_headers)
    assert response.status_code == 200
    assert "attachment" in response.headers.get("content-disposition", "")
    body = response.json()
    assert body["format_version"] == 1
    assert body["user"]["email"] == "user@example.com"
    assert len(body["goals"]) >= 1
    assert "diet_plans" in body
    assert "orders" in body
    assert "scanned_foods" in body


def test_request_id_header(client):
    response = client.get("/api/health", headers={"X-Request-ID": "test-req-123"})
    assert response.status_code == 200
    assert response.headers.get("x-request-id") == "test-req-123"

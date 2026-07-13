def test_generate_diet_plan_demo_mode(client, auth_headers):
    response = client.post(
        "/api/diet-plans/generate",
        headers=auth_headers,
        json={
            "goals": [
                {
                    "type": "muscle-building",
                    "title": "Building Muscle",
                    "description": "Gain lean mass",
                    "priority": "high",
                }
            ]
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total_calories"] == 2000
    assert isinstance(body["meals"], list)
    assert len(body["meals"]) >= 1

    listed = client.get("/api/diet-plans/", headers=auth_headers)
    assert listed.status_code == 200
    assert len(listed.json()) >= 1

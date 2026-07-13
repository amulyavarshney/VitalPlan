from tests.helpers import make_test_image_bytes


def test_analyze_food_image_demo_mode(client, auth_headers):
    image_bytes = make_test_image_bytes()
    response = client.post(
        "/api/scanner/analyze-image",
        headers=auth_headers,
        files={"file": ("food.jpg", image_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    body = response.json()
    assert "food_name" in body
    assert "calories" in body
    assert "macros" in body

    history = client.get("/api/scanner/history", headers=auth_headers)
    assert history.status_code == 200
    assert len(history.json()) >= 1

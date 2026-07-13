from unittest.mock import AsyncMock, patch


def test_refresh_token_flow(client):
    register = client.post(
        "/api/auth/register",
        json={"email": "refresh@example.com", "password": "secret12", "name": "Refresh"},
    )
    assert register.status_code == 200

    login = client.post(
        "/api/auth/login",
        json={"email": "refresh@example.com", "password": "secret12"},
    )
    assert login.status_code == 200
    body = login.json()
    assert "refresh_token" in body

    refreshed = client.post(
        "/api/auth/refresh",
        json={"refresh_token": body["refresh_token"]},
    )
    assert refreshed.status_code == 200
    assert "access_token" in refreshed.json()
    assert "refresh_token" in refreshed.json()


@patch("routers.scanner.lookup_barcode", new_callable=AsyncMock)
def test_barcode_lookup_persists_scan(mock_lookup, client, auth_headers):
    mock_lookup.return_value = {
        "food_name": "Nutella",
        "brand": "Ferrero",
        "barcode": "3017620422003",
        "confidence": 0.95,
        "serving_size": "15g",
        "calories": 80,
        "macros": {"protein": 1.0, "carbs": 8.0, "fat": 5.0},
        "nutrition_details": {
            "vitamins": {},
            "minerals": {},
            "fiber": 0.5,
            "sugar": 8.0,
            "sodium": 10.0,
            "cholesterol": 0,
            "saturated_fat": 1.5,
            "trans_fat": 0,
        },
        "ai_insights": ["High sugar spread"],
        "analyzed_at": "2026-07-13T12:00:00+00:00",
        "image_processed": False,
        "image_url": None,
    }

    response = client.post("/api/scanner/barcode/3017620422003", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["food_name"] == "Nutella"

    history = client.get("/api/scanner/history", headers=auth_headers)
    assert history.status_code == 200
    assert any(item["name"] == "Nutella" for item in history.json())


def test_marketplace_seed_and_admin_create(client, auth_headers, db_session):
    listed = client.get("/api/marketplace/items", headers=auth_headers)
    assert listed.status_code == 200
    assert listed.json()["total"] >= 1

    from models.user import User
    from services.auth_service import create_token_pair

    admin = User(
        email="market-admin@example.com",
        hashed_password="x",
        name="Admin",
        is_admin=True,
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()

    tokens = create_token_pair(admin.email, extra={"admin": True})
    admin_headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    created = client.post(
        "/api/marketplace/admin/items",
        headers=admin_headers,
        json={
            "sku": "market-test-99",
            "name": "Test Supplement",
            "description": "A test product for marketplace CRUD",
            "price": 19.99,
            "category": "supplements",
            "brand": "VitalPlan",
            "rating": 4.5,
            "reviews": 10,
            "image_url": "https://example.com/item.jpg",
            "in_stock": True,
            "features": ["Tested"],
        },
    )
    assert created.status_code == 200
    assert created.json()["sku"] == "market-test-99"

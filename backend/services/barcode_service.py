"""Open Food Facts barcode nutrition lookup."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx

from config import settings

logger = logging.getLogger(__name__)

OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/api/v2/product/{barcode}.json"


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _nutrient(nutriments: Dict[str, Any], *keys: str, default: float = 0.0) -> float:
    for key in keys:
        if key in nutriments and nutriments[key] is not None:
            return _to_float(nutriments[key], default)
    return default


def map_off_product(barcode: str, product: Dict[str, Any]) -> Dict[str, Any]:
    nutriments = product.get("nutriments") or {}
    name = (
        product.get("product_name")
        or product.get("generic_name")
        or product.get("product_name_en")
        or "Unknown product"
    )
    brand = product.get("brands") or product.get("brand_owner") or "Unknown"
    serving = product.get("serving_size") or "100g"
    image_url = (
        product.get("image_front_small_url")
        or product.get("image_front_url")
        or product.get("image_url")
    )

    calories = int(
        round(
            _nutrient(
                nutriments,
                "energy-kcal_serving",
                "energy-kcal_100g",
                "energy-kcal",
                default=0,
            )
        )
    )
    protein = _nutrient(nutriments, "proteins_serving", "proteins_100g", "proteins")
    carbs = _nutrient(nutriments, "carbohydrates_serving", "carbohydrates_100g", "carbohydrates")
    fat = _nutrient(nutriments, "fat_serving", "fat_100g", "fat")
    fiber = _nutrient(nutriments, "fiber_serving", "fiber_100g", "fiber")
    sugar = _nutrient(nutriments, "sugars_serving", "sugars_100g", "sugars")
    sodium_mg = _nutrient(nutriments, "sodium_serving", "sodium_100g", "sodium") * 1000
    if sodium_mg == 0:
        sodium_mg = _nutrient(nutriments, "salt_serving", "salt_100g", "salt") * 400
    saturated_fat = _nutrient(
        nutriments, "saturated-fat_serving", "saturated-fat_100g", "saturated-fat"
    )

    insights = []
    categories = (product.get("categories") or "").split(",")
    if categories and categories[0].strip():
        insights.append(f"Category: {categories[0].strip()}")
    if fiber >= 5:
        insights.append("Good source of dietary fiber")
    if protein >= 10:
        insights.append("Provides meaningful protein per serving")
    if sodium_mg >= 400:
        insights.append("Higher sodium — consider moderating intake")
    if sugar >= 15:
        insights.append("Higher sugar content")
    if not insights:
        insights.append("Nutrition data from Open Food Facts")

    return {
        "food_name": name.strip(),
        "brand": brand.strip() if isinstance(brand, str) else "Unknown",
        "barcode": barcode,
        "confidence": 0.92,
        "serving_size": serving,
        "calories": calories,
        "macros": {
            "protein": round(protein, 1),
            "carbs": round(carbs, 1),
            "fat": round(fat, 1),
        },
        "nutrition_details": {
            "vitamins": {},
            "minerals": {},
            "fiber": round(fiber, 1),
            "sugar": round(sugar, 1),
            "sodium": round(sodium_mg, 1),
            "cholesterol": _nutrient(nutriments, "cholesterol_100g", "cholesterol"),
            "saturated_fat": round(saturated_fat, 1),
            "trans_fat": _nutrient(nutriments, "trans-fat_100g", "trans-fat"),
        },
        "ai_insights": insights[:4],
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
        "image_processed": False,
        "image_url": image_url,
        "source": "openfoodfacts",
    }


async def lookup_barcode(barcode: str) -> Optional[Dict[str, Any]]:
    """Fetch product nutrition by barcode from Open Food Facts."""
    cleaned = "".join(ch for ch in barcode.strip() if ch.isalnum())
    if len(cleaned) < 8:
        return None

    url = OPEN_FOOD_FACTS_URL.format(barcode=cleaned)
    headers = {
        "User-Agent": settings.OPEN_FOOD_FACTS_USER_AGENT,
        "Accept": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 404:
                return None
            response.raise_for_status()
            payload = response.json()
    except Exception as exc:
        logger.error("Open Food Facts lookup failed for %s: %s", cleaned, exc)
        raise

    if payload.get("status") != 1 or not payload.get("product"):
        return None

    return map_off_product(cleaned, payload["product"])

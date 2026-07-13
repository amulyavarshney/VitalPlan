from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from services.database import get_db
from services.auth_service import get_current_user
from models.user import User

router = APIRouter()

# Mock marketplace data (Phase 0 — will move to DB in Phase 2)
MOCK_MARKETPLACE_ITEMS = [
    {
        "id": "market-1",
        "name": "Premium Whey Protein Isolate",
        "description": "Ultra-pure whey protein isolate with 25g protein per serving. Perfect for muscle building and recovery.",
        "price": 49.99,
        "original_price": 59.99,
        "category": "protein",
        "brand": "Optimum Nutrition",
        "rating": 4.8,
        "reviews": 3247,
        "image_url": "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=400",
        "in_stock": True,
        "features": ["25g Protein", "Low Carb", "Fast Absorption", "Gluten Free", "Third-Party Tested"],
    },
    {
        "id": "market-2",
        "name": "Organic Spirulina Powder",
        "description": "Premium organic spirulina powder packed with nutrients, antioxidants, and complete proteins.",
        "price": 24.99,
        "category": "superfoods",
        "brand": "Nutrex Hawaii",
        "rating": 4.6,
        "reviews": 1892,
        "image_url": "https://images.pexels.com/photos/4162451/pexels-photo-4162451.jpeg?auto=compress&cs=tinysrgb&w=400",
        "in_stock": True,
        "features": ["Organic Certified", "Complete Protein", "Rich in Iron", "Antioxidant Power", "Vegan Friendly"],
    },
    {
        "id": "market-3",
        "name": "Advanced Multivitamin Complex",
        "description": "Comprehensive multivitamin with 25+ essential vitamins and minerals for optimal health.",
        "price": 34.99,
        "original_price": 44.99,
        "category": "vitamins",
        "brand": "Garden of Life",
        "rating": 4.7,
        "reviews": 2156,
        "image_url": "https://images.pexels.com/photos/4162452/pexels-photo-4162452.jpeg?auto=compress&cs=tinysrgb&w=400",
        "in_stock": True,
        "features": ["25+ Nutrients", "Whole Food Based", "Easy Absorption", "Non-GMO", "Vegetarian"],
    },
    {
        "id": "market-4",
        "name": "Organic Quinoa Grain",
        "description": "Premium organic quinoa - a complete protein superfood perfect for healthy meals.",
        "price": 12.99,
        "category": "organic-foods",
        "brand": "Ancient Harvest",
        "rating": 4.5,
        "reviews": 987,
        "image_url": "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400",
        "in_stock": True,
        "features": ["Complete Protein", "Gluten Free", "High Fiber", "Organic Certified", "Versatile"],
    },
    {
        "id": "market-5",
        "name": "Collagen Beauty Blend",
        "description": "Marine collagen peptides with hyaluronic acid and vitamin C for skin, hair, and nail health.",
        "price": 39.99,
        "category": "supplements",
        "brand": "Vital Proteins",
        "rating": 4.9,
        "reviews": 4521,
        "image_url": "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=400",
        "in_stock": True,
        "features": ["Marine Collagen", "Hyaluronic Acid", "Vitamin C", "Beauty Support", "Unflavored"],
    },
    {
        "id": "market-6",
        "name": "Organic Chia Seeds",
        "description": "Premium organic chia seeds rich in omega-3s, fiber, and plant-based protein.",
        "price": 9.99,
        "category": "superfoods",
        "brand": "Navitas Organics",
        "rating": 4.4,
        "reviews": 1203,
        "image_url": "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400",
        "in_stock": True,
        "features": ["Omega-3 Rich", "High Fiber", "Plant Protein", "Organic", "Gluten Free"],
    },
]

@router.get("/items")
async def get_marketplace_items(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("featured"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user)
):
    """Get marketplace items with filtering and pagination"""
    items = MOCK_MARKETPLACE_ITEMS.copy()
    
    # Filter by category
    if category and category != "all":
        items = [item for item in items if item["category"] == category]
    
    # Filter by search term
    if search:
        search_lower = search.lower()
        items = [
            item for item in items
            if search_lower in item["name"].lower() or
               search_lower in item["description"].lower() or
               search_lower in item["brand"].lower()
        ]
    
    # Sort items
    if sort_by == "price-low":
        items.sort(key=lambda x: x["price"])
    elif sort_by == "price-high":
        items.sort(key=lambda x: x["price"], reverse=True)
    elif sort_by == "rating":
        items.sort(key=lambda x: x["rating"], reverse=True)
    elif sort_by == "reviews":
        items.sort(key=lambda x: x["reviews"], reverse=True)
    
    # Pagination
    total = len(items)
    items = items[offset:offset + limit]
    
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset
    }

@router.get("/categories")
async def get_categories(current_user: User = Depends(get_current_user)):
    """Get available product categories"""
    categories = [
        {"id": "all", "name": "All Products", "count": len(MOCK_MARKETPLACE_ITEMS)},
        {"id": "supplements", "name": "Supplements", "count": 0},
        {"id": "protein", "name": "Protein", "count": 0},
        {"id": "vitamins", "name": "Vitamins", "count": 0},
        {"id": "superfoods", "name": "Superfoods", "count": 0},
        {"id": "organic-foods", "name": "Organic Foods", "count": 0}
    ]
    
    # Count items in each category
    for category in categories:
        if category["id"] != "all":
            category["count"] = len([
                item for item in MOCK_MARKETPLACE_ITEMS
                if item["category"] == category["id"]
            ])
    
    return categories

@router.get("/items/{item_id}")
async def get_marketplace_item(
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific marketplace item"""
    item = next((item for item in MOCK_MARKETPLACE_ITEMS if item["id"] == item_id), None)
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return item

@router.get("/recommendations")
async def get_recommendations(
    current_user: User = Depends(get_current_user),
    limit: int = Query(6, le=20)
):
    """Get personalized product recommendations"""
    recommendations = sorted(
        MOCK_MARKETPLACE_ITEMS,
        key=lambda x: x["rating"],
        reverse=True
    )[:limit]
    
    return {
        "recommendations": recommendations,
        "reason": "Based on your health goals and preferences"
    }

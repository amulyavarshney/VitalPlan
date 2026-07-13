from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from services.database import get_db
from services.auth_service import get_current_user, get_current_admin_user
from models.user import User
from models.marketplace_item import MarketplaceItem
from schemas.marketplace import (
    MarketplaceItem as MarketplaceItemSchema,
    MarketplaceItemCreate,
    MarketplaceItemUpdate,
)

router = APIRouter()

SEED_ITEMS = [
    {
        "sku": "market-1",
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
        "sku": "market-2",
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
        "sku": "market-3",
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
        "sku": "market-4",
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
        "sku": "market-5",
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
        "sku": "market-6",
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


def seed_marketplace_if_empty(db: Session) -> None:
    if db.query(MarketplaceItem).count() > 0:
        return
    for item in SEED_ITEMS:
        db.add(MarketplaceItem(**item))
    db.commit()


def serialize_item(item: MarketplaceItem) -> dict:
    return {
        "id": item.sku,
        "sku": item.sku,
        "name": item.name,
        "description": item.description,
        "price": item.price,
        "original_price": item.original_price,
        "category": item.category,
        "brand": item.brand,
        "rating": item.rating,
        "reviews": item.reviews,
        "image_url": item.image_url,
        "in_stock": item.in_stock,
        "features": item.features or [],
        "is_active": item.is_active,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


@router.get("/items")
async def get_marketplace_items(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("featured"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get marketplace items with filtering and pagination"""
    seed_marketplace_if_empty(db)

    query = db.query(MarketplaceItem).filter(MarketplaceItem.is_active == True)  # noqa: E712

    if category and category != "all":
        query = query.filter(MarketplaceItem.category == category)

    if search:
        like = f"%{search}%"
        query = query.filter(
            (MarketplaceItem.name.ilike(like))
            | (MarketplaceItem.description.ilike(like))
            | (MarketplaceItem.brand.ilike(like))
        )

    if sort_by == "price-low":
        query = query.order_by(MarketplaceItem.price.asc())
    elif sort_by == "price-high":
        query = query.order_by(MarketplaceItem.price.desc())
    elif sort_by == "rating":
        query = query.order_by(MarketplaceItem.rating.desc())
    elif sort_by == "reviews":
        query = query.order_by(MarketplaceItem.reviews.desc())
    else:
        query = query.order_by(MarketplaceItem.id.asc())

    total = query.count()
    items = query.offset(offset).limit(limit).all()

    return {
        "items": [serialize_item(item) for item in items],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/categories")
async def get_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get available product categories"""
    seed_marketplace_if_empty(db)
    items = db.query(MarketplaceItem).filter(MarketplaceItem.is_active == True).all()  # noqa: E712
    categories = [
        {"id": "all", "name": "All Products", "count": len(items)},
        {"id": "supplements", "name": "Supplements", "count": 0},
        {"id": "protein", "name": "Protein", "count": 0},
        {"id": "vitamins", "name": "Vitamins", "count": 0},
        {"id": "superfoods", "name": "Superfoods", "count": 0},
        {"id": "organic-foods", "name": "Organic Foods", "count": 0},
    ]
    for category in categories:
        if category["id"] != "all":
            category["count"] = len([i for i in items if i.category == category["id"]])
    return categories


@router.get("/items/{item_id}")
async def get_marketplace_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific marketplace item by sku or numeric id"""
    seed_marketplace_if_empty(db)
    item = db.query(MarketplaceItem).filter(MarketplaceItem.sku == item_id).first()
    if not item and item_id.isdigit():
        item = db.query(MarketplaceItem).filter(MarketplaceItem.id == int(item_id)).first()
    if not item or not item.is_active:
        raise HTTPException(status_code=404, detail="Item not found")
    return serialize_item(item)


@router.get("/recommendations")
async def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(6, le=20),
):
    """Get top-rated product recommendations"""
    seed_marketplace_if_empty(db)
    items = (
        db.query(MarketplaceItem)
        .filter(MarketplaceItem.is_active == True)  # noqa: E712
        .order_by(MarketplaceItem.rating.desc())
        .limit(limit)
        .all()
    )
    return {
        "recommendations": [serialize_item(item) for item in items],
        "reason": "Based on your health goals and preferences",
    }


@router.post("/admin/items", response_model=MarketplaceItemSchema)
async def create_marketplace_item(
    payload: MarketplaceItemCreate,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    existing = db.query(MarketplaceItem).filter(MarketplaceItem.sku == payload.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")

    item = MarketplaceItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/admin/items/{item_id}", response_model=MarketplaceItemSchema)
async def update_marketplace_item(
    item_id: int,
    payload: MarketplaceItemUpdate,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/admin/items/{item_id}")
async def delete_marketplace_item(
    item_id: int,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    item = db.query(MarketplaceItem).filter(MarketplaceItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.is_active = False
    db.commit()
    return {"message": "Item deactivated"}


@router.get("/admin/items", response_model=List[MarketplaceItemSchema])
async def list_admin_marketplace_items(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    seed_marketplace_if_empty(db)
    return db.query(MarketplaceItem).order_by(MarketplaceItem.id.desc()).all()

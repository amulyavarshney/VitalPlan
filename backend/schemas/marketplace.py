from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class MarketplaceItemBase(BaseModel):
    sku: str = Field(min_length=2, max_length=64)
    name: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=2)
    price: float = Field(gt=0)
    original_price: Optional[float] = Field(default=None, gt=0)
    category: str
    brand: str
    rating: float = Field(default=0, ge=0, le=5)
    reviews: int = Field(default=0, ge=0)
    image_url: Optional[str] = None
    in_stock: bool = True
    features: List[str] = []


class MarketplaceItemCreate(MarketplaceItemBase):
    pass


class MarketplaceItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    original_price: Optional[float] = Field(default=None, gt=0)
    category: Optional[str] = None
    brand: Optional[str] = None
    rating: Optional[float] = Field(default=None, ge=0, le=5)
    reviews: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str] = None
    in_stock: Optional[bool] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None


class MarketplaceItem(MarketplaceItemBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

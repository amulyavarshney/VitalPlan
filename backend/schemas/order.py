from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal
from datetime import datetime


class OrderItemSchema(BaseModel):
    id: str
    name: str
    quantity: int = Field(ge=1)
    price: float = Field(ge=0)
    type: Literal["supplement", "grocery"]


class OrderCreate(BaseModel):
    items: List[OrderItemSchema] = Field(min_length=1)
    total: float = Field(ge=0)
    vendor: Literal["amazon", "walmart", "local"] = "local"
    delivery_address: str = Field(min_length=3, max_length=500)
    payment_method: str = Field(default="card", min_length=1, max_length=50)

    @field_validator("delivery_address")
    @classmethod
    def strip_address(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise ValueError("delivery_address is too short")
        return cleaned


class OrderStatusUpdate(BaseModel):
    status: Literal["pending", "processing", "shipped", "delivered"]


class OrderPayRequest(BaseModel):
    payment_intent_id: Optional[str] = None


class PaymentInfo(BaseModel):
    provider: str
    payment_intent_id: str
    client_secret: Optional[str] = None
    publishable_key: Optional[str] = None
    status: str


class Order(BaseModel):
    id: int
    user_id: int
    items: List[OrderItemSchema]
    total: float
    status: str
    vendor: str
    delivery_address: Optional[str] = None
    payment_method: Optional[str] = None
    payment_status: Optional[str] = "unpaid"
    payment_intent_id: Optional[str] = None
    payment_provider: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderCreateResponse(BaseModel):
    message: str
    order_id: int
    status: str
    payment_status: str
    payment: PaymentInfo


class OrderListResponse(BaseModel):
    items: List[Order]
    total: int
    limit: int = Field(ge=1)
    offset: int = Field(ge=0)

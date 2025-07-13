from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class FoodAnalysisResult(BaseModel):
    food_name: str
    confidence: float
    serving_size: str
    calories: int
    macros: Dict[str, float]
    nutrition_details: Dict[str, Any]
    ai_insights: List[str]
    analyzed_at: datetime
    image_processed: bool

class ScannedFoodBase(BaseModel):
    name: str
    brand: Optional[str] = None
    barcode: Optional[str] = None
    calories: int
    serving_size: str
    macros: Dict[str, float]
    nutrition_details: Dict[str, Any]
    ai_insights: Optional[List[str]] = None
    confidence: Optional[float] = None
    image_url: Optional[str] = None

class ScannedFoodCreate(ScannedFoodBase):
    image_data: Optional[str] = None

class ScannedFood(ScannedFoodBase):
    id: int
    user_id: int
    analyzed_at: datetime
    
    class Config:
        from_attributes = True
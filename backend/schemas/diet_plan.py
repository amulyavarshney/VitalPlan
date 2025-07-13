from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class DietPlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    total_calories: Optional[int] = None
    macros: Optional[Dict[str, Any]] = None
    meals: Optional[List[Dict[str, Any]]] = None
    supplements: Optional[List[Dict[str, Any]]] = None
    ai_recommendations: Optional[List[str]] = None
    goals: Optional[List[Dict[str, Any]]] = None

class DietPlanCreate(DietPlanBase):
    pass

class DietPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    total_calories: Optional[int] = None
    macros: Optional[Dict[str, Any]] = None
    meals: Optional[List[Dict[str, Any]]] = None
    supplements: Optional[List[Dict[str, Any]]] = None
    ai_recommendations: Optional[List[str]] = None
    goals: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None

class DietPlan(DietPlanBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class DietPlanGenerate(BaseModel):
    goals: List[Dict[str, Any]]
    preferences: Optional[Dict[str, Any]] = None
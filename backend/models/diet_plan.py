from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from services.database import Base

class DietPlan(Base):
    __tablename__ = "diet_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    total_calories = Column(Integer)
    macros = Column(JSON)  # {"protein": 150, "carbs": 200, "fat": 67}
    meals = Column(JSON)  # Array of meal objects
    supplements = Column(JSON)  # Array of supplement objects
    ai_recommendations = Column(JSON)  # Array of AI-generated recommendations
    goals = Column(JSON)  # Associated goals
    is_active = Column(String, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="diet_plans")
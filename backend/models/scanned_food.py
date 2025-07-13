from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from services.database import Base

class ScannedFood(Base):
    __tablename__ = "scanned_foods"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    brand = Column(String)
    barcode = Column(String)
    calories = Column(Integer)
    serving_size = Column(String)
    macros = Column(JSON)  # {"protein": 6, "carbs": 6, "fat": 15}
    nutrition_details = Column(JSON)  # Detailed nutrition information
    ai_insights = Column(JSON)  # AI-generated insights
    confidence = Column(Float)  # AI confidence score
    image_url = Column(String)
    image_data = Column(Text)  # Base64 encoded image
    analyzed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="scanned_foods")
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import logging

from services.database import get_db
from services.auth_service import get_current_user
from services.ai_service import ai_service
from models.user import User
from models.scanned_food import ScannedFood
from schemas.scanner import FoodAnalysisResult, ScannedFood as ScannedFoodSchema, ScannedFoodCreate

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/analyze-image", response_model=FoodAnalysisResult)
async def analyze_food_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze food image using AI"""
    try:
        # Validate file type
        if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload a JPEG, PNG, or WebP image."
            )
        
        # Read image data
        image_data = await file.read()
        
        # Validate file size (10MB limit)
        if len(image_data) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File too large. Please upload an image smaller than 10MB."
            )
        
        # Analyze image with AI
        analysis_result = await ai_service.analyze_food_image(image_data)
        
        # Save to database
        scanned_food = ScannedFood(
            user_id=current_user.id,
            name=analysis_result["food_name"],
            brand=analysis_result.get("brand", "Unknown"),
            barcode=analysis_result.get("barcode", ""),
            calories=analysis_result["calories"],
            serving_size=analysis_result["serving_size"],
            macros=analysis_result["macros"],
            nutrition_details=analysis_result["nutrition_details"],
            ai_insights=analysis_result["ai_insights"],
            confidence=analysis_result["confidence"],
            image_data=None  # Don't store large image data
        )
        
        db.add(scanned_food)
        db.commit()
        db.refresh(scanned_food)
        
        return FoodAnalysisResult(**analysis_result)
        
    except Exception as e:
        logger.error(f"Error analyzing food image: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze image. Please try again."
        )

@router.get("/history", response_model=List[ScannedFoodSchema])
async def get_scan_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Get user's food scan history"""
    scanned_foods = db.query(ScannedFood)\
        .filter(ScannedFood.user_id == current_user.id)\
        .order_by(ScannedFood.analyzed_at.desc())\
        .limit(limit)\
        .all()
    
    return scanned_foods

@router.delete("/history/{scan_id}")
async def delete_scan(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a scanned food item"""
    scanned_food = db.query(ScannedFood)\
        .filter(ScannedFood.id == scan_id, ScannedFood.user_id == current_user.id)\
        .first()
    
    if not scanned_food:
        raise HTTPException(status_code=404, detail="Scanned food not found")
    
    db.delete(scanned_food)
    db.commit()
    
    return {"message": "Scanned food deleted successfully"}

@router.post("/barcode/{barcode}", response_model=FoodAnalysisResult)
async def scan_barcode(
    barcode: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze food by barcode"""
    try:
        # In a real implementation, this would query a nutrition database
        # For now, return mock data
        mock_result = {
            "food_name": "Scanned Product",
            "confidence": 0.9,
            "serving_size": "1 serving",
            "calories": 150,
            "macros": {"protein": 5, "carbs": 20, "fat": 6},
            "nutrition_details": {
                "vitamins": {"Vitamin C": "10% DV"},
                "minerals": {"Iron": "5% DV"},
                "fiber": 3,
                "sugar": 8,
                "sodium": 200,
                "cholesterol": 0,
                "saturated_fat": 2,
                "trans_fat": 0
            },
            "ai_insights": [
                "Moderate calorie content",
                "Good source of carbohydrates",
                "Watch sodium intake"
            ],
            "analyzed_at": "2024-01-01T00:00:00",
            "image_processed": False
        }
        
        return FoodAnalysisResult(**mock_result)
        
    except Exception as e:
        logger.error(f"Error scanning barcode: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to scan barcode. Please try again."
        )
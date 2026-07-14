from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
import logging

from services.database import get_db
from services.auth_service import get_current_user
from services.ai_service import ai_service
from services.barcode_service import lookup_barcode
from services.storage_service import save_upload, public_upload_url
from services.rate_limit import ai_rate_limiter, client_key
from models.user import User
from models.scanned_food import ScannedFood
from schemas.scanner import FoodAnalysisResult, ScannedFood as ScannedFoodSchema
from config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/analyze-image", response_model=FoodAnalysisResult)
async def analyze_food_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyze food image using AI and persist the upload."""
    ai_rate_limiter.check(client_key(request, f"scan:{current_user.id}"))
    try:
        if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload a JPEG, PNG, or WebP image.",
            )

        image_data = await file.read()

        if len(image_data) > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail="File too large. Please upload an image smaller than 10MB.",
            )

        storage_key = save_upload(image_data, file.content_type or "image/jpeg", subdir="scans")
        analysis_result = await ai_service.analyze_food_image(image_data)
        image_url = public_upload_url(storage_key)
        analysis_result["image_url"] = image_url

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
            image_url=image_url,
            image_data=None,
        )

        db.add(scanned_food)
        db.commit()
        db.refresh(scanned_food)

        return FoodAnalysisResult(**analysis_result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing food image: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze image. Please try again.",
        )


@router.get("/history", response_model=List[ScannedFoodSchema])
async def get_scan_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
):
    """Get user's food scan history"""
    scanned_foods = (
        db.query(ScannedFood)
        .filter(ScannedFood.user_id == current_user.id)
        .order_by(ScannedFood.analyzed_at.desc())
        .limit(limit)
        .all()
    )
    return scanned_foods


@router.delete("/history/{scan_id}")
async def delete_scan(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a scanned food item"""
    scanned_food = (
        db.query(ScannedFood)
        .filter(ScannedFood.id == scan_id, ScannedFood.user_id == current_user.id)
        .first()
    )

    if not scanned_food:
        raise HTTPException(status_code=404, detail="Scanned food not found")

    db.delete(scanned_food)
    db.commit()

    return {"message": "Scanned food deleted successfully"}


@router.post("/barcode/{barcode}", response_model=FoodAnalysisResult)
async def scan_barcode(
    barcode: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Look up nutrition by barcode via Open Food Facts."""
    try:
        result = await lookup_barcode(barcode)
        if not result:
            raise HTTPException(
                status_code=404,
                detail="Product not found for this barcode",
            )

        scanned_food = ScannedFood(
            user_id=current_user.id,
            name=result["food_name"],
            brand=result.get("brand", "Unknown"),
            barcode=result.get("barcode", barcode),
            calories=result["calories"],
            serving_size=result["serving_size"],
            macros=result["macros"],
            nutrition_details=result["nutrition_details"],
            ai_insights=result["ai_insights"],
            confidence=result["confidence"],
            image_url=result.get("image_url"),
            image_data=None,
        )
        db.add(scanned_food)
        db.commit()

        analyzed_at = result.get("analyzed_at")
        if isinstance(analyzed_at, str):
            analyzed_at = datetime.fromisoformat(analyzed_at.replace("Z", "+00:00"))

        return FoodAnalysisResult(
            food_name=result["food_name"],
            confidence=result["confidence"],
            serving_size=result["serving_size"],
            calories=result["calories"],
            macros=result["macros"],
            nutrition_details=result["nutrition_details"],
            ai_insights=result["ai_insights"],
            analyzed_at=analyzed_at or datetime.now(timezone.utc),
            image_processed=False,
            image_url=result.get("image_url"),
            brand=result.get("brand"),
            barcode=result.get("barcode", barcode),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scanning barcode: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to scan barcode. Please try again.",
        )

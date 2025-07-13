from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from services.database import get_db
from services.auth_service import get_current_user
from services.ai_service import ai_service
from models.user import User
from models.goal import Goal
from models.diet_plan import DietPlan
from schemas.diet_plan import DietPlan as DietPlanSchema, DietPlanCreate, DietPlanUpdate, DietPlanGenerate

router = APIRouter()

@router.get("/", response_model=List[DietPlanSchema])
async def get_user_diet_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's diet plans"""
    plans = db.query(DietPlan)\
        .filter(DietPlan.user_id == current_user.id, DietPlan.is_active == True)\
        .order_by(DietPlan.created_at.desc())\
        .all()
    return plans

@router.post("/generate", response_model=DietPlanSchema)
async def generate_diet_plan(
    plan_request: DietPlanGenerate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a new AI-powered diet plan"""
    try:
        # Prepare user data
        user_data = {
            "id": current_user.id,
            "age": current_user.age,
            "gender": current_user.gender,
            "height": current_user.height,
            "weight": current_user.weight,
            "activity_level": current_user.activity_level,
            "dietary_restrictions": current_user.dietary_restrictions or [],
            "allergies": current_user.allergies or []
        }
        
        # Generate plan using AI
        ai_plan = await ai_service.generate_diet_plan(user_data, plan_request.goals)
        
        # Save to database
        db_plan = DietPlan(
            user_id=current_user.id,
            name=f"AI Diet Plan - {ai_plan.get('generated_at', 'Today')}",
            description="AI-generated personalized diet plan",
            total_calories=ai_plan.get("total_calories"),
            macros=ai_plan.get("macros"),
            meals=ai_plan.get("meals"),
            supplements=ai_plan.get("supplements"),
            ai_recommendations=ai_plan.get("ai_recommendations"),
            goals=plan_request.goals
        )
        
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
        
        return db_plan
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate diet plan: {str(e)}"
        )

@router.get("/{plan_id}", response_model=DietPlanSchema)
async def get_diet_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific diet plan"""
    plan = db.query(DietPlan)\
        .filter(DietPlan.id == plan_id, DietPlan.user_id == current_user.id)\
        .first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Diet plan not found")
    
    return plan

@router.put("/{plan_id}", response_model=DietPlanSchema)
async def update_diet_plan(
    plan_id: int,
    plan_update: DietPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a diet plan"""
    plan = db.query(DietPlan)\
        .filter(DietPlan.id == plan_id, DietPlan.user_id == current_user.id)\
        .first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Diet plan not found")
    
    update_data = plan_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)
    
    db.commit()
    db.refresh(plan)
    return plan

@router.delete("/{plan_id}")
async def delete_diet_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a diet plan"""
    plan = db.query(DietPlan)\
        .filter(DietPlan.id == plan_id, DietPlan.user_id == current_user.id)\
        .first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Diet plan not found")
    
    plan.is_active = False
    db.commit()
    
    return {"message": "Diet plan deleted successfully"}
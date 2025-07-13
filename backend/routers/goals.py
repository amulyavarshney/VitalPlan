from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from services.database import get_db
from services.auth_service import get_current_user
from models.user import User
from models.goal import Goal
from schemas.goal import Goal as GoalSchema, GoalCreate, GoalUpdate

router = APIRouter()

@router.get("/", response_model=List[GoalSchema])
async def get_user_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's goals"""
    goals = db.query(Goal)\
        .filter(Goal.user_id == current_user.id, Goal.is_active == True)\
        .all()
    return goals

@router.post("/", response_model=GoalSchema)
async def create_goal(
    goal: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new goal"""
    db_goal = Goal(**goal.dict(), user_id=current_user.id)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@router.put("/{goal_id}", response_model=GoalSchema)
async def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a goal"""
    goal = db.query(Goal)\
        .filter(Goal.id == goal_id, Goal.user_id == current_user.id)\
        .first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    update_data = goal_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)
    
    db.commit()
    db.refresh(goal)
    return goal

@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a goal"""
    goal = db.query(Goal)\
        .filter(Goal.id == goal_id, Goal.user_id == current_user.id)\
        .first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    goal.is_active = False
    db.commit()
    
    return {"message": "Goal deleted successfully"}
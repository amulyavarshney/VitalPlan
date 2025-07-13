from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
import uvicorn
import os
from typing import List, Optional
import logging

from routers import auth, users, goals, diet_plans, marketplace, scanner, orders
from config import settings
from services.database import engine, Base
from services.ai_service import AIService
from services.auth_service import get_current_user

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="VitalPlan API",
    description="AI-Powered Diet Guide and Nutrition Tracker Backend",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(goals.router, prefix="/api/goals", tags=["Goals"])
app.include_router(diet_plans.router, prefix="/api/diet-plans", tags=["Diet Plans"])
app.include_router(marketplace.router, prefix="/api/marketplace", tags=["Marketplace"])
app.include_router(scanner.router, prefix="/api/scanner", tags=["Food Scanner"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "VitalPlan API is running"}

@app.get("/api/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to VitalPlan API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 
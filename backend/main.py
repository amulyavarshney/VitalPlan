from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import uvicorn
import logging

from routers import auth, users, goals, diet_plans, marketplace, scanner, orders, admin
from config import settings
from services.database import engine, Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)

# Create database tables (Alembic is preferred for production schema changes)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VitalPlan API",
    description="AI-Powered Diet Guide and Nutrition Tracker Backend",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "type": "http_error",
                "message": exc.detail if isinstance(exc.detail, str) else "Request failed",
                "detail": exc.detail,
                "path": str(request.url.path),
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "type": "validation_error",
                "message": "Request validation failed",
                "detail": exc.errors(),
                "path": str(request.url.path),
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "type": "internal_error",
                "message": "An unexpected error occurred",
                "detail": str(exc) if settings.ENVIRONMENT != "production" else None,
                "path": str(request.url.path),
            }
        },
    )


app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(goals.router, prefix="/api/goals", tags=["Goals"])
app.include_router(diet_plans.router, prefix="/api/diet-plans", tags=["Diet Plans"])
app.include_router(marketplace.router, prefix="/api/marketplace", tags=["Marketplace"])
app.include_router(scanner.router, prefix="/api/scanner", tags=["Food Scanner"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "VitalPlan API is running",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/api/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to VitalPlan API",
        "version": "1.0.0",
        "docs": "/api/docs",
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="localhost",
        port=8000,
        reload=True,
        log_level="info",
    )

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import time
import uuid
import uvicorn
import logging

from routers import auth, users, goals, diet_plans, marketplace, scanner, orders, admin, webhooks
from config import settings
from services.database import engine, Base
from services.storage_service import resolve_upload_path, s3_enabled
from services.health_service import build_health_report
import models.user  # noqa: F401
import models.goal  # noqa: F401
import models.diet_plan  # noqa: F401
import models.order  # noqa: F401
import models.scanned_food  # noqa: F401
import models.marketplace_item  # noqa: F401

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)

if settings.SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        integrations=[StarletteIntegration(), FastApiIntegration()],
    )
    logger.info("Sentry initialized")

# Dev/test convenience only — production relies on Alembic via entrypoint.sh
if settings.ENVIRONMENT != "production":
    Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VitalPlan API",
    description="AI-Powered Diet Guide and Nutrition Tracker Backend",
    version="1.3.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
        request.state.request_id = request_id
        started = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - started) * 1000
        logger.info(
            "request_id=%s %s %s -> %s (%.1fms)",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-ms"] = f"{duration_ms:.1f}"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(self), microphone=(), geolocation=()"
        response.headers["X-XSS-Protection"] = "0"
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


app.add_middleware(RequestContextMiddleware)
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
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])


@app.get("/api/uploads/{subdir}/{filename}")
async def serve_upload(subdir: str, filename: str):
    path = resolve_upload_path(f"{subdir}/{filename}")
    if not path:
        return JSONResponse(status_code=404, content={"error": {"message": "File not found"}})
    return FileResponse(path)


@app.get("/api/health")
async def health_check():
    """Readiness-style health check with database and Redis probes."""
    report = build_health_report()
    status_code = status.HTTP_200_OK if report["status"] != "unhealthy" else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(
        status_code=status_code,
        content={
            **report,
            "environment": settings.ENVIRONMENT,
            "version": "1.3.0",
            "features": {
                "refresh_tokens": True,
                "barcode_lookup": True,
                "marketplace_db": True,
                "image_uploads": True,
                "stripe_webhooks": True,
                "redis_rate_limits": True,
                "s3_uploads": s3_enabled(),
                "sentry": bool(settings.SENTRY_DSN),
            },
        },
    )


@app.get("/api/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to VitalPlan API",
        "version": "1.3.0",
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

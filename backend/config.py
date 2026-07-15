from pydantic_settings import BaseSettings
from pydantic import Field, field_validator, model_validator
from typing import List, Optional

WEAK_SECRET_KEYS = {
    "",
    "dev-only-change-me-in-production",
    "your-secret-key-change-in-production",
    "9bf75596f0523e3e29c582c64ef96c68bb77a3e3c45eb174f55fd2ec3b6fc48b",
}


class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "development"

    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "VitalPlan API"
    
    # Security
    SECRET_KEY: str = "dev-only-change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14
    ADMIN_REGISTRATION_SECRET: str = ""
    
    # Database
    DATABASE_URL: str = "sqlite:///./vitalplan.db"
    
    # Redis (optional — leave empty to disable; rate limits fall back to memory)
    REDIS_URL: str = ""
    
    # CORS (include both localhost and 127.0.0.1 for Vite/Playwright)
    ALLOWED_HOSTS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Uploads (local disk; optional S3 when S3_BUCKET + keys set)
    UPLOAD_DIR: str = "./uploads"
    S3_BUCKET: str = ""
    S3_ENDPOINT_URL: str = ""  # e.g. https://s3.amazonaws.com or MinIO URL
    S3_ACCESS_KEY_ID: str = ""
    S3_SECRET_ACCESS_KEY: str = ""
    S3_REGION: str = "us-east-1"
    S3_PUBLIC_BASE_URL: str = ""  # optional CDN/public base; else presigned GET

    # Observability (optional)
    SENTRY_DSN: str = ""
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1
    # Logging: auto (JSON in production) | text | json
    LOG_FORMAT: str = "auto"

    # Open Food Facts
    OPEN_FOOD_FACTS_USER_AGENT: str = "VitalPlan/1.0 (contact: support@vitalplan.local)"

    # Payments (optional — demo mode when unset)
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:5173"

    # Email / SMTP (console fallback when unset)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False
    # When False (default in development), new users are auto-verified.
    # Production always requires verification regardless of this flag.
    EMAIL_VERIFICATION_REQUIRED: bool = False
    
    # Azure OpenAI
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_API_VERSION: str = "2024-02-01"
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_MODEL: str = "gpt-4o"
    AZURE_OPENAI_EMBEDDING_MODEL: str = ""
    AZURE_OPENAI_TEMPERATURE: float = 0.1
    AZURE_OPENAI_MAX_TOKENS: int = 4000

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # Groq
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_TEMPERATURE: float = 0.1
    GROQ_MAX_TOKENS: int = 4000

    # Optional providers
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    COHERE_API_KEY: str = ""
    COHERE_MODEL: str = "command"
    HUGGING_FACE_API_KEY: str = ""
    HUGGING_FACE_MODEL: str = "meta-llama/Meta-Llama-3-8B-Instruct"
    MISTRAL_API_KEY: str = ""
    MISTRAL_MODEL: str = "mistral-small"
    
    # Azure Computer Vision
    AZURE_COMPUTER_VISION_ENDPOINT: str = ""
    AZURE_COMPUTER_VISION_KEY: str = ""
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # External APIs
    NUTRITION_API_KEY: str = ""
    USDA_API_KEY: str = ""

    @field_validator("ENVIRONMENT")
    @classmethod
    def normalize_environment(cls, value: str) -> str:
        return value.lower().strip()

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if self.ENVIRONMENT == "production":
            if self.SECRET_KEY in WEAK_SECRET_KEYS or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "SECRET_KEY must be a strong unique value (32+ chars) when ENVIRONMENT=production"
                )
            if not self.ADMIN_REGISTRATION_SECRET or len(self.ADMIN_REGISTRATION_SECRET) < 16:
                raise ValueError(
                    "ADMIN_REGISTRATION_SECRET must be set (16+ chars) when ENVIRONMENT=production"
                )
        return self
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()

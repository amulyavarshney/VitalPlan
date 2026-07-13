from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "VitalPlan API"
    
    # Security
    SECRET_KEY: str = "dev-only-change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = "sqlite:///./vitalplan.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # CORS
    ALLOWED_HOSTS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
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
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()

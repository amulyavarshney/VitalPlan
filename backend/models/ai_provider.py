from enum import Enum

class AIProvider(Enum):
    AZURE_OPENAI = "azure_openai"
    OPENAI = "openai"
    GROQ = "groq"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    COHERE = "cohere"
    HUGGING_FACE = "hugging_face"
    MISTRAL = "mistral"
from typing import Dict, Any
from models.ai_provider import AIProvider
from config import settings


class ChatCompletionFactory:
    @staticmethod
    def create_completion(provider: AIProvider, messages: list, **kwargs) -> Dict[str, Any]:
        if provider == AIProvider.AZURE_OPENAI:
            return ChatCompletionFactory._azure_openai_completion(messages, **kwargs)
        elif provider == AIProvider.OPENAI:
            return ChatCompletionFactory._openai_completion(messages, **kwargs)
        elif provider == AIProvider.GROQ:
            return ChatCompletionFactory._groq_completion(messages, **kwargs)
        elif provider == AIProvider.ANTHROPIC:
            return ChatCompletionFactory._anthropic_completion(messages, **kwargs)
        elif provider == AIProvider.GEMINI:
            return ChatCompletionFactory._gemini_completion(messages, **kwargs)
        elif provider == AIProvider.COHERE:
            return ChatCompletionFactory._cohere_completion(messages, **kwargs)
        elif provider == AIProvider.HUGGING_FACE:
            return ChatCompletionFactory._hugging_face_completion(messages, **kwargs)
        elif provider == AIProvider.MISTRAL:
            return ChatCompletionFactory._mistral_completion(messages, **kwargs)
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    @staticmethod
    def _azure_openai_completion(messages: list, **kwargs) -> Dict[str, Any]:
        from openai import AzureOpenAI

        client = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY or kwargs.get("api_key"),
            api_version=settings.AZURE_OPENAI_API_VERSION or kwargs.get("api_version", "2024-02-01"),
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT or kwargs.get("azure_endpoint"),
        )

        response = client.chat.completions.create(
            model=kwargs.get("model") or settings.AZURE_OPENAI_MODEL,
            messages=messages,
            temperature=kwargs.get("temperature", settings.AZURE_OPENAI_TEMPERATURE),
            max_tokens=kwargs.get("max_tokens", settings.AZURE_OPENAI_MAX_TOKENS),
        )
        return {"content": response.choices[0].message.content, "usage": response.usage}

    @staticmethod
    def _openai_completion(messages: list, **kwargs) -> Dict[str, Any]:
        from openai import OpenAI

        client = OpenAI(api_key=kwargs.get("api_key") or settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=kwargs.get("model") or settings.OPENAI_MODEL,
            messages=messages,
            temperature=kwargs.get("temperature", 0.7),
            max_tokens=kwargs.get("max_tokens", 1000),
        )
        return {"content": response.choices[0].message.content, "usage": response.usage}

    @staticmethod
    def _groq_completion(messages: list, **kwargs) -> Dict[str, Any]:
        from groq import Groq

        client = Groq(api_key=settings.GROQ_API_KEY or kwargs.get("api_key"))
        response = client.chat.completions.create(
            model=kwargs.get("model") or settings.GROQ_MODEL,
            messages=messages,
            temperature=kwargs.get("temperature", settings.GROQ_TEMPERATURE),
            max_tokens=kwargs.get("max_tokens", settings.GROQ_MAX_TOKENS),
        )
        return {"content": response.choices[0].message.content, "usage": response.usage}

    @staticmethod
    def _anthropic_completion(messages: list, **kwargs) -> Dict[str, Any]:
        import anthropic

        client = anthropic.Anthropic(api_key=kwargs.get("api_key") or settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model=kwargs.get("model") or settings.ANTHROPIC_MODEL,
            messages=messages,
            temperature=kwargs.get("temperature", 0.7),
            max_tokens=kwargs.get("max_tokens", 1000),
        )
        return {"content": response.content[0].text, "usage": response.usage}

    @staticmethod
    def _gemini_completion(messages: list, **kwargs) -> Dict[str, Any]:
        import google.generativeai as genai

        model_name = kwargs.get("model") or settings.GEMINI_MODEL
        genai.configure(api_key=kwargs.get("api_key") or settings.GEMINI_API_KEY)
        model_instance = genai.GenerativeModel(model_name)
        prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
        response = model_instance.generate_content(prompt)
        return {"content": response.text, "usage": None}

    @staticmethod
    def _cohere_completion(messages: list, **kwargs) -> Dict[str, Any]:
        import cohere

        model_name = kwargs.get("model") or settings.COHERE_MODEL
        client = cohere.Client(api_key=kwargs.get("api_key") or settings.COHERE_API_KEY)
        prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
        response = client.generate(
            model=model_name,
            prompt=prompt,
            temperature=kwargs.get("temperature", 0.7),
            max_tokens=kwargs.get("max_tokens", 1000),
        )
        return {"content": response.generations[0].text, "usage": None}

    @staticmethod
    def _hugging_face_completion(messages: list, **kwargs) -> Dict[str, Any]:
        from huggingface_hub import InferenceClient

        model_name = kwargs.get("model") or settings.HUGGING_FACE_MODEL
        client = InferenceClient(model=model_name, token=kwargs.get("api_key") or settings.HUGGING_FACE_API_KEY)
        prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
        response = client.text_generation(
            prompt,
            temperature=kwargs.get("temperature", 0.7),
            max_new_tokens=kwargs.get("max_tokens", 1000),
        )
        return {"content": response, "usage": None}

    @staticmethod
    def _mistral_completion(messages: list, **kwargs) -> Dict[str, Any]:
        from mistralai.client import MistralClient

        model_name = kwargs.get("model") or settings.MISTRAL_MODEL
        client = MistralClient(api_key=kwargs.get("api_key") or settings.MISTRAL_API_KEY)
        response = client.chat(
            model=model_name,
            messages=messages,
            temperature=kwargs.get("temperature", 0.7),
            max_tokens=kwargs.get("max_tokens", 1000),
        )
        return {"content": response.choices[0].message.content, "usage": response.usage}

from typing import Dict, Any, Optional
import openai
from openai import AzureOpenAI, OpenAI
import anthropic
import google.generativeai as genai
import cohere
from groq import Groq
from huggingface_hub import InferenceClient
from mistralai.client import MistralClient
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
        client = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY or kwargs.get('api_key'),
            api_version=settings.AZURE_OPENAI_API_VERSION or kwargs.get('api_version', '2024-02-01'),
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT or kwargs.get('azure_endpoint')
        )

        response = client.chat.completions.create(
            model=settings.AZURE_OPENAI_MODEL or kwargs.get('model'),
            messages=messages,
            temperature=settings.AZURE_OPENAI_TEMPERATURE or kwargs.get('temperature', 0.7),
            max_tokens=settings.AZURE_OPENAI_MAX_TOKENS or kwargs.get('max_tokens', 1000)
        )
        return {"content": response.choices[0].message.content, "usage": response.usage}

    @staticmethod
    def _openai_completion(messages: list, **kwargs) -> Dict[str, Any]:
        client = OpenAI(api_key=kwargs.get('api_key'))
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL or kwargs.get('model'),
            messages=messages,
            temperature=settings.OPENAI_TEMPERATURE or kwargs.get('temperature', 0.7),
            max_tokens=settings.OPENAI_MAX_TOKENS or kwargs.get('max_tokens', 1000)
        )
        return {"content": response.choices[0].message.content, "usage": response.usage}

    @staticmethod
    def _groq_completion(messages: list, **kwargs) -> Dict[str, Any]:
        client = Groq(api_key=settings.GROQ_API_KEY or kwargs.get('api_key'))
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL or kwargs.get('model'),
            messages=messages,
            temperature=settings.GROQ_TEMPERATURE or kwargs.get('temperature', 0.7),
            max_tokens=settings.GROQ_MAX_TOKENS or kwargs.get('max_tokens', 1000)
        )
        return {"content": response.choices[0].message.content, "usage": response.usage}

    @staticmethod
    def _anthropic_completion(messages: list, **kwargs) -> Dict[str, Any]:
        client = anthropic.Anthropic(api_key=kwargs.get('api_key'))
        response = client.messages.create(
            model=settings.ANTHROPIC_MODEL or kwargs.get('model'),
            messages=messages,
            temperature=kwargs.get('temperature', 0.7),
            max_tokens=kwargs.get('max_tokens', 1000)
        )
        return {"content": response.content[0].text, "usage": response.usage}

    @staticmethod
    def _gemini_completion(messages: list, **kwargs) -> Dict[str, Any]:
        genai.configure(api_key=kwargs.get('api_key'))
        model_instance = genai.GenerativeModel(model)
        prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
        response = model_instance.generate_content(prompt)
        return {"content": response.text, "usage": None}

    @staticmethod
    def _cohere_completion(messages: list, **kwargs) -> Dict[str, Any]:
        client = cohere.Client(api_key=kwargs.get('api_key'))
        prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
        response = client.generate(
            model=model,
            prompt=prompt,
            temperature=kwargs.get('temperature', 0.7),
            max_tokens=kwargs.get('max_tokens', 1000)
        )
        return {"content": response.generations[0].text, "usage": None}

    @staticmethod
    def _hugging_face_completion(messages: list, **kwargs) -> Dict[str, Any]:
        client = InferenceClient(model=model, token=kwargs.get('api_key'))
        prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
        response = client.text_generation(
            prompt,
            temperature=kwargs.get('temperature', 0.7),
            max_new_tokens=kwargs.get('max_tokens', 1000)
        )
        return {"content": response, "usage": None}

    @staticmethod
    def _mistral_completion(messages: list, **kwargs) -> Dict[str, Any]:
        client = MistralClient(api_key=kwargs.get('api_key'))
        response = client.chat(
            model=model,
            messages=messages,
            temperature=kwargs.get('temperature', 0.7),
            max_tokens=kwargs.get('max_tokens', 1000)
        )
        return {"content": response.choices[0].message.content, "usage": response.usage}
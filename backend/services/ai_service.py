from openai import AzureOpenAI
from groq import Groq
import base64
import io
from PIL import Image
from typing import Dict, List, Any, Optional
import logging
import json
from datetime import datetime, timezone
from models.ai_provider import AIProvider

from config import settings

logger = logging.getLogger(__name__)

class AIService:
    """AI Service for nutrition analysis and diet plan generation"""

    def __init__(self, provider: AIProvider = AIProvider.GROQ, **config):
        self.provider = provider
        self.config = config

    def generate_chat_completion(self, messages: list, model: str, **kwargs) -> Dict[str, Any]:
        """Generate chat completion using the configured provider"""
        completion_kwargs = {
            **self.config,
            **kwargs
        }
        
        return ChatCompletionFactory.create_completion(
            provider=self.provider,
            messages=messages,
            model=model,
            **completion_kwargs
        )

    # def chat(self, user_message: str, model: str, system_message: Optional[str] = None, **kwargs) -> str:
    #     """Simple chat interface"""
    #     messages = []
        
    #     if system_message:
    #         messages.append({"role": "system", "content": system_message})
        
    #     messages.append({"role": "user", "content": user_message})
        
    #     response = self.generate_chat_completion(messages, model, **kwargs)
    #     return response.get("content", "")
    
    async def analyze_food_image(self, image_data: bytes, **kwargs) -> Dict[str, Any]:
        """Analyze food image using Azure OpenAI Vision"""
        try:
            # Convert image to base64
            image = Image.open(io.BytesIO(image_data))
            
            # Resize image if too large
            if image.size[0] > 1024 or image.size[1] > 1024:
                image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
            
            # Convert to base64
            buffer = io.BytesIO()
            image.save(buffer, format="JPEG", quality=85)
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            # Prepare the prompt for food analysis
            prompt = """
            Analyze this food image and provide detailed nutritional information. 
            Return a JSON response with the following structure:
            {
                "food_name": "Name of the food item",
                "confidence": 0.95,
                "serving_size": "1 medium apple (182g)",
                "calories": 95,
                "macros": {
                    "protein": 0.5,
                    "carbs": 25,
                    "fat": 0.3
                },
                "nutrition_details": {
                    "vitamins": {"Vitamin C": "14% DV", "Vitamin K": "5% DV"},
                    "minerals": {"Potassium": "6% DV", "Manganese": "3% DV"},
                    "fiber": 4.4,
                    "sugar": 19,
                    "sodium": 2,
                    "cholesterol": 0,
                    "saturated_fat": 0.1,
                    "trans_fat": 0
                },
                "ai_insights": [
                    "Rich in antioxidants and fiber",
                    "Great for heart health",
                    "Natural source of energy"
                ]
            }
            
            Be accurate with nutritional values and provide helpful health insights.
            """
            
            # Call Azure OpenAI Vision API
            response = self.generate_chat_completion(
                    model=kwargs.get("model", settings.AZURE_OPENAI_MODEL),
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                { "type": "text", "text": prompt },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_base64}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=kwargs.get("max_tokens", settings.AZURE_OPENAI_MAX_TOKENS),
                    temperature=kwargs.get("temperature", settings.AZURE_OPENAI_TEMPERATURE)
                )
            
            content = response.get("content")
            
            try:
                # Try to parse as JSON
                nutrition_data = json.loads(content)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON response from AI")
            
            # Add metadata
            nutrition_data["analyzed_at"] = datetime.now(timezone.utc).isoformat()
            nutrition_data["image_processed"] = True
            
            return nutrition_data
            
        except Exception as e:
            logger.error(f"Error analyzing food image: {str(e)}")
            raise e
    
    async def generate_diet_plan(self, user_data: Dict[str, Any], goals: List[Dict[str, Any]], **kwargs) -> Dict[str, Any]:
        """Generate personalized diet plan using AI"""
        try:
            # Prepare user context
            user_context = f"""
            User Profile:
            - Age: {user_data.get('age', 25)}
            - Gender: {user_data.get('gender', 'other')}
            - Height: {user_data.get('height', 170)}cm
            - Weight: {user_data.get('weight', 70)}kg
            - Activity Level: {user_data.get('activity_level', 'moderate')}
            - Dietary Restrictions: {', '.join(user_data.get('dietary_restrictions', []))}
            - Allergies: {', '.join(user_data.get('allergies', []))}
            
            Goals:
            {chr(10).join([f"- {goal.get('title', '')}: {goal.get('description', '')} (Priority: {goal.get('priority', 'medium')})" for goal in goals])}
            """
            
            prompt = f"""
            {user_context}
            
            Create a comprehensive, personalized diet plan with the following structure:
            {{
                "total_calories": 2000,
                "macros": {{"protein": 150, "carbs": 200, "fat": 67}},
                "meals": [
                    {{
                        "id": "meal-1",
                        "name": "Power Protein Breakfast Bowl",
                        "type": "breakfast",
                        "description": "Greek yogurt with berries and nuts",
                        "ingredients": ["Greek yogurt (200g)", "Mixed berries (100g)", "Almonds (30g)"],
                        "calories": 485,
                        "macros": {{"protein": 38, "carbs": 32, "fat": 18}},
                        "prep_time": 5,
                        "difficulty": "easy",
                        "instructions": ["Add yogurt to bowl", "Top with berries and nuts"],
                        "nutrition_details": {{
                            "vitamins": {{"Vitamin C": "45mg", "Vitamin B12": "2.4μg"}},
                            "minerals": {{"Calcium": "320mg", "Iron": "2.1mg"}},
                            "fiber": 8.5,
                            "sugar": 24,
                            "sodium": 95,
                            "cholesterol": 15,
                            "saturated_fat": 4.2,
                            "trans_fat": 0
                        }}
                    }}
                ],
                "supplements": [
                    {{
                        "id": "supp-1",
                        "name": "Omega-3 Fish Oil",
                        "description": "High-potency fish oil for heart health",
                        "dosage": "2 capsules daily",
                        "timing": "With meals",
                        "benefits": ["Heart health", "Brain function", "Anti-inflammatory"],
                        "price": 29.99
                    }}
                ],
                "ai_recommendations": [
                    "Focus on lean proteins for muscle building",
                    "Include antioxidant-rich foods for skin health"
                ]
            }}
            
            Ensure the plan is tailored to the user's goals, restrictions, and preferences.
            Include 4 meals (breakfast, lunch, dinner, snack) and 2-3 relevant supplements.
            """
            
            response = self.generate_chat_completion(
                model=kwargs.get("model", settings.AZURE_OPENAI_MODEL),
                messages=[{"role": "user", "content": prompt}],
                max_tokens=kwargs.get("max_tokens", settings.AZURE_OPENAI_MAX_TOKENS),
                temperature=kwargs.get("temperature", settings.AZURE_OPENAI_TEMPERATURE)
            )

            content = response.get("content")
            
            try:
                diet_plan = json.loads(content)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON response from AI")
            
            # Add metadata
            diet_plan["generated_at"] = datetime.now(timezone.utc).isoformat()
            diet_plan["user_id"] = user_data.get("id")
            diet_plan["goals"] = goals
            
            return diet_plan
            
        except Exception as e:
            logger.error(f"Error generating diet plan: {str(e)}")
            raise e
    
    async def get_nutrition_insights(self, nutrition_data: Dict[str, Any]) -> List[str]:
        """Generate AI-powered nutrition insights"""
        try:
            prompt = f"""
            Based on this nutritional information:
            Calories: {nutrition_data.get('calories', 0)}
            Protein: {nutrition_data.get('macros', {}).get('protein', 0)}g
            Carbs: {nutrition_data.get('macros', {}).get('carbs', 0)}g
            Fat: {nutrition_data.get('macros', {}).get('fat', 0)}g
            Fiber: {nutrition_data.get('nutrition_details', {}).get('fiber', 0)}g
            
            Provide 3-4 brief, actionable health insights about this food.
            Return as a JSON array of strings.
            """
            
            response = self.generate_chat_completion(
                model=kwargs.get("model", settings.AZURE_OPENAI_MODEL),
                messages=[{"role": "user", "content": prompt}],
                max_tokens=kwargs.get("max_tokens", settings.AZURE_OPENAI_MAX_TOKENS),
                temperature=kwargs.get("temperature", settings.AZURE_OPENAI_TEMPERATURE)
            )

            content = response.get("content")
            
            insights = json.loads(content)
            
            return insights if isinstance(insights, list) else []
            
        except Exception as e:
            logger.error(f"Error generating insights: {str(e)}")
            raise e

# Global AI service instance
ai_service = AIService()
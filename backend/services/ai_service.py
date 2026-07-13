import base64
import io
from PIL import Image
from typing import Dict, List, Any, Optional
import logging
import json
from datetime import datetime, timezone
from models.ai_provider import AIProvider
from utils.chat_completion_factory import ChatCompletionFactory
from config import settings

logger = logging.getLogger(__name__)


def _demo_diet_plan(user_data: Dict[str, Any], goals: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Deterministic fallback when no AI provider is configured."""
    return {
        "total_calories": 2000,
        "macros": {"protein": 150, "carbs": 200, "fat": 67},
        "meals": [
            {
                "id": "meal-1",
                "name": "Power Protein Breakfast Bowl",
                "type": "breakfast",
                "description": "Greek yogurt with berries and nuts",
                "ingredients": ["Greek yogurt (200g)", "Mixed berries (100g)", "Almonds (30g)"],
                "calories": 485,
                "macros": {"protein": 38, "carbs": 32, "fat": 18},
                "prep_time": 5,
                "difficulty": "easy",
                "instructions": ["Add yogurt to bowl", "Top with berries and nuts"],
                "image_url": "https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=400",
                "nutrition_details": {
                    "vitamins": {"Vitamin C": "45mg", "Vitamin B12": "2.4μg"},
                    "minerals": {"Calcium": "320mg", "Iron": "2.1mg"},
                    "fiber": 8.5,
                    "sugar": 24,
                    "sodium": 95,
                    "cholesterol": 15,
                    "saturated_fat": 4.2,
                    "trans_fat": 0,
                },
            },
            {
                "id": "meal-2",
                "name": "Mediterranean Quinoa Power Salad",
                "type": "lunch",
                "description": "Nutrient-dense quinoa salad packed with antioxidants",
                "ingredients": ["Quinoa (100g)", "Cherry tomatoes (150g)", "Cucumber (100g)", "Feta cheese (50g)"],
                "calories": 565,
                "macros": {"protein": 20, "carbs": 48, "fat": 32},
                "prep_time": 15,
                "difficulty": "easy",
                "instructions": ["Cook quinoa", "Dice vegetables", "Toss with olive oil and lemon"],
                "image_url": "https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=400",
                "nutrition_details": {
                    "vitamins": {"Vitamin K": "180μg", "Vitamin C": "28mg"},
                    "minerals": {"Magnesium": "118mg", "Potassium": "520mg"},
                    "fiber": 12.3,
                    "sugar": 8,
                    "sodium": 485,
                    "cholesterol": 25,
                    "saturated_fat": 8.1,
                    "trans_fat": 0,
                },
            },
            {
                "id": "meal-3",
                "name": "Grilled Salmon with Sweet Potato",
                "type": "dinner",
                "description": "Omega-3 rich salmon with roasted vegetables",
                "ingredients": ["Salmon fillet (150g)", "Sweet potato (200g)", "Broccoli (150g)"],
                "calories": 620,
                "macros": {"protein": 42, "carbs": 45, "fat": 28},
                "prep_time": 25,
                "difficulty": "medium",
                "instructions": ["Preheat oven", "Season salmon", "Roast vegetables", "Serve"],
                "image_url": "https://images.pexels.com/photos/3655916/pexels-photo-3655916.jpeg?auto=compress&cs=tinysrgb&w=400",
                "nutrition_details": {
                    "vitamins": {"Vitamin D": "570IU", "Vitamin B12": "3.2μg"},
                    "minerals": {"Selenium": "40μg", "Potassium": "890mg"},
                    "fiber": 7.2,
                    "sugar": 9,
                    "sodium": 210,
                    "cholesterol": 70,
                    "saturated_fat": 5.4,
                    "trans_fat": 0,
                },
            },
            {
                "id": "meal-4",
                "name": "Greek Yogurt Berry Parfait",
                "type": "snack",
                "description": "High-protein snack with antioxidants",
                "ingredients": ["Greek yogurt (150g)", "Blueberries (80g)", "Honey (1 tsp)"],
                "calories": 220,
                "macros": {"protein": 18, "carbs": 28, "fat": 4},
                "prep_time": 5,
                "difficulty": "easy",
                "instructions": ["Layer yogurt and berries", "Drizzle honey"],
                "image_url": "https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=400",
                "nutrition_details": {
                    "vitamins": {"Vitamin C": "12mg", "Vitamin B12": "1.1μg"},
                    "minerals": {"Calcium": "180mg", "Phosphorus": "140mg"},
                    "fiber": 3.5,
                    "sugar": 18,
                    "sodium": 55,
                    "cholesterol": 10,
                    "saturated_fat": 1.5,
                    "trans_fat": 0,
                },
            },
        ],
        "supplements": [
            {
                "id": "supp-1",
                "name": "Omega-3 Fish Oil",
                "description": "High-potency fish oil for heart health",
                "dosage": "2 capsules daily",
                "timing": "With meals",
                "benefits": ["Heart health", "Brain function", "Anti-inflammatory"],
                "price": 29.99,
                "image_url": "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=400",
            },
            {
                "id": "supp-2",
                "name": "Vitamin D3",
                "description": "Supports bone health and immune function",
                "dosage": "1 softgel daily",
                "timing": "Morning with food",
                "benefits": ["Bone health", "Immune support", "Mood"],
                "price": 14.99,
                "image_url": "https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg?auto=compress&cs=tinysrgb&w=400",
            },
        ],
        "ai_recommendations": [
            "Focus on lean proteins aligned with your selected goals",
            "Stay hydrated and prioritize whole foods",
            f"Plan tailored for: {', '.join([g.get('title', g.get('type', 'goal')) for g in goals]) or 'general wellness'}",
            f"Activity level considered: {user_data.get('activity_level', 'moderate')}",
        ],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "user_id": user_data.get("id"),
        "goals": goals,
        "demo_mode": True,
    }


def _demo_food_analysis() -> Dict[str, Any]:
    return {
        "food_name": "Mixed Garden Salad",
        "confidence": 0.85,
        "serving_size": "1 bowl (250g)",
        "calories": 180,
        "macros": {"protein": 6.0, "carbs": 18.0, "fat": 9.0},
        "nutrition_details": {
            "vitamins": {"Vitamin A": "45% DV", "Vitamin C": "35% DV"},
            "minerals": {"Potassium": "12% DV", "Iron": "8% DV"},
            "fiber": 5.5,
            "sugar": 6,
            "sodium": 120,
            "cholesterol": 0,
            "saturated_fat": 1.2,
            "trans_fat": 0,
        },
        "ai_insights": [
            "High in fiber and micronutrients",
            "Add a protein source for a more balanced meal",
            "Great choice for hydration and volume eating",
        ],
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
        "image_processed": True,
        "demo_mode": True,
    }


class AIService:
    """AI Service for nutrition analysis and diet plan generation"""

    def __init__(self, provider: Optional[AIProvider] = None, **config):
        self.provider = provider or self._default_provider()
        self.config = config

    def _default_provider(self) -> AIProvider:
        if settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
            return AIProvider.AZURE_OPENAI
        if settings.GROQ_API_KEY:
            return AIProvider.GROQ
        if settings.OPENAI_API_KEY:
            return AIProvider.OPENAI
        return AIProvider.GROQ

    def _has_provider_credentials(self) -> bool:
        if self.provider == AIProvider.AZURE_OPENAI:
            return bool(settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT)
        if self.provider == AIProvider.GROQ:
            return bool(settings.GROQ_API_KEY)
        if self.provider == AIProvider.OPENAI:
            return bool(settings.OPENAI_API_KEY)
        return False

    def _default_model(self) -> str:
        if self.provider == AIProvider.AZURE_OPENAI:
            return settings.AZURE_OPENAI_MODEL or "gpt-4o"
        if self.provider == AIProvider.GROQ:
            return settings.GROQ_MODEL
        if self.provider == AIProvider.OPENAI:
            return settings.OPENAI_MODEL
        return "gpt-4o"

    def generate_chat_completion(self, messages: list, model: str, **kwargs) -> Dict[str, Any]:
        """Generate chat completion using the configured provider"""
        completion_kwargs = {
            **self.config,
            **kwargs,
        }

        return ChatCompletionFactory.create_completion(
            provider=self.provider,
            messages=messages,
            model=model,
            **completion_kwargs,
        )

    async def analyze_food_image(self, image_data: bytes, **kwargs) -> Dict[str, Any]:
        """Analyze food image using vision-capable AI, with demo fallback."""
        if not self._has_provider_credentials():
            logger.warning("No AI credentials configured; returning demo food analysis")
            return _demo_food_analysis()

        try:
            image = Image.open(io.BytesIO(image_data))

            if image.size[0] > 1024 or image.size[1] > 1024:
                image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)

            buffer = io.BytesIO()
            image.save(buffer, format="JPEG", quality=85)
            image_base64 = base64.b64encode(buffer.getvalue()).decode()

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
            Return ONLY valid JSON.
            """

            response = self.generate_chat_completion(
                model=kwargs.get("model", self._default_model()),
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                },
                            },
                        ],
                    }
                ],
                max_tokens=kwargs.get("max_tokens", settings.AZURE_OPENAI_MAX_TOKENS),
                temperature=kwargs.get("temperature", settings.AZURE_OPENAI_TEMPERATURE),
            )

            content = response.get("content") or ""
            content = content.strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[-1]
                content = content.rsplit("```", 1)[0].strip()

            try:
                nutrition_data = json.loads(content)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON response from AI")

            nutrition_data["analyzed_at"] = datetime.now(timezone.utc).isoformat()
            nutrition_data["image_processed"] = True

            return nutrition_data

        except Exception as e:
            logger.error(f"Error analyzing food image: {str(e)}")
            logger.warning("Falling back to demo food analysis")
            return _demo_food_analysis()

    async def generate_diet_plan(self, user_data: Dict[str, Any], goals: List[Dict[str, Any]], **kwargs) -> Dict[str, Any]:
        """Generate personalized diet plan using AI, with demo fallback."""
        if not self._has_provider_credentials():
            logger.warning("No AI credentials configured; returning demo diet plan")
            return _demo_diet_plan(user_data, goals)

        try:
            user_context = f"""
            User Profile:
            - Age: {user_data.get('age', 25)}
            - Gender: {user_data.get('gender', 'other')}
            - Height: {user_data.get('height', 170)}cm
            - Weight: {user_data.get('weight', 70)}kg
            - Activity Level: {user_data.get('activity_level', 'moderate')}
            - Dietary Restrictions: {', '.join(user_data.get('dietary_restrictions', []) or [])}
            - Allergies: {', '.join(user_data.get('allergies', []) or [])}

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
            Return ONLY valid JSON.
            """

            response = self.generate_chat_completion(
                model=kwargs.get("model", self._default_model()),
                messages=[{"role": "user", "content": prompt}],
                max_tokens=kwargs.get("max_tokens", settings.AZURE_OPENAI_MAX_TOKENS),
                temperature=kwargs.get("temperature", settings.AZURE_OPENAI_TEMPERATURE),
            )

            content = response.get("content") or ""
            content = content.strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[-1]
                content = content.rsplit("```", 1)[0].strip()

            try:
                diet_plan = json.loads(content)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON response from AI")

            diet_plan["generated_at"] = datetime.now(timezone.utc).isoformat()
            diet_plan["user_id"] = user_data.get("id")
            diet_plan["goals"] = goals

            return diet_plan

        except Exception as e:
            logger.error(f"Error generating diet plan: {str(e)}")
            logger.warning("Falling back to demo diet plan")
            return _demo_diet_plan(user_data, goals)

    async def get_nutrition_insights(self, nutrition_data: Dict[str, Any], **kwargs) -> List[str]:
        """Generate AI-powered nutrition insights"""
        if not self._has_provider_credentials():
            return [
                "Include a variety of colorful vegetables",
                "Balance protein, carbs, and healthy fats",
                "Watch sodium if this is a frequent choice",
            ]

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
                model=kwargs.get("model", self._default_model()),
                messages=[{"role": "user", "content": prompt}],
                max_tokens=kwargs.get("max_tokens", settings.AZURE_OPENAI_MAX_TOKENS),
                temperature=kwargs.get("temperature", settings.AZURE_OPENAI_TEMPERATURE),
            )

            content = response.get("content") or "[]"
            insights = json.loads(content)

            return insights if isinstance(insights, list) else []

        except Exception as e:
            logger.error(f"Error generating insights: {str(e)}")
            return [
                "Include a variety of colorful vegetables",
                "Balance protein, carbs, and healthy fats",
            ]


# Global AI service instance
ai_service = AIService()

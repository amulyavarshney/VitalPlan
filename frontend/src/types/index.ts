export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  height: number;
  weight: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  dietaryRestrictions: string[];
  allergies: string[];
  goals: Goal[];
  createdAt: Date;
  avatar?: string;
  bio?: string;
  location?: string;
}

export interface Goal {
  id: string | number;
  type: 'muscle-building' | 'glowing-skin' | 'healthy-aging' | 'health-conditions' | string;
  title: string;
  description: string;
  targetDate?: Date | string;
  priority: 'low' | 'medium' | 'high';
}

export interface DietPlan {
  id: string | number;
  userId?: string | number;
  name?: string;
  description?: string;
  goals: Goal[];
  meals: Meal[];
  supplements: Supplement[];
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  aiRecommendations?: string[];
  generatedAt?: Date | string;
  createdAt?: Date | string;
}

export interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  ingredients: string[];
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  prepTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  instructions?: string[];
  nutritionDetails?: NutritionDetails;
  imageUrl?: string;
}

export interface NutritionDetails {
  vitamins: { [key: string]: string };
  minerals: { [key: string]: string };
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
  saturatedFat: number;
  transFat: number;
}

export interface Supplement {
  id: string;
  name: string;
  description: string;
  dosage: string;
  timing: string;
  benefits: string[];
  price: number;
  imageUrl?: string;
  rating?: number;
  reviews?: number;
  brand?: string;
}

export interface Order {
  id: string | number;
  userId: string | number;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: Date | string;
  vendor: 'amazon' | 'walmart' | 'local' | string;
  deliveryAddress?: string;
  paymentMethod?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  type: 'supplement' | 'grocery';
}

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: 'supplements' | 'organic-foods' | 'superfoods' | 'protein' | 'vitamins' | string;
  brand: string;
  rating: number;
  reviews: number;
  imageUrl: string;
  inStock: boolean;
  features: string[];
  nutritionFacts?: NutritionDetails;
}

export interface ScannedFood {
  id?: string | number;
  name: string;
  foodName?: string;
  brand?: string;
  barcode?: string;
  calories: number;
  servingSize: string;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  nutritionDetails: NutritionDetails;
  imageUrl?: string;
  confidence?: number;
  aiInsights?: string[];
  analyzedAt?: Date | string;
  imageData?: string;
}

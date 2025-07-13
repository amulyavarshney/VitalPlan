import React, { useState, useEffect } from 'react';
import { Clock, Users, ChefHat, ShoppingCart, Loader, RefreshCw, Download, Info, X, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { DietPlan as DietPlanType, Meal, Supplement, Goal, User, NutritionDetails } from '../../types';

interface DietPlanProps {
  goals: Goal[];
  user: User | null;
  onAddToCart: (items: any[]) => void;
}

// Enhanced mock AI-generated content with detailed nutrition
const generateMockDietPlan = (goals: Goal[], user: User | null): DietPlanType => {
  const mockMeals: Meal[] = [
    {
      id: 'meal-1',
      name: 'Power Protein Breakfast Bowl',
      type: 'breakfast',
      description: 'Greek yogurt with berries, nuts, and protein powder - perfect for muscle building and sustained energy',
      ingredients: ['Greek yogurt (200g)', 'Mixed berries (100g)', 'Almonds (30g)', 'Vanilla protein powder (1 scoop)', 'Honey (1 tbsp)', 'Chia seeds (1 tbsp)'],
      calories: 485,
      macros: { protein: 38, carbs: 32, fat: 18 },
      prepTime: 5,
      difficulty: 'easy',
      imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=400',
      instructions: [
        'Add Greek yogurt to a bowl',
        'Mix in protein powder until smooth',
        'Top with mixed berries and almonds',
        'Drizzle with honey and sprinkle chia seeds',
        'Serve immediately for best texture'
      ],
      nutritionDetails: {
        vitamins: { 'Vitamin C': '45mg', 'Vitamin B12': '2.4μg', 'Vitamin D': '120IU' },
        minerals: { 'Calcium': '320mg', 'Iron': '2.1mg', 'Magnesium': '85mg' },
        fiber: 8.5,
        sugar: 24,
        sodium: 95,
        cholesterol: 15,
        saturatedFat: 4.2,
        transFat: 0
      }
    },
    {
      id: 'meal-2',
      name: 'Mediterranean Quinoa Power Salad',
      type: 'lunch',
      description: 'Nutrient-dense quinoa salad packed with antioxidants for glowing skin and sustained energy',
      ingredients: ['Quinoa (100g)', 'Cherry tomatoes (150g)', 'Cucumber (100g)', 'Feta cheese (50g)', 'Extra virgin olive oil (2 tbsp)', 'Lemon juice (1 tbsp)', 'Fresh herbs (parsley, mint)', 'Red onion (30g)', 'Kalamata olives (40g)'],
      calories: 565,
      macros: { protein: 20, carbs: 48, fat: 32 },
      prepTime: 15,
      difficulty: 'easy',
      imageUrl: 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=400',
      instructions: [
        'Cook quinoa according to package instructions and let cool',
        'Dice tomatoes, cucumber, and red onion',
        'Whisk olive oil with lemon juice and herbs',
        'Combine all ingredients in a large bowl',
        'Toss with dressing and let marinate for 10 minutes',
        'Top with crumbled feta and olives before serving'
      ],
      nutritionDetails: {
        vitamins: { 'Vitamin K': '180μg', 'Vitamin C': '28mg', 'Folate': '95μg' },
        minerals: { 'Magnesium': '118mg', 'Phosphorus': '285mg', 'Potassium': '520mg' },
        fiber: 12.3,
        sugar: 8,
        sodium: 485,
        cholesterol: 25,
        saturatedFat: 8.1,
        transFat: 0
      }
    },
    {
      id: 'meal-3',
      name: 'Grilled Salmon with Roasted Sweet Potato',
      type: 'dinner',
      description: 'Omega-3 rich salmon with antioxidant-packed vegetables for optimal health and recovery',
      ingredients: ['Salmon fillet (150g)', 'Sweet potato (200g)', 'Broccoli (150g)', 'Asparagus (100g)', 'Olive oil (1 tbsp)', 'Garlic (2 cloves)', 'Lemon (1/2)', 'Fresh dill', 'Sea salt', 'Black pepper'],
      calories: 620,
      macros: { protein: 45, carbs: 38, fat: 28 },
      prepTime: 30,
      difficulty: 'medium',
      imageUrl: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=400',
      instructions: [
        'Preheat oven to 400°F (200°C)',
        'Cut sweet potato into cubes and toss with olive oil',
        'Roast sweet potato for 20 minutes',
        'Season salmon with salt, pepper, and dill',
        'Grill salmon for 4-5 minutes per side',
        'Steam broccoli and asparagus until tender-crisp',
        'Serve with lemon wedges'
      ],
      nutritionDetails: {
        vitamins: { 'Vitamin A': '1200μg', 'Vitamin D': '360IU', 'Vitamin B6': '1.2mg' },
        minerals: { 'Selenium': '55μg', 'Potassium': '890mg', 'Phosphorus': '420mg' },
        fiber: 11.2,
        sugar: 12,
        sodium: 125,
        cholesterol: 85,
        saturatedFat: 6.8,
        transFat: 0
      }
    },
    {
      id: 'meal-4',
      name: 'Antioxidant Berry Smoothie Bowl',
      type: 'snack',
      description: 'Superfood-packed smoothie bowl loaded with antioxidants for glowing skin and energy',
      ingredients: ['Frozen mixed berries (150g)', 'Banana (1 medium)', 'Spinach (30g)', 'Almond butter (2 tbsp)', 'Coconut milk (100ml)', 'Granola (30g)', 'Coconut flakes (1 tbsp)', 'Goji berries (1 tbsp)'],
      calories: 385,
      macros: { protein: 12, carbs: 45, fat: 18 },
      prepTime: 8,
      difficulty: 'easy',
      imageUrl: 'https://images.pexels.com/photos/1640771/pexels-photo-1640771.jpeg?auto=compress&cs=tinysrgb&w=400',
      instructions: [
        'Blend frozen berries, banana, spinach, and coconut milk until smooth',
        'Pour into a bowl',
        'Top with granola, coconut flakes, and goji berries',
        'Drizzle with almond butter',
        'Serve immediately'
      ],
      nutritionDetails: {
        vitamins: { 'Vitamin C': '85mg', 'Vitamin E': '8mg', 'Folate': '65μg' },
        minerals: { 'Manganese': '1.8mg', 'Copper': '0.3mg', 'Iron': '2.8mg' },
        fiber: 14.5,
        sugar: 28,
        sodium: 45,
        cholesterol: 0,
        saturatedFat: 8.2,
        transFat: 0
      }
    }
  ];

  const mockSupplements: Supplement[] = [
    {
      id: 'supp-1',
      name: 'Premium Omega-3 Fish Oil',
      description: 'High-potency fish oil with EPA and DHA for heart, brain, and joint health',
      dosage: '2 capsules daily (1000mg each)',
      timing: 'With meals to enhance absorption',
      benefits: ['Heart health support', 'Brain function enhancement', 'Anti-inflammatory properties', 'Joint health', 'Skin health'],
      price: 29.99,
      imageUrl: 'https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.8,
      reviews: 2847,
      brand: 'Nordic Naturals'
    },
    {
      id: 'supp-2',
      name: 'Vitamin D3 + K2 Complex',
      description: 'Synergistic blend of Vitamin D3 and K2 for optimal bone health and calcium absorption',
      dosage: '1 capsule daily (2000 IU D3 + 100μg K2)',
      timing: 'Morning with breakfast',
      benefits: ['Bone health support', 'Immune system boost', 'Calcium absorption', 'Mood regulation', 'Muscle function'],
      price: 24.99,
      imageUrl: 'https://images.pexels.com/photos/3683108/pexels-photo-3683108.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.7,
      reviews: 1923,
      brand: 'Thorne Health'
    },
    {
      id: 'supp-3',
      name: 'Collagen Peptides Powder',
      description: 'Grass-fed collagen peptides for skin elasticity, joint health, and hair strength',
      dosage: '1 scoop daily (20g)',
      timing: 'Can be mixed with smoothies or beverages',
      benefits: ['Skin elasticity', 'Hair and nail strength', 'Joint support', 'Muscle recovery', 'Gut health'],
      price: 39.99,
      imageUrl: 'https://images.pexels.com/photos/3683109/pexels-photo-3683109.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.6,
      reviews: 3156,
      brand: 'Vital Proteins'
    }
  ];

  return {
    id: `plan-${Date.now()}`,
    userId: user?.id || 'user-1',
    goals,
    meals: mockMeals,
    supplements: mockSupplements,
    totalCalories: mockMeals.reduce((sum, meal) => sum + meal.calories, 0),
    macros: {
      protein: mockMeals.reduce((sum, meal) => sum + meal.macros.protein, 0),
      carbs: mockMeals.reduce((sum, meal) => sum + meal.macros.carbs, 0),
      fat: mockMeals.reduce((sum, meal) => sum + meal.macros.fat, 0),
    },
    generatedAt: new Date()
  };
};

export default function DietPlan({ goals, user, onAddToCart }: DietPlanProps) {
  const [dietPlan, setDietPlan] = useState<DietPlanType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'meals' | 'supplements'>('meals');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const generatePlan = async () => {
    setIsLoading(true);
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newPlan = generateMockDietPlan(goals, user);
    setDietPlan(newPlan);
    setIsLoading(false);
  };

  useEffect(() => {
    if (goals.length > 0) {
      generatePlan();
    }
  }, [goals]);

  const handleAddAllToCart = () => {
    if (!dietPlan) return;
    
    const cartItems = [
      ...dietPlan.meals.map(meal => ({
        id: meal.id,
        name: `Ingredients for ${meal.name}`,
        type: 'grocery',
        price: Math.round(meal.calories * 0.015 * 100) / 100, // Mock pricing
        quantity: 1
      })),
      ...dietPlan.supplements.map(supp => ({
        id: supp.id,
        name: supp.name,
        type: 'supplement',
        price: supp.price,
        quantity: 1
      }))
    ];
    
    onAddToCart(cartItems);
  };

  const downloadPDF = async () => {
    if (!dietPlan) return;
    
    setIsDownloading(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Title
      pdf.setFontSize(24);
      pdf.setTextColor(16, 185, 129); // emerald-500
      pdf.text('Your Personalized Diet Plan', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // User info
      pdf.setFontSize(12);
      pdf.setTextColor(75, 85, 99); // gray-600
      pdf.text(`Generated for: ${user?.name || 'User'}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Date: ${dietPlan.generatedAt.toLocaleDateString()}`, 20, yPosition);
      yPosition += 15;

      // Goals
      pdf.setFontSize(16);
      pdf.setTextColor(17, 24, 39); // gray-900
      pdf.text('Your Goals:', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(11);
      goals.forEach(goal => {
        pdf.text(`• ${goal.title} (${goal.priority} priority)`, 25, yPosition);
        yPosition += 6;
      });
      yPosition += 10;

      // Nutrition Summary
      pdf.setFontSize(16);
      pdf.setTextColor(17, 24, 39);
      pdf.text('Daily Nutrition Summary:', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.text(`Total Calories: ${dietPlan.totalCalories}`, 25, yPosition);
      yPosition += 6;
      pdf.text(`Protein: ${dietPlan.macros.protein}g`, 25, yPosition);
      yPosition += 6;
      pdf.text(`Carbohydrates: ${dietPlan.macros.carbs}g`, 25, yPosition);
      yPosition += 6;
      pdf.text(`Fat: ${dietPlan.macros.fat}g`, 25, yPosition);
      yPosition += 15;

      // Meals
      pdf.setFontSize(16);
      pdf.text('Meal Plan:', 20, yPosition);
      yPosition += 10;

      dietPlan.meals.forEach((meal, index) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(16, 185, 129);
        pdf.text(`${meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}: ${meal.name}`, 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setTextColor(75, 85, 99);
        pdf.text(`${meal.calories} calories | Prep time: ${meal.prepTime} min | Difficulty: ${meal.difficulty}`, 20, yPosition);
        yPosition += 8;

        pdf.text('Ingredients:', 20, yPosition);
        yPosition += 5;
        meal.ingredients.forEach(ingredient => {
          pdf.text(`• ${ingredient}`, 25, yPosition);
          yPosition += 4;
        });
        yPosition += 8;

        if (meal.instructions) {
          pdf.text('Instructions:', 20, yPosition);
          yPosition += 5;
          meal.instructions.forEach((instruction, i) => {
            pdf.text(`${i + 1}. ${instruction}`, 25, yPosition);
            yPosition += 4;
          });
        }
        yPosition += 10;
      });

      // Supplements
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(16);
      pdf.setTextColor(17, 24, 39);
      pdf.text('Recommended Supplements:', 20, yPosition);
      yPosition += 10;

      dietPlan.supplements.forEach(supplement => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(12);
        pdf.setTextColor(16, 185, 129);
        pdf.text(supplement.name, 20, yPosition);
        yPosition += 6;

        pdf.setFontSize(10);
        pdf.setTextColor(75, 85, 99);
        pdf.text(`Dosage: ${supplement.dosage}`, 20, yPosition);
        yPosition += 4;
        pdf.text(`Timing: ${supplement.timing}`, 20, yPosition);
        yPosition += 4;
        pdf.text(`Benefits: ${supplement.benefits.join(', ')}`, 20, yPosition);
        yPosition += 10;
      });

      pdf.save(`VitalPlan-Diet-Plan-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Generating Your Personalized Plan</h3>
          <p className="text-gray-600">Our AI is analyzing your goals and preferences...</p>
        </div>
      </div>
    );
  }

  if (!dietPlan) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready to Create Your Plan?</h3>
          <p className="text-gray-600 mb-6">Click below to generate your personalized diet plan based on your goals.</p>
          <button
            onClick={generatePlan}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
          >
            Generate Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Personalized Diet Plan</h2>
            <p className="text-gray-600">Generated on {dietPlan.generatedAt.toLocaleDateString()}</p>
          </div>
          <div className="mt-4 lg:mt-0 flex flex-wrap gap-3">
            <button
              onClick={generatePlan}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </button>
            <button
              onClick={downloadPDF}
              disabled={isDownloading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={handleAddAllToCart}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add All to Cart
            </button>
          </div>
        </div>

        {/* Enhanced Nutrition Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{dietPlan.totalCalories}</div>
            <div className="text-sm text-gray-600">Total Calories</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{dietPlan.macros.protein}g</div>
            <div className="text-sm text-gray-600">Protein</div>
            <div className="text-xs text-gray-500">{Math.round((dietPlan.macros.protein * 4 / dietPlan.totalCalories) * 100)}%</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{dietPlan.macros.carbs}g</div>
            <div className="text-sm text-gray-600">Carbs</div>
            <div className="text-xs text-gray-500">{Math.round((dietPlan.macros.carbs * 4 / dietPlan.totalCalories) * 100)}%</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{dietPlan.macros.fat}g</div>
            <div className="text-sm text-gray-600">Fat</div>
            <div className="text-xs text-gray-500">{Math.round((dietPlan.macros.fat * 9 / dietPlan.totalCalories) * 100)}%</div>
          </div>
        </div>
      </div>

      {/* Goals Summary */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Targeting Your Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <div key={goal.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="font-medium text-gray-900 flex-1">{goal.title}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {goal.priority}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setSelectedTab('meals')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            selectedTab === 'meals'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Meal Plan ({dietPlan.meals.length})
        </button>
        <button
          onClick={() => setSelectedTab('supplements')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            selectedTab === 'supplements'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Supplements ({dietPlan.supplements.length})
        </button>
      </div>

      {/* Content */}
      {selectedTab === 'meals' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dietPlan.meals.map((meal) => (
            <div key={meal.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="relative">
                <img
                  src={meal.imageUrl}
                  alt={meal.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                    meal.type === 'breakfast' ? 'bg-yellow-500' :
                    meal.type === 'lunch' ? 'bg-blue-500' :
                    meal.type === 'dinner' ? 'bg-purple-500' :
                    'bg-green-500'
                  }`}>
                    {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                    meal.difficulty === 'easy' ? 'bg-green-500' :
                    meal.difficulty === 'medium' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}>
                    {meal.difficulty}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{meal.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{meal.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {meal.prepTime} min
                  </div>
                  <div className="flex items-center">
                    <ChefHat className="w-4 h-4 mr-1" />
                    {meal.calories} cal
                  </div>
                  <button
                    onClick={() => setSelectedMeal(meal)}
                    className="flex items-center text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-red-50 rounded-lg">
                    <div className="font-semibold text-red-600">{meal.macros.protein}g</div>
                    <div className="text-xs text-gray-600">Protein</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-blue-600">{meal.macros.carbs}g</div>
                    <div className="text-xs text-gray-600">Carbs</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded-lg">
                    <div className="font-semibold text-yellow-600">{meal.macros.fat}g</div>
                    <div className="text-xs text-gray-600">Fat</div>
                  </div>
                </div>

                <button
                  onClick={() => onAddToCart([{
                    id: meal.id,
                    name: `Ingredients for ${meal.name}`,
                    type: 'grocery',
                    price: Math.round(meal.calories * 0.015 * 100) / 100,
                    quantity: 1
                  }])}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add Ingredients to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dietPlan.supplements.map((supplement) => (
            <div key={supplement.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="relative">
                <img
                  src={supplement.imageUrl}
                  alt={supplement.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2">
                  <div className="flex items-center">
                    <div className="flex text-yellow-400 mr-1">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-3 h-3 ${i < Math.floor(supplement.rating || 0) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">({supplement.reviews})</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{supplement.name}</h3>
                  <div className="text-right">
                    <div className="text-xl font-bold text-emerald-600">${supplement.price}</div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-3">{supplement.description}</p>
                
                {supplement.brand && (
                  <div className="text-xs text-gray-500 mb-3">by {supplement.brand}</div>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Dosage:</span>
                    <span className="text-gray-600">{supplement.dosage}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Timing:</span>
                    <span className="text-gray-600">{supplement.timing}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Benefits:</h4>
                  <div className="flex flex-wrap gap-1">
                    {supplement.benefits.slice(0, 3).map((benefit, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full"
                      >
                        {benefit}
                      </span>
                    ))}
                    {supplement.benefits.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{supplement.benefits.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onAddToCart([{
                    id: supplement.id,
                    name: supplement.name,
                    type: 'supplement',
                    price: supplement.price,
                    quantity: 1
                  }])}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img
                src={selectedMeal.imageUrl}
                alt={selectedMeal.name}
                className="w-full h-64 object-cover rounded-t-2xl"
              />
              <button
                onClick={() => setSelectedMeal(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-center space-x-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedMeal.type === 'breakfast' ? 'bg-yellow-100 text-yellow-800' :
                  selectedMeal.type === 'lunch' ? 'bg-blue-100 text-blue-800' :
                  selectedMeal.type === 'dinner' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {selectedMeal.type.charAt(0).toUpperCase() + selectedMeal.type.slice(1)}
                </span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  selectedMeal.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  selectedMeal.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedMeal.difficulty}
                </span>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">{selectedMeal.name}</h2>
              <p className="text-gray-600 mb-6">{selectedMeal.description}</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Ingredients</h3>
                  <ul className="space-y-2">
                    {selectedMeal.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                        {ingredient}
                      </li>
                    ))}
                  </ul>

                  {selectedMeal.instructions && (
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h3>
                      <ol className="space-y-3">
                        {selectedMeal.instructions.map((instruction, index) => (
                          <li key={index} className="flex text-gray-700">
                            <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                              {index + 1}
                            </span>
                            {instruction}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Nutrition Information</h3>
                  
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{selectedMeal.calories}</div>
                        <div className="text-sm text-gray-600">Calories</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{selectedMeal.prepTime}</div>
                        <div className="text-sm text-gray-600">Minutes</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="font-semibold text-red-600">{selectedMeal.macros.protein}g</div>
                        <div className="text-xs text-gray-600">Protein</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="font-semibold text-blue-600">{selectedMeal.macros.carbs}g</div>
                        <div className="text-xs text-gray-600">Carbs</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="font-semibold text-yellow-600">{selectedMeal.macros.fat}g</div>
                        <div className="text-xs text-gray-600">Fat</div>
                      </div>
                    </div>
                  </div>

                  {selectedMeal.nutritionDetails && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Vitamins</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(selectedMeal.nutritionDetails.vitamins).map(([vitamin, amount]) => (
                            <div key={vitamin} className="flex justify-between">
                              <span className="text-gray-600">{vitamin}:</span>
                              <span className="font-medium">{amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Minerals</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(selectedMeal.nutritionDetails.minerals).map(([mineral, amount]) => (
                            <div key={mineral} className="flex justify-between">
                              <span className="text-gray-600">{mineral}:</span>
                              <span className="font-medium">{amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Other Nutrients</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fiber:</span>
                            <span className="font-medium">{selectedMeal.nutritionDetails.fiber}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Sugar:</span>
                            <span className="font-medium">{selectedMeal.nutritionDetails.sugar}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Sodium:</span>
                            <span className="font-medium">{selectedMeal.nutritionDetails.sodium}mg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cholesterol:</span>
                            <span className="font-medium">{selectedMeal.nutritionDetails.cholesterol}mg</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    onAddToCart([{
                      id: selectedMeal.id,
                      name: `Ingredients for ${selectedMeal.name}`,
                      type: 'grocery',
                      price: Math.round(selectedMeal.calories * 0.015 * 100) / 100,
                      quantity: 1
                    }]);
                    setSelectedMeal(null);
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add Ingredients to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
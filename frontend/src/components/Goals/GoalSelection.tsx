import React, { useState } from 'react';
import { Target, Sparkles, Heart, Shield, ArrowRight } from 'lucide-react';
import type { Goal } from '../../types';

interface GoalSelectionProps {
  selectedGoals: Goal[];
  onGoalsChange: (goals: Goal[]) => void;
  onNext: () => void;
}

const goalOptions = [
  {
    id: 'muscle-building',
    title: 'Building Muscle',
    description: 'Optimize your nutrition for muscle growth and recovery',
    icon: Target,
    color: 'from-red-500 to-orange-500',
    bgColor: 'from-red-50 to-orange-50',
    benefits: ['High protein recommendations', 'Pre/post workout meals', 'Muscle recovery foods']
  },
  {
    id: 'glowing-skin',
    title: 'Glowing Skin',
    description: 'Nourish your skin from within with targeted nutrition',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'from-pink-50 to-rose-50',
    benefits: ['Antioxidant-rich foods', 'Hydration guidance', 'Anti-inflammatory diet']
  },
  {
    id: 'healthy-aging',
    title: 'Healthy Aging',
    description: 'Support longevity and vitality through smart nutrition choices',
    icon: Heart,
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'from-purple-50 to-indigo-50',
    benefits: ['Brain-boosting nutrients', 'Bone health support', 'Cellular protection']
  },
  {
    id: 'health-conditions',
    title: 'Managing Health Conditions',
    description: 'Dietary support for specific health concerns and conditions',
    icon: Shield,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'from-emerald-50 to-teal-50',
    benefits: ['Condition-specific plans', 'Symptom management', 'Medical compliance']
  }
];

export default function GoalSelection({ selectedGoals, onGoalsChange, onNext }: GoalSelectionProps) {
  const [priorities, setPriorities] = useState<Record<string, 'low' | 'medium' | 'high'>>({});

  const handleGoalToggle = (goalOption: typeof goalOptions[0]) => {
    const isSelected = selectedGoals.some(g => g.type === goalOption.id);
    
    if (isSelected) {
      const updatedGoals = selectedGoals.filter(g => g.type !== goalOption.id);
      onGoalsChange(updatedGoals);
      setPriorities(prev => {
        const { [goalOption.id]: removed, ...rest } = prev;
        return rest;
      });
    } else {
      const newGoal: Goal = {
        id: `goal-${Date.now()}-${goalOption.id}`,
        type: goalOption.id as any,
        title: goalOption.title,
        description: goalOption.description,
        priority: 'medium'
      };
      onGoalsChange([...selectedGoals, newGoal]);
      setPriorities(prev => ({ ...prev, [goalOption.id]: 'medium' }));
    }
  };

  const handlePriorityChange = (goalId: string, priority: 'low' | 'medium' | 'high') => {
    setPriorities(prev => ({ ...prev, [goalId]: priority }));
    
    const updatedGoals = selectedGoals.map(goal => 
      goal.type === goalId ? { ...goal, priority } : goal
    );
    onGoalsChange(updatedGoals);
  };

  const canProceed = selectedGoals.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Wellness Goals</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select the goals that matter most to you. We'll create a personalized diet plan 
          to help you achieve them.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {goalOptions.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedGoals.some(g => g.type === goal.id);
          
          return (
            <div
              key={goal.id}
              className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                isSelected
                  ? `bg-gradient-to-br ${goal.bgColor} border-2 border-transparent ring-2 ring-emerald-500 shadow-lg`
                  : 'bg-white border-2 border-gray-200 hover:border-gray-300 shadow-md'
              }`}
              onClick={() => handleGoalToggle(goal)}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${goal.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{goal.title}</h3>
                  <p className="text-gray-600 mb-4">{goal.description}</p>
                  
                  <div className="space-y-2">
                    {goal.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></div>
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
                
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>

              {isSelected && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Priority Level
                  </label>
                  <div className="flex space-x-3">
                    {['low', 'medium', 'high'].map((priority) => (
                      <button
                        key={priority}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePriorityChange(goal.id, priority as any);
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          priorities[goal.id] === priority
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedGoals.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Goals Summary</h3>
          <div className="space-y-3">
            {selectedGoals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{goal.title}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                  goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {goal.priority} priority
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center mt-8">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
            canProceed
              ? 'text-white bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500'
              : 'text-gray-400 bg-gray-200 cursor-not-allowed'
          }`}
        >
          Generate My Diet Plan
          <ArrowRight className="ml-2 w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
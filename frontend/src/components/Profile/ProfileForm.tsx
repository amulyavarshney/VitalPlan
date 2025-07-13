import React, { useState } from 'react';
import { User, Save, AlertCircle, Camera, MapPin, Edit3 } from 'lucide-react';
import type { User as UserType } from '../../types';

interface ProfileFormProps {
  user?: UserType;
  onSave: (userData: Partial<UserType>) => void;
  onNext?: () => void;
}

const avatarOptions = [
  'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
];

export default function ProfileForm({ user, onSave, onNext }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    age: user?.age || '',
    height: user?.height || '',
    weight: user?.weight || '',
    gender: user?.gender || 'other',
    activityLevel: user?.activityLevel || 'moderate',
    dietaryRestrictions: user?.dietaryRestrictions || [],
    allergies: user?.allergies || [],
    avatar: user?.avatar || avatarOptions[0],
    bio: user?.bio || '',
    location: user?.location || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Mediterranean', 
    'Low-Carb', 'Gluten-Free', 'Dairy-Free', 'Intermittent Fasting'
  ];

  const allergyOptions = [
    'Nuts', 'Dairy', 'Eggs', 'Fish', 'Shellfish', 'Soy', 'Wheat', 'Sesame'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.age || Number(formData.age) < 13 || Number(formData.age) > 120) {
      newErrors.age = 'Please enter a valid age between 13 and 120';
    }
    if (!formData.height || Number(formData.height) < 100 || Number(formData.height) > 250) {
      newErrors.height = 'Please enter a valid height in cm';
    }
    if (!formData.weight || Number(formData.weight) < 30 || Number(formData.weight) > 300) {
      newErrors.weight = 'Please enter a valid weight in kg';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        age: Number(formData.age),
        height: Number(formData.height),
        weight: Number(formData.weight),
      } as Partial<UserType>);
      
      if (onNext) {
        onNext();
      }
    }
  };

  const handleArrayToggle = (field: 'dietaryRestrictions' | 'allergies', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const getBMI = () => {
    if (formData.height && formData.weight) {
      const heightInM = Number(formData.height) / 100;
      const bmi = Number(formData.weight) / (heightInM * heightInM);
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header with Avatar */}
        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 px-8 py-12 text-white relative">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              <img
                src={formData.avatar}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <button
                onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shadow-lg"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold mb-2">
                {formData.name || 'Your Profile'}
              </h2>
              <p className="text-emerald-100 mb-2">
                {formData.bio || 'Tell us about yourself to get personalized recommendations'}
              </p>
              {formData.location && (
                <div className="flex items-center justify-center md:justify-start text-emerald-100">
                  <MapPin className="w-4 h-4 mr-1" />
                  {formData.location}
                </div>
              )}
            </div>
          </div>

          {/* BMI Display */}
          {getBMI() && (
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{getBMI()}</div>
              <div className="text-xs text-emerald-100">BMI</div>
            </div>
          )}
        </div>

        {/* Avatar Selector */}
        {showAvatarSelector && (
          <div className="p-6 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Avatar</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {avatarOptions.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, avatar }));
                    setShowAvatarSelector(false);
                  }}
                  className={`w-16 h-16 rounded-full object-cover border-2 transition-all hover:scale-110 ${
                    formData.avatar === avatar ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200'
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full rounded-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-emerald-600" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  rows={3}
                  placeholder="Tell us about your health goals and lifestyle..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="City, Country"
                />
              </div>
            </div>
          </div>

          {/* Physical Details */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Physical Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    errors.age ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="25"
                  min="13"
                  max="120"
                />
                {errors.age && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.age}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm) *
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    errors.height ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="170"
                  min="100"
                  max="250"
                />
                {errors.height && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.height}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    errors.weight ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="70"
                  min="30"
                  max="300"
                />
                {errors.weight && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.weight}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* BMI Info */}
            {getBMI() && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600">Your BMI: </span>
                    <span className="font-semibold text-gray-900">{getBMI()}</span>
                  </div>
                  <div className={`font-medium ${getBMICategory(Number(getBMI())).color}`}>
                    {getBMICategory(Number(getBMI())).category}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Activity Level
            </label>
            <select
              value={formData.activityLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, activityLevel: e.target.value as any }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="sedentary">Sedentary (little/no exercise)</option>
              <option value="light">Light (light exercise 1-3 days/week)</option>
              <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
              <option value="active">Active (hard exercise 6-7 days/week)</option>
              <option value="very-active">Very Active (very hard exercise/physical job)</option>
            </select>
          </div>

          {/* Dietary Restrictions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dietary Preferences
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {dietaryOptions.map((option) => (
                <label key={option} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.dietaryRestrictions.includes(option)}
                    onChange={() => handleArrayToggle('dietaryRestrictions', option)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Food Allergies
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {allergyOptions.map((option) => (
                <label key={option} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.allergies.includes(option)}
                    onChange={() => handleArrayToggle('allergies', option)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Save className="w-5 h-5 mr-2" />
              {onNext ? 'Save & Continue' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
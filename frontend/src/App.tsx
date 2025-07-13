import React, { useState } from 'react';
import Header from './components/Layout/Header';
import Hero from './components/Home/Hero';
import ProfileForm from './components/Profile/ProfileForm';
import GoalSelection from './components/Goals/GoalSelection';
import DietPlan from './components/Plans/DietPlan';
import OrderSystem from './components/Orders/OrderSystem';
import Marketplace from './components/Marketplace/Marketplace';
import FoodScanner from './components/Scanner/FoodScanner';
import type { User, Goal, OrderItem, Order } from './types';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [onboardingStep, setOnboardingStep] = useState(0); // 0: profile, 1: goals, 2: complete

  const handleUserSave = (userData: Partial<User>) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name || '',
      email: userData.email || '',
      age: userData.age || 25,
      height: userData.height || 170,
      weight: userData.weight || 70,
      gender: userData.gender || 'other',
      activityLevel: userData.activityLevel || 'moderate',
      dietaryRestrictions: userData.dietaryRestrictions || [],
      allergies: userData.allergies || [],
      goals: [],
      createdAt: new Date(),
      avatar: userData.avatar,
      bio: userData.bio,
      location: userData.location
    };
    setUser(newUser);
  };

  const handleGetStarted = () => {
    setCurrentView('profile');
    setOnboardingStep(0);
  };

  const handleGoalsComplete = () => {
    setOnboardingStep(2);
    setCurrentView('plans');
  };

  const handleAddToCart = (items: any[]) => {
    const newItems: OrderItem[] = items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity || 1,
      price: item.price,
      type: item.type
    }));
    
    setCartItems(prev => {
      const updatedItems = [...prev];
      newItems.forEach(newItem => {
        const existingIndex = updatedItems.findIndex(item => item.id === newItem.id);
        if (existingIndex >= 0) {
          updatedItems[existingIndex].quantity += newItem.quantity;
        } else {
          updatedItems.push(newItem);
        }
      });
      return updatedItems;
    });
    
    // Show success message or redirect to orders
    alert(`${items.length} item(s) added to cart!`);
  };

  const handlePlaceOrder = (orderData: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `order-${Date.now()}`,
      createdAt: new Date()
    };
    setOrders(prev => [newOrder, ...prev]);
    alert('Order placed successfully!');
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <Hero onGetStarted={handleGetStarted} />;
      
      case 'profile':
        if (onboardingStep === 0) {
          return (
            <ProfileForm
              user={user}
              onSave={handleUserSave}
              onNext={() => setOnboardingStep(1)}
            />
          );
        } else if (onboardingStep === 1) {
          return (
            <GoalSelection
              selectedGoals={goals}
              onGoalsChange={setGoals}
              onNext={handleGoalsComplete}
            />
          );
        } else {
          return (
            <ProfileForm
              user={user}
              onSave={handleUserSave}
            />
          );
        }
      
      case 'plans':
        return (
          <DietPlan
            goals={goals}
            user={user}
            onAddToCart={handleAddToCart}
          />
        );

      case 'marketplace':
        return (
          <Marketplace
            onAddToCart={handleAddToCart}
          />
        );

      case 'scanner':
        return (
          <FoodScanner
            onAddToCart={handleAddToCart}
          />
        );
      
      case 'orders':
        return (
          <OrderSystem
            cartItems={cartItems}
            onUpdateCart={setCartItems}
            onPlaceOrder={handlePlaceOrder}
          />
        );
      
      default:
        return <Hero onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        cartItemsCount={getCartItemsCount()}
      />
      <main>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
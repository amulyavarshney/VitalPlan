import { useEffect, useState } from 'react';
import Header from './components/Layout/Header';
import Hero from './components/Home/Hero';
import ProfileForm from './components/Profile/ProfileForm';
import GoalSelection from './components/Goals/GoalSelection';
import DietPlan from './components/Plans/DietPlan';
import OrderSystem from './components/Orders/OrderSystem';
import Marketplace from './components/Marketplace/Marketplace';
import FoodScanner from './components/Scanner/FoodScanner';
import AuthForm from './components/Auth/AuthForm';
import { useAuth, getApiErrorMessage } from './hooks/useAuth';
import { goalsAPI, ordersAPI } from './services/api';
import type { User, Goal, OrderItem, Order } from './types';

function AppContent() {
  const { user, isAuthenticated, isLoading, updateProfile, toAppUser } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [, setOrders] = useState<Order[]>([]);
  const [onboardingStep, setOnboardingStep] = useState(0); // 0: profile, 1: goals, 2: complete
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const appUser = toAppUser();

  useEffect(() => {
    if (!isAuthenticated) {
      setGoals([]);
      return;
    }

    goalsAPI
      .getGoals()
      .then(setGoals)
      .catch(() => setGoals([]));

    ordersAPI
      .getOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [isAuthenticated]);

  const showMessage = (message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 3000);
  };

  const requireAuth = (view: string) => {
    if (!isAuthenticated && view !== 'home' && view !== 'auth') {
      setAuthMode('login');
      setCurrentView('auth');
      return;
    }
    setCurrentView(view);
  };

  const handleUserSave = async (userData: Partial<User>) => {
    await updateProfile({
      name: userData.name,
      age: userData.age,
      height: userData.height,
      weight: userData.weight,
      gender: userData.gender,
      activityLevel: userData.activityLevel,
      dietaryRestrictions: userData.dietaryRestrictions,
      allergies: userData.allergies,
      avatar: userData.avatar,
      bio: userData.bio,
      location: userData.location,
    });
    showMessage('Profile saved');
  };

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      setAuthMode('register');
      setCurrentView('auth');
      return;
    }
    setCurrentView('profile');
    setOnboardingStep(user?.age ? 1 : 0);
  };

  const handleGoalsComplete = async (selectedGoals: Goal[]) => {
    try {
      const existing = await goalsAPI.getGoals();
      const existingTypes = new Set(existing.map((g) => g.type));

      const created: Goal[] = [...existing];
      for (const goal of selectedGoals) {
        if (existingTypes.has(goal.type)) continue;
        const saved = await goalsAPI.createGoal({
          type: goal.type,
          title: goal.title,
          description: goal.description,
          priority: goal.priority,
        });
        created.push(saved);
      }

      setGoals(created.length ? created : selectedGoals);
      setOnboardingStep(2);
      setCurrentView('plans');
    } catch (error) {
      showMessage(getApiErrorMessage(error, 'Failed to save goals'));
      setGoals(selectedGoals);
      setOnboardingStep(2);
      setCurrentView('plans');
    }
  };

  const handleAddToCart = (items: OrderItem[]) => {
    const newItems: OrderItem[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity || 1,
      price: item.price,
      type: item.type,
    }));

    setCartItems((prev) => {
      const updatedItems = [...prev];
      newItems.forEach((newItem) => {
        const existingIndex = updatedItems.findIndex((item) => item.id === newItem.id);
        if (existingIndex >= 0) {
          updatedItems[existingIndex].quantity += newItem.quantity;
        } else {
          updatedItems.push(newItem);
        }
      });
      return updatedItems;
    });

    showMessage(`${items.length} item(s) added to cart`);
  };

  const handlePlaceOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>) => {
    try {
      const result = await ordersAPI.createOrder({
        items: orderData.items,
        total: orderData.total,
        vendor: orderData.vendor,
        deliveryAddress: orderData.deliveryAddress,
        paymentMethod: orderData.paymentMethod || 'card',
      });

      const newOrder: Order = {
        ...orderData,
        id: result.order_id,
        createdAt: new Date(),
        status: (result.status as Order['status']) || 'pending',
      };
      setOrders((prev) => [newOrder, ...prev]);
      showMessage('Order placed successfully');
    } catch (error) {
      showMessage(getApiErrorMessage(error, 'Failed to place order'));
      throw error;
    }
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center text-gray-600">
          Loading...
        </div>
      );
    }

    switch (currentView) {
      case 'home':
        return <Hero onGetStarted={handleGetStarted} />;

      case 'auth':
        return (
          <AuthForm
            initialMode={authMode}
            onSuccess={() => {
              setCurrentView('profile');
              setOnboardingStep(0);
            }}
          />
        );

      case 'profile':
        if (!isAuthenticated) {
          return <AuthForm initialMode="login" onSuccess={() => setCurrentView('profile')} />;
        }
        if (onboardingStep === 0) {
          return (
            <ProfileForm
              user={appUser}
              onSave={handleUserSave}
              onNext={() => setOnboardingStep(1)}
            />
          );
        }
        if (onboardingStep === 1) {
          return (
            <GoalSelection
              selectedGoals={goals}
              onGoalsChange={setGoals}
              onNext={handleGoalsComplete}
            />
          );
        }
        return <ProfileForm user={appUser} onSave={handleUserSave} />;

      case 'plans':
        if (!isAuthenticated) {
          return <AuthForm initialMode="login" onSuccess={() => setCurrentView('plans')} />;
        }
        return (
          <DietPlan
            goals={goals}
            user={appUser}
            onAddToCart={handleAddToCart}
          />
        );

      case 'marketplace':
        if (!isAuthenticated) {
          return <AuthForm initialMode="login" onSuccess={() => setCurrentView('marketplace')} />;
        }
        return <Marketplace onAddToCart={handleAddToCart} />;

      case 'scanner':
        if (!isAuthenticated) {
          return <AuthForm initialMode="login" onSuccess={() => setCurrentView('scanner')} />;
        }
        return <FoodScanner onAddToCart={handleAddToCart} />;

      case 'orders':
        if (!isAuthenticated) {
          return <AuthForm initialMode="login" onSuccess={() => setCurrentView('orders')} />;
        }
        return (
          <OrderSystem
            cartItems={cartItems}
            onUpdateCart={setCartItems}
            onPlaceOrder={handlePlaceOrder}
            userId={appUser?.id || '0'}
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
        onViewChange={requireAuth}
        cartItemsCount={getCartItemsCount()}
      />
      {statusMessage && (
        <div className="fixed top-16 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
          <div className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-full shadow-lg">
            {statusMessage}
          </div>
        </div>
      )}
      <main>{renderContent()}</main>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}

import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import Header from './components/Layout/Header';
import Hero from './components/Home/Hero';
import ProfileForm from './components/Profile/ProfileForm';
import GoalSelection from './components/Goals/GoalSelection';
import DietPlan from './components/Plans/DietPlan';
import OrderSystem from './components/Orders/OrderSystem';
import Marketplace from './components/Marketplace/Marketplace';
import FoodScanner from './components/Scanner/FoodScanner';
import AuthForm from './components/Auth/AuthForm';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth, getApiErrorMessage } from './hooks/useAuth';
import { goalsAPI, ordersAPI } from './services/api';
import type { User, Goal, OrderItem, Order } from './types';

function AuthPage({ mode }: { mode: 'login' | 'register' | 'reset' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || undefined;

  return (
    <AuthForm
      initialMode={mode}
      initialResetToken={token}
      onSuccess={() => navigate('/profile', { replace: true })}
    />
  );
}

function ProfilePage({
  goals,
  setGoals,
  onboardingStep,
  setOnboardingStep,
  showMessage,
}: {
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  showMessage: (message: string) => void;
}) {
  const navigate = useNavigate();
  const { updateProfile, toAppUser } = useAuth();
  const appUser = toAppUser();

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
      navigate('/plans');
    } catch (error) {
      showMessage(getApiErrorMessage(error, 'Failed to save goals'));
      setGoals(selectedGoals);
      setOnboardingStep(2);
      navigate('/plans');
    }
  };

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
}

function AppContent() {
  const { user, isAuthenticated, isLoading, toAppUser } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [, setOrders] = useState<Order[]>([]);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (isAuthenticated && user?.age) {
      setOnboardingStep((step) => (step === 0 ? 1 : step));
    }
  }, [isAuthenticated, user?.age]);

  const showMessage = (message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    setOnboardingStep(user?.age ? 1 : 0);
    navigate('/profile');
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

  const handleOrderComplete = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    showMessage(
      order.paymentProvider === 'demo'
        ? 'Order placed and paid (demo payment)'
        : 'Order placed and payment confirmed'
    );
  };

  const getCartItemsCount = () => cartItems.reduce((total, item) => total + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header cartItemsCount={0} />
        <div className="min-h-[50vh] flex items-center justify-center text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartItemsCount={getCartItemsCount()} />
      {statusMessage && (
        <div className="fixed top-16 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
          <div className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-full shadow-lg">
            {statusMessage}
          </div>
        </div>
      )}
      <main>
        <Routes>
          <Route path="/" element={<Hero onGetStarted={handleGetStarted} />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/reset-password" element={<AuthPage mode="reset" />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage
                  goals={goals}
                  setGoals={setGoals}
                  onboardingStep={onboardingStep}
                  setOnboardingStep={setOnboardingStep}
                  showMessage={showMessage}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plans"
            element={
              <ProtectedRoute>
                <DietPlan goals={goals} user={appUser} onAddToCart={handleAddToCart} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <Marketplace onAddToCart={handleAddToCart} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scanner"
            element={
              <ProtectedRoute>
                <FoodScanner onAddToCart={handleAddToCart} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderSystem
                  cartItems={cartItems}
                  onUpdateCart={setCartItems}
                  userId={appUser?.id || '0'}
                  onOrderComplete={handleOrderComplete}
                />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}

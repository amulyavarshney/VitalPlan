import axios, { AxiosError } from 'axios';
import { keysToCamel, keysToSnake } from '../utils/case';
import type {
  User,
  Goal,
  DietPlan,
  MarketplaceItem,
  ScannedFood,
  Order,
  OrderItem,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        original._retry = true;
        try {
          const refreshed = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token } = refreshed.data;
          localStorage.setItem('access_token', access_token);
          if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token);
          }
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${access_token}`;
          return api(original);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.dispatchEvent(new Event('auth:logout'));
        }
      } else {
        localStorage.removeItem('access_token');
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const nested = data?.error;
    if (typeof nested?.message === 'string') return nested.message;
    const detail = data?.detail ?? nested?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg || JSON.stringify(item)).join(', ');
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export interface AuthUser extends Omit<User, 'id' | 'goals' | 'createdAt'> {
  id: number;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt?: string | null;
  goals?: Goal[];
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  age?: number;
  height?: number;
  weight?: number;
  gender?: string;
  activityLevel?: string;
  dietaryRestrictions?: string[];
  allergies?: string[];
  avatar?: string;
  bio?: string;
  location?: string;
}

export const authAPI = {
  register: async (userData: RegisterPayload) => {
    const response = await api.post('/auth/register', keysToSnake(userData));
    return keysToCamel<AuthUser>(response.data);
  },
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data as {
      access_token: string;
      refresh_token?: string;
      token_type: string;
    };
  },
  refresh: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data as {
      access_token: string;
      refresh_token?: string;
      token_type: string;
    };
  },
  requestPasswordReset: async (email: string) => {
    const response = await api.post('/auth/password-reset/request', { email });
    return response.data as {
      message: string;
      reset_token?: string;
      reset_url?: string;
      delivery?: string;
      note?: string;
    };
  },
  confirmPasswordReset: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/password-reset/confirm', {
      token,
      new_password: newPassword,
    });
    return response.data as { message: string };
  },
};

export const usersAPI = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return keysToCamel<AuthUser>(response.data);
  },
  updateProfile: async (userData: Partial<RegisterPayload>) => {
    const response = await api.put('/users/me', keysToSnake(userData));
    return keysToCamel<AuthUser>(response.data);
  },
  deleteAccount: () => api.delete('/users/me'),
};

export const goalsAPI = {
  getGoals: async () => {
    const response = await api.get('/goals/');
    return keysToCamel<Goal[]>(response.data);
  },
  createGoal: async (goalData: Omit<Goal, 'id'> & { type: string }) => {
    const response = await api.post('/goals/', keysToSnake({
      type: goalData.type,
      title: goalData.title,
      description: goalData.description,
      priority: goalData.priority,
      targetDate: goalData.targetDate,
    }));
    return keysToCamel<Goal>(response.data);
  },
  updateGoal: async (goalId: number | string, goalData: Partial<Goal>) => {
    const response = await api.put(`/goals/${goalId}`, keysToSnake(goalData));
    return keysToCamel<Goal>(response.data);
  },
  deleteGoal: async (goalId: number | string) => {
    await api.delete(`/goals/${goalId}`);
  },
};

export const dietPlansAPI = {
  getPlans: async () => {
    const response = await api.get('/diet-plans/');
    return keysToCamel<DietPlan[]>(response.data);
  },
  generatePlan: async (planData: { goals: Array<Record<string, unknown>>; preferences?: Record<string, unknown> }) => {
    const response = await api.post('/diet-plans/generate', planData);
    return keysToCamel<DietPlan>(response.data);
  },
  getPlan: async (planId: number | string) => {
    const response = await api.get(`/diet-plans/${planId}`);
    return keysToCamel<DietPlan>(response.data);
  },
  updatePlan: async (planId: number | string, planData: Partial<DietPlan>) => {
    const response = await api.put(`/diet-plans/${planId}`, keysToSnake(planData));
    return keysToCamel<DietPlan>(response.data);
  },
  deletePlan: async (planId: number | string) => {
    await api.delete(`/diet-plans/${planId}`);
  },
};

export const scannerAPI = {
  analyzeImage: async (imageFile: File) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    const response = await api.post('/scanner/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return keysToCamel<ScannedFood & { foodName: string; servingSize: string; imageProcessed?: boolean }>(response.data);
  },
  getHistory: async (limit?: number) => {
    const response = await api.get('/scanner/history', { params: { limit } });
    return keysToCamel<ScannedFood[]>(response.data);
  },
  deleteScan: async (scanId: number) => {
    await api.delete(`/scanner/history/${scanId}`);
  },
  scanBarcode: async (barcode: string) => {
    const response = await api.post(`/scanner/barcode/${barcode}`);
    return keysToCamel<ScannedFood & { foodName: string; servingSize: string; imageProcessed?: boolean }>(response.data);
  },
};

export const marketplaceAPI = {
  getItems: async (params?: {
    category?: string;
    search?: string;
    sort_by?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/marketplace/items', { params });
    const data = keysToCamel<{
      items: MarketplaceItem[];
      total: number;
      limit: number;
      offset: number;
    }>(response.data);
    return data;
  },
  getItem: async (itemId: string) => {
    const response = await api.get(`/marketplace/items/${itemId}`);
    return keysToCamel<MarketplaceItem>(response.data);
  },
  getCategories: async () => {
    const response = await api.get('/marketplace/categories');
    return keysToCamel(response.data);
  },
  getRecommendations: async (limit?: number) => {
    const response = await api.get('/marketplace/recommendations', { params: { limit } });
    return keysToCamel<{ recommendations: MarketplaceItem[]; reason: string }>(response.data);
  },
};

export const ordersAPI = {
  getPaymentConfig: async () => {
    const response = await api.get('/orders/payments/config');
    return keysToCamel<{
      provider: string;
      publishableKey?: string | null;
      stripeEnabled: boolean;
    }>(response.data);
  },
  createOrder: async (orderData: {
    items: OrderItem[];
    total: number;
    vendor: string;
    deliveryAddress?: string;
    paymentMethod?: string;
  }) => {
    const response = await api.post('/orders/', keysToSnake(orderData));
    return response.data as {
      message: string;
      order_id: number;
      status: string;
      payment_status: string;
      payment: {
        provider: string;
        payment_intent_id: string;
        client_secret?: string;
        publishable_key?: string;
        status: string;
      };
    };
  },
  payOrder: async (orderId: number, paymentIntentId?: string) => {
    const response = await api.post(`/orders/${orderId}/pay`, {
      payment_intent_id: paymentIntentId,
    });
    return keysToCamel<Order>(response.data);
  },
  getOrders: async () => {
    const response = await api.get('/orders/');
    return keysToCamel<Order[]>(response.data);
  },
  getOrder: async (orderId: number) => {
    const response = await api.get(`/orders/${orderId}`);
    return keysToCamel<Order>(response.data);
  },
  updateOrderStatus: async (orderId: number, status: string) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },
};

export default api;

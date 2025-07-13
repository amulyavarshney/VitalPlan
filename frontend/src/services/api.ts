import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData: any) => api.post('/auth/register', userData),
  login: (credentials: any) => api.post('/auth/login', credentials),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (userData: any) => api.put('/users/me', userData),
  deleteAccount: () => api.delete('/users/me'),
};

// Goals API
export const goalsAPI = {
  getGoals: () => api.get('/goals'),
  createGoal: (goalData: any) => api.post('/goals', goalData),
  updateGoal: (goalId: number, goalData: any) => api.put(`/goals/${goalId}`, goalData),
  deleteGoal: (goalId: number) => api.delete(`/goals/${goalId}`),
};

// Diet Plans API
export const dietPlansAPI = {
  getPlans: () => api.get('/diet-plans'),
  generatePlan: (planData: any) => api.post('/diet-plans/generate', planData),
  getPlan: (planId: number) => api.get(`/diet-plans/${planId}`),
  updatePlan: (planId: number, planData: any) => api.put(`/diet-plans/${planId}`, planData),
  deletePlan: (planId: number) => api.delete(`/diet-plans/${planId}`),
};

// Scanner API
export const scannerAPI = {
  analyzeImage: (imageFile: File) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    return api.post('/scanner/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getHistory: (limit?: number) => api.get('/scanner/history', { params: { limit } }),
  deleteScan: (scanId: number) => api.delete(`/scanner/history/${scanId}`),
  scanBarcode: (barcode: string) => api.post(`/scanner/barcode/${barcode}`),
};

// Marketplace API
export const marketplaceAPI = {
  getItems: (params?: any) => api.get('/marketplace/items', { params }),
  getItem: (itemId: string) => api.get(`/marketplace/items/${itemId}`),
  getCategories: () => api.get('/marketplace/categories'),
  getRecommendations: (limit?: number) => api.get('/marketplace/recommendations', { params: { limit } }),
};

// Orders API
export const ordersAPI = {
  createOrder: (orderData: any) => api.post('/orders', orderData),
  getOrders: () => api.get('/orders'),
  getOrder: (orderId: number) => api.get(`/orders/${orderId}`),
  updateOrderStatus: (orderId: number, status: string) => api.put(`/orders/${orderId}/status`, { status }),
};

export default api;
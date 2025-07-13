import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI, usersAPI } from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  age?: number;
  height?: number;
  weight?: number;
  gender?: string;
  activity_level?: string;
  dietary_restrictions?: string[];
  allergies?: string[];
  avatar?: string;
  bio?: string;
  location?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await usersAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('access_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    const { access_token } = response.data;
    localStorage.setItem('access_token', access_token);
    await loadUser();
  };

  const register = async (userData: any) => {
    const response = await authAPI.register(userData);
    setUser(response.data);
    // Auto-login after registration
    await login(userData.email, userData.password);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const updateProfile = async (userData: any) => {
    const response = await usersAPI.updateProfile(userData);
    setUser(response.data);
  };

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };
};

export { AuthContext };
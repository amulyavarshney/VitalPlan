import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import {
  authAPI,
  usersAPI,
  getApiErrorMessage,
  type AuthUser,
  type RegisterPayload,
  type RegisterResult,
} from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterPayload) => Promise<RegisterResult>;
  logout: () => void;
  updateProfile: (userData: Partial<RegisterPayload>) => Promise<void>;
  toAppUser: () => User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function mapToAppUser(user: AuthUser): User {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    age: user.age || 25,
    height: user.height || 170,
    weight: user.weight || 70,
    gender: (user.gender as User['gender']) || 'other',
    activityLevel: (user.activityLevel as User['activityLevel']) || 'moderate',
    dietaryRestrictions: user.dietaryRestrictions || [],
    allergies: user.allergies || [],
    goals: user.goals || [],
    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
    avatar: user.avatar,
    bio: user.bio,
    location: user.location,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const profile = await usersAPI.getProfile();
      setUser(profile);
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      loadUser();
    } else {
      setIsLoading(false);
    }

    const handleLogout = () => {
      localStorage.removeItem('refresh_token');
      setUser(null);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const tokens = await authAPI.login({ email, password });
    localStorage.setItem('access_token', tokens.access_token);
    if (tokens.refresh_token) {
      localStorage.setItem('refresh_token', tokens.refresh_token);
    }
    setIsLoading(true);
    await loadUser();
  };

  const register = async (userData: RegisterPayload) => {
    const result = await authAPI.register(userData);
    if (!result.verificationRequired) {
      await login(userData.email, userData.password);
    }
    return result;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const updateProfile = async (userData: Partial<RegisterPayload>) => {
    const updated = await usersAPI.updateProfile(userData);
    setUser(updated);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    toAppUser: () => (user ? mapToAppUser(user) : null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { getApiErrorMessage };

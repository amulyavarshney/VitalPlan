import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import {
  authAPI,
  usersAPI,
  adminAPI,
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
  isSpoofing: boolean;
  spoofAdminEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterPayload) => Promise<RegisterResult>;
  logout: () => void;
  updateProfile: (userData: Partial<RegisterPayload>) => Promise<void>;
  spoofUser: (email: string) => Promise<void>;
  exitSpoof: () => Promise<void>;
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
  const [spoofAdminEmail, setSpoofAdminEmail] = useState<string | null>(
    () => localStorage.getItem('spoof_admin_email')
  );

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
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      void authAPI.logout(refreshToken).catch(() => undefined);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('spoof_admin_email');
    setSpoofAdminEmail(null);
    setUser(null);
  };

  const updateProfile = async (userData: Partial<RegisterPayload>) => {
    const updated = await usersAPI.updateProfile(userData);
    setUser(updated);
  };

  const spoofUser = async (email: string) => {
    if (!user?.isAdmin) {
      throw new Error('Admin access required');
    }
    const tokens = await adminAPI.spoofUser(email);
    localStorage.setItem('admin_access_token', localStorage.getItem('access_token') || '');
    localStorage.setItem('admin_refresh_token', localStorage.getItem('refresh_token') || '');
    localStorage.setItem('spoof_admin_email', user.email);
    localStorage.setItem('access_token', tokens.access_token);
    if (tokens.refresh_token) {
      localStorage.setItem('refresh_token', tokens.refresh_token);
    }
    setSpoofAdminEmail(user.email);
    setIsLoading(true);
    await loadUser();
  };

  const exitSpoof = async () => {
    const adminAccess = localStorage.getItem('admin_access_token');
    const adminRefresh = localStorage.getItem('admin_refresh_token');
    if (!adminAccess) {
      logout();
      return;
    }
    localStorage.setItem('access_token', adminAccess);
    if (adminRefresh) {
      localStorage.setItem('refresh_token', adminRefresh);
    } else {
      localStorage.removeItem('refresh_token');
    }
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('spoof_admin_email');
    setSpoofAdminEmail(null);
    setIsLoading(true);
    await loadUser();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isSpoofing: !!spoofAdminEmail,
    spoofAdminEmail,
    login,
    register,
    logout,
    updateProfile,
    spoofUser,
    exitSpoof,
    toAppUser: () => (user ? mapToAppUser(user) : null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { getApiErrorMessage };

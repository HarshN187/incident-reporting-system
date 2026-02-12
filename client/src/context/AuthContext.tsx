import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import type { User, LoginCredentials, RegisterData } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('accessToken')
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await authService.getCurrentUser();
          setUser(response.data!);
          setIsAuthenticated(true);
        } catch (error: any) {
          console.error('Auth initialization failed:', error);
          // Token might be expired, try refresh
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              await handleTokenRefresh();
            } catch (refreshError) {
              logout();
            }
          } else {
            logout();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const handleTokenRefresh = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await authService.refreshToken(refreshToken);
    const newAccessToken = response.data!.accessToken;

    setToken(newAccessToken);
    localStorage.setItem('accessToken', newAccessToken);

    // Fetch user data with new token
    const userResponse = await authService.getCurrentUser();
    setUser(userResponse.data!);
    setIsAuthenticated(true);
  };

  const login = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authService.login(credentials);

      if (response.success && response.data) {
        const { user: userData, tokens } = response.data;

        setToken(tokens.accessToken);
        setUser(userData);
        setIsAuthenticated(true);

        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);

        return { success: true };
      }

      return { success: false, message: response.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (
    data: RegisterData
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authService.register(data);

      if (response.success && response.data) {
        const { user: userData, tokens } = response.data;

        setToken(tokens.accessToken);
        setUser(userData);
        setIsAuthenticated(true);

        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);

        return { success: true };
      }

      return { success: false, message: response.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    }
  };

  const refreshAuth = async () => {
    await handleTokenRefresh();
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
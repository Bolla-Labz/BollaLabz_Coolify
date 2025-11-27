// Last Modified: 2025-11-23 17:30
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { secureLocalStorage } from '../../lib/security/storage';
import { authApi } from '../../lib/api/auth';
import type { AuthResponse } from '../../lib/api/auth';
import { websocketClient } from '../../lib/websocket/client';
import { useContactsStore } from '../../stores/contactsStore';
import { useTasksStore } from '../../stores/tasksStore';
import { useAuthStore } from '../../stores/authStore';

interface User {
  id: number;
  email: string;
  fullName: string;
  name?: string; // Alias for fullName, used in UI components
  avatar?: string; // Profile picture URL
  phoneNumber?: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state - check if user is authenticated via cookies
  useEffect(() => {
    const initAuth = async () => {
      const startTime = Date.now();

      try {
        // Try to get current user from API (cookies sent automatically)
        // If successful, user is authenticated via httpOnly cookies
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);

          // Store user info locally for quick access (NOT tokens!)
          secureLocalStorage.set('user', currentUser);

          // Initialize WebSocket connection
          websocketClient.connect();

          // Initialize store WebSocket listeners
          useContactsStore.getState().initializeWebSocket();
          useTasksStore.getState().initializeWebSocket();
        } catch (error) {
          // Not authenticated or token expired
          // Check if we have stored user (for offline state)
          const storedUser = secureLocalStorage.get<User>('user');
          if (storedUser) {
            // Attempt to use stored user but will fail on API calls
            setUser(storedUser);
          }
        }

        // Ensure minimum display time to prevent flickering
        const elapsed = Date.now() - startTime;
        const minDelay = 400; // 400ms minimum
        if (elapsed < minDelay) {
          await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });

      // Tokens are set in httpOnly cookies AND returned in response
      // Store tokens in authStore for WebSocket authentication
      if (response.accessToken && response.refreshToken) {
        useAuthStore.getState().setTokens(response.accessToken, response.refreshToken);
      }

      // Store user data locally
      secureLocalStorage.set('user', response.user);
      setUser(response.user);

      // Initialize WebSocket connection (now that tokens are in authStore)
      websocketClient.connect();

      // Initialize store WebSocket listeners
      useContactsStore.getState().initializeWebSocket();
      useTasksStore.getState().initializeWebSocket();

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Call logout endpoint - this will clear httpOnly cookies on server
      await authApi.logout();

      // Disconnect WebSocket
      websocketClient.disconnect();

      // Clear tokens from authStore
      useAuthStore.getState().logout();

      // Clear local user data
      secureLocalStorage.remove('user');

      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local data even if API call fails
      useAuthStore.getState().logout();
      secureLocalStorage.remove('user');
      setUser(null);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.register({ email, password, fullName });

      // Tokens are set in httpOnly cookies AND returned in response
      // Store tokens in authStore for WebSocket authentication
      if (response.accessToken && response.refreshToken) {
        useAuthStore.getState().setTokens(response.accessToken, response.refreshToken);
      }

      // Store user data locally
      secureLocalStorage.set('user', response.user);
      setUser(response.user);

      // Initialize WebSocket connection (now that tokens are in authStore)
      websocketClient.connect();

      // Initialize store WebSocket listeners
      useContactsStore.getState().initializeWebSocket();
      useTasksStore.getState().initializeWebSocket();

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw new Error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    secureLocalStorage.set('user', updatedUser);
    setUser(updatedUser);
  }, [user]);

  const refreshToken = useCallback(async () => {
    // Refresh token is now in httpOnly cookie - just call the endpoint
    try {
      await authApi.refreshToken();
      // New access token is set as httpOnly cookie automatically
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      throw error;
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    updateUser,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
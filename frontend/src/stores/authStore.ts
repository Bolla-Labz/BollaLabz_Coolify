// Last Modified: 2025-11-24 12:24
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { secureLocalStorage } from '../lib/security/storage';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user';
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    emailDigest?: boolean;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  updatePreferences: (preferences: Partial<User['preferences']>) => void;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
        }),

      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      updatePreferences: (preferences) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                preferences: {
                  ...state.user.preferences,
                  ...preferences,
                },
              }
            : null,
        })),
      }),
      {
        name: 'auth-storage',
        storage: {
          getItem: (name) => {
            const value = secureLocalStorage.get(name);
            return value ? JSON.stringify(value) : null;
          },
          setItem: (name, value) => {
            secureLocalStorage.set(name, JSON.parse(value));
          },
          removeItem: (name) => {
            secureLocalStorage.remove(name);
          },
        },
      }
    )
  )
);
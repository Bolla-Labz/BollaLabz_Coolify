// Last Modified: 2025-11-24 01:15
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthStore } from './authStore';

// Mock the API client
vi.mock('../lib/api/client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock secure storage
vi.mock('../lib/security/storage', () => ({
  secureStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.getState().logout();
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default values when no stored data exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should restore user from localStorage when available', () => {
      const storedUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'user') return JSON.stringify(storedUser);
        if (key === 'isAuthenticated') return 'true';
        return null;
      });

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toEqual(storedUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Login Flow', () => {
    it('should handle successful login with valid credentials', async () => {
      const { apiClient } = await import('../lib/api/client');
      const mockResponse = {
        user: { id: 1, email: 'test@example.com', name: 'Test User' },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', mockResponse.token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', mockResponse.refreshToken);
    });

    it('should handle login failure with invalid credentials', async () => {
      const { apiClient } = await import('../lib/api/client');
      const errorMessage = 'Invalid credentials';

      (apiClient.post as any).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('wrong@example.com', 'wrongpass');
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('authToken', expect.anything());
    });

    it('should set loading state during login process', async () => {
      const { apiClient } = await import('../lib/api/client');
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (apiClient.post as any).mockReturnValue(promise);

      const { result } = renderHook(() => useAuthStore());

      // Start login
      act(() => {
        result.current.login('test@example.com', 'password');
      });

      // Check loading state is true
      expect(result.current.loading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ user: { id: 1 }, token: 'token', refreshToken: 'refresh' });
        await promise;
      });

      // Check loading state is false after completion
      expect(result.current.loading).toBe(false);
    });

    it('should handle network errors during login', async () => {
      const { apiClient } = await import('../lib/api/client');
      (apiClient.post as any).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Logout Flow', () => {
    it('should clear all auth data on logout', async () => {
      // Setup authenticated state
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({ id: 1, email: 'test@example.com', name: 'Test' });
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Perform logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    it('should handle logout API errors gracefully', async () => {
      const { apiClient } = await import('../lib/api/client');
      (apiClient.post as any).mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({ id: 1, email: 'test@example.com', name: 'Test' });
      });

      // Logout should still clear local state even if API fails
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Token Management', () => {
    it('should refresh token when expired', async () => {
      const { apiClient } = await import('../lib/api/client');
      const newTokenResponse = {
        token: 'new-jwt-token',
        refreshToken: 'new-refresh-token',
      };

      (apiClient.post as any).mockResolvedValue(newTokenResponse);
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'refreshToken') return 'old-refresh-token';
        return null;
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'old-refresh-token',
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', newTokenResponse.token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', newTokenResponse.refreshToken);
    });

    it('should logout user when refresh token fails', async () => {
      const { apiClient } = await import('../lib/api/client');
      (apiClient.post as any).mockRejectedValue(new Error('Invalid refresh token'));

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({ id: 1, email: 'test@example.com', name: 'Test' });
      });

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should check token validity correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      // Test with no token
      localStorageMock.getItem.mockReturnValue(null);
      expect(result.current.isTokenValid()).toBe(false);

      // Test with expired token (mock JWT with past exp)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.test';
      localStorageMock.getItem.mockReturnValue(expiredToken);
      expect(result.current.isTokenValid()).toBe(false);

      // Test with valid token (mock JWT with future exp)
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: futureTimestamp }))}.test`;
      localStorageMock.getItem.mockReturnValue(validToken);
      expect(result.current.isTokenValid()).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should persist session data to localStorage', () => {
      const { result } = renderHook(() => useAuthStore());
      const userData = { id: 1, email: 'test@example.com', name: 'Test User' };

      act(() => {
        result.current.setUser(userData);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(userData));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('isAuthenticated', 'true');
    });

    it('should handle malformed stored user data', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'user') return 'invalid-json-{]';
        return null;
      });

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should clear error state when starting new login', async () => {
      const { apiClient } = await import('../lib/api/client');
      const { result } = renderHook(() => useAuthStore());

      // Set initial error
      act(() => {
        result.current.setError('Previous error');
      });
      expect(result.current.error).toBe('Previous error');

      // Start new login (will clear error)
      (apiClient.post as any).mockResolvedValue({ user: { id: 1 }, token: 'token' });

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('User Updates', () => {
    it('should update user profile data', () => {
      const { result } = renderHook(() => useAuthStore());
      const initialUser = { id: 1, email: 'test@example.com', name: 'Test' };

      act(() => {
        result.current.setUser(initialUser);
      });

      const updates = { name: 'Updated Name', phone: '+1234567890' };

      act(() => {
        result.current.updateUser(updates);
      });

      expect(result.current.user).toEqual({ ...initialUser, ...updates });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify({ ...initialUser, ...updates })
      );
    });

    it('should not update user when not authenticated', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.updateUser({ name: 'Should not update' });
      });

      expect(result.current.user).toBeNull();
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('user', expect.anything());
    });
  });

  describe('Edge Cases', () => {
    it('should handle simultaneous login attempts', async () => {
      const { apiClient } = await import('../lib/api/client');
      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;

      const firstPromise = new Promise((resolve) => { resolveFirst = resolve; });
      const secondPromise = new Promise((resolve) => { resolveSecond = resolve; });

      (apiClient.post as any)
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      const { result } = renderHook(() => useAuthStore());

      // Start two login attempts
      act(() => {
        result.current.login('first@example.com', 'password1');
        result.current.login('second@example.com', 'password2');
      });

      // Resolve second login first
      await act(async () => {
        resolveSecond!({ user: { id: 2, email: 'second@example.com' }, token: 'token2' });
        await secondPromise;
      });

      // Then resolve first login
      await act(async () => {
        resolveFirst!({ user: { id: 1, email: 'first@example.com' }, token: 'token1' });
        await firstPromise;
      });

      // Last resolved login should win
      expect(result.current.user?.email).toBe('first@example.com');
    });

    it('should handle localStorage quota exceeded', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useAuthStore());

      // Should not crash when localStorage fails
      act(() => {
        result.current.setUser({ id: 1, email: 'test@example.com', name: 'Test' });
      });

      expect(result.current.user).toEqual({ id: 1, email: 'test@example.com', name: 'Test' });
    });
  });
});
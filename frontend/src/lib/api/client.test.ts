// Last Modified: 2025-11-24 01:35
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiClient } from './client';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock console methods to avoid noise in tests
global.console.error = vi.fn();
global.console.warn = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Request Configuration', () => {
    it('should make GET request with correct headers', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      localStorageMock.getItem.mockReturnValue('test-token');

      await apiClient.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('should make POST request with body', async () => {
      const requestBody = { name: 'Test', value: 123 };
      const mockResponse = { success: true };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      await apiClient.post('/test', requestBody);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should make PUT request with body', async () => {
      const requestBody = { id: 1, name: 'Updated' };
      const mockResponse = { success: true };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      await apiClient.put('/test/1', requestBody);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('should make DELETE request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      await apiClient.delete('/test/1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle query parameters correctly', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
        headers: new Headers(),
      });

      await apiClient.get('/test', {
        params: { page: 1, limit: 10, search: 'test query' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1&limit=10&search=test%20query'),
        expect.any(Object)
      );
    });
  });

  describe('Authentication Handling', () => {
    it('should include auth token when available', async () => {
      localStorageMock.getItem.mockReturnValue('auth-token-123');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'authenticated' }),
        headers: new Headers(),
      });

      await apiClient.get('/protected');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer auth-token-123',
          }),
        })
      );
    });

    it('should not include auth header when token is missing', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'public' }),
        headers: new Headers(),
      });

      await apiClient.get('/public');

      const callArgs = (global.fetch as any).mock.calls[0];
      const headers = callArgs[1].headers;

      expect(headers['Authorization']).toBeUndefined();
    });

    it('should handle 401 unauthorized response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Token expired' }),
        headers: new Headers(),
      });

      await expect(apiClient.get('/protected')).rejects.toThrow('Unauthorized');

      // Should clear auth token on 401
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    });

    it('should attempt token refresh on 401', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'refreshToken') return 'refresh-token-123';
        return null;
      });

      // First call returns 401
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Token expired' }),
        headers: new Headers(),
      });

      // Refresh token call
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          token: 'new-token',
          refreshToken: 'new-refresh-token',
        }),
        headers: new Headers(),
      });

      // Retry original request
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'success' }),
        headers: new Headers(),
      });

      const result = await apiClient.get('/protected');

      expect(result).toEqual({ data: 'success' });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'new-token');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle 400 bad request', async () => {
      const errorResponse = {
        message: 'Validation failed',
        errors: { email: 'Invalid format' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
        headers: new Headers(),
      });

      await expect(apiClient.post('/test', {})).rejects.toThrow('Validation failed');
    });

    it('should handle 404 not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Resource not found' }),
        headers: new Headers(),
      });

      await expect(apiClient.get('/missing')).rejects.toThrow('Resource not found');
    });

    it('should handle 500 server error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Database connection failed' }),
        headers: new Headers(),
      });

      await expect(apiClient.get('/error')).rejects.toThrow('Database connection failed');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });

    it('should handle JSON parse errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
        text: async () => 'Not JSON',
        headers: new Headers(),
      });

      await expect(apiClient.get('/invalid-json')).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      // Mock slow response
      (global.fetch as any).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 10000))
      );

      // Use a short timeout
      const promise = apiClient.get('/slow', { timeout: 100 });

      await expect(promise).rejects.toThrow(/timeout|aborted/i);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network failure', async () => {
      // First two calls fail, third succeeds
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'success' }),
          headers: new Headers(),
        });

      const result = await apiClient.get('/test', { retries: 2 });

      expect(result).toEqual({ data: 'success' });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should retry with exponential backoff', async () => {
      const startTime = Date.now();

      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'success' }),
          headers: new Headers(),
        });

      await apiClient.get('/test', { retries: 2, retryDelay: 100 });

      const elapsedTime = Date.now() - startTime;

      // Should have delays: 100ms + 200ms = 300ms minimum
      expect(elapsedTime).toBeGreaterThanOrEqual(250); // Allow some margin
    });

    it('should not retry on 4xx errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad request' }),
        headers: new Headers(),
      });

      await expect(apiClient.get('/test', { retries: 3 })).rejects.toThrow('Bad request');

      // Should only call once, no retries
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on 5xx errors', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ message: 'Service unavailable' }),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'recovered' }),
          headers: new Headers(),
        });

      const result = await apiClient.get('/test', { retries: 2 });

      expect(result).toEqual({ data: 'recovered' });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should respect max retry limit', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(apiClient.get('/test', { retries: 3 })).rejects.toThrow('Network error');

      // Initial call + 3 retries = 4 total calls
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('Request Interceptors', () => {
    it('should apply request interceptors', async () => {
      const interceptor = vi.fn((config) => ({
        ...config,
        headers: {
          ...config.headers,
          'X-Custom-Header': 'test-value',
        },
      }));

      apiClient.interceptors.request.use(interceptor);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
        headers: new Headers(),
      });

      await apiClient.get('/test');

      expect(interceptor).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'test-value',
          }),
        })
      );
    });

    it('should apply response interceptors', async () => {
      const interceptor = vi.fn((response) => ({
        ...response,
        modified: true,
      }));

      apiClient.interceptors.response.use(interceptor);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
        headers: new Headers(),
      });

      const result = await apiClient.get('/test');

      expect(interceptor).toHaveBeenCalled();
      expect(result).toHaveProperty('modified', true);
    });

    it('should handle interceptor errors', async () => {
      const errorInterceptor = vi.fn(() => {
        throw new Error('Interceptor error');
      });

      apiClient.interceptors.request.use(errorInterceptor);

      await expect(apiClient.get('/test')).rejects.toThrow('Interceptor error');
    });
  });

  describe('CSRF Protection', () => {
    it('should include CSRF token in non-GET requests', async () => {
      // Mock CSRF token in cookie
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'csrfToken=csrf-token-123',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        headers: new Headers(),
      });

      await apiClient.post('/test', {});

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRF-Token': 'csrf-token-123',
          }),
        })
      );
    });

    it('should not include CSRF token in GET requests', async () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'csrfToken=csrf-token-123',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
        headers: new Headers(),
      });

      await apiClient.get('/test');

      const callArgs = (global.fetch as any).mock.calls[0];
      const headers = callArgs[1].headers;

      expect(headers['X-CSRF-Token']).toBeUndefined();
    });
  });

  describe('Response Caching', () => {
    it('should cache GET responses when enabled', async () => {
      const mockResponse = { data: 'cached' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({ 'Cache-Control': 'max-age=3600' }),
      });

      // First call - should hit network
      const result1 = await apiClient.get('/cacheable', { cache: true });
      expect(result1).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call - should return cached
      const result2 = await apiClient.get('/cacheable', { cache: true });
      expect(result2).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should not cache POST requests', async () => {
      const mockResponse = { success: true };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      await apiClient.post('/test', {}, { cache: true });
      await apiClient.post('/test', {}, { cache: true });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should respect cache expiration', async () => {
      vi.useFakeTimers();

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'fresh' }),
          headers: new Headers({ 'Cache-Control': 'max-age=60' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: 'refreshed' }),
          headers: new Headers(),
        });

      // Initial request
      await apiClient.get('/expiring', { cache: true });

      // Advance time past cache expiration
      vi.advanceTimersByTime(61000);

      // Should make new request
      const result = await apiClient.get('/expiring', { cache: true });
      expect(result).toEqual({ data: 'refreshed' });
      expect(global.fetch).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('File Upload', () => {
    it('should handle file uploads with FormData', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', 'Test file');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ uploaded: true }),
        headers: new Headers(),
      });

      await apiClient.post('/upload', formData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/upload'),
        expect.objectContaining({
          method: 'POST',
          body: formData,
          // Should not include Content-Type for FormData
          headers: expect.not.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should track upload progress', async () => {
      const onProgress = vi.fn();

      // Mock XMLHttpRequest for progress tracking
      const xhrMock = {
        open: vi.fn(),
        send: vi.fn(),
        setRequestHeader: vi.fn(),
        upload: {
          addEventListener: vi.fn((event, handler) => {
            if (event === 'progress') {
              // Simulate progress events
              setTimeout(() => handler({ loaded: 50, total: 100 }), 10);
              setTimeout(() => handler({ loaded: 100, total: 100 }), 20);
            }
          }),
        },
      };

      global.XMLHttpRequest = vi.fn(() => xhrMock) as any;

      await apiClient.uploadFile('/upload', new FormData(), { onProgress });

      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({
        loaded: expect.any(Number),
        total: expect.any(Number),
      }));
    });
  });

  describe('Abort Requests', () => {
    it('should abort requests using AbortController', async () => {
      const controller = new AbortController();

      (global.fetch as any).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const promise = apiClient.get('/slow', { signal: controller.signal });

      // Abort after 50ms
      setTimeout(() => controller.abort(), 50);

      await expect(promise).rejects.toThrow(/aborted/i);
    });

    it('should handle abort signal in request config', async () => {
      const controller = new AbortController();

      (global.fetch as any).mockImplementation((url, options) => {
        return new Promise((resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            reject(new Error('Request aborted'));
          });
        });
      });

      controller.abort();

      await expect(
        apiClient.get('/test', { signal: controller.signal })
      ).rejects.toThrow('Request aborted');
    });
  });
});
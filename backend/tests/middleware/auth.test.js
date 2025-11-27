// Last Modified: 2025-11-24 01:15
/**
 * Authentication Middleware Tests
 * Comprehensive test coverage for JWT and API key authentication
 */

import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authenticateAPIKey, authenticateJWT, optionalAuth } from '../../middleware/auth.js';

// Mock dependencies
jest.mock('../../config/logger.js', () => ({
  default: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

jest.mock('../../config/redis.js', () => ({
  getRedisClient: jest.fn(),
  isRedisAvailable: jest.fn()
}));

// Import mocked modules
import logger from '../../config/logger.js';
import { getRedisClient, isRedisAvailable } from '../../config/redis.js';

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up default request/response objects
    req = {
      headers: {},
      cookies: {},
      query: {},
      path: '/api/v1/test',
      ip: '127.0.0.1',
      user: null
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    // Set default environment variables
    process.env.API_KEY = 'test-api-key-12345';
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.NODE_ENV = 'test';
  });

  describe('authenticateAPIKey', () => {
    test('should pass with valid API key in header', () => {
      req.headers['x-api-key'] = 'test-api-key-12345';

      authenticateAPIKey(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith('API key authenticated', { path: '/api/v1/test' });
    });

    test('should pass with valid API key in query params', () => {
      req.query.api_key = 'test-api-key-12345';

      authenticateAPIKey(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 401 when no API key provided', () => {
      authenticateAPIKey(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'API key required',
        message: 'Please provide an API key in X-API-Key header or api_key query parameter'
      });
      expect(logger.warn).toHaveBeenCalledWith('API request without API key', {
        ip: '127.0.0.1',
        path: '/api/v1/test'
      });
    });

    test('should return 403 with invalid API key', () => {
      req.headers['x-api-key'] = 'invalid-key';

      authenticateAPIKey(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid API key',
        message: 'The provided API key is not valid'
      });
      expect(logger.warn).toHaveBeenCalledWith('Invalid API key attempted', {
        ip: '127.0.0.1',
        path: '/api/v1/test'
      });
    });

    test('should skip authentication for webhook paths', () => {
      req.path = '/api/v1/webhooks/twilio/sms';

      authenticateAPIKey(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith('Skipping API key auth for webhook endpoint', {
        path: '/api/v1/webhooks/twilio/sms'
      });
    });

    test('should skip authentication for chat endpoint in development', () => {
      process.env.NODE_ENV = 'development';
      req.path = '/api/v1/chat';

      authenticateAPIKey(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith('Skipping API key auth for chat endpoint in development', {
        path: '/api/v1/chat'
      });
    });
  });

  describe('authenticateJWT', () => {
    const validToken = jwt.sign(
      {
        id: 1,
        email: 'test@example.com',
        iss: 'bollalabz-api',
        aud: 'bollalabz-client'
      },
      'test-jwt-secret',
      {
        algorithm: 'HS256',
        expiresIn: '1h'
      }
    );

    const expiredToken = jwt.sign(
      {
        id: 1,
        email: 'test@example.com',
        iss: 'bollalabz-api',
        aud: 'bollalabz-client'
      },
      'test-jwt-secret',
      {
        algorithm: 'HS256',
        expiresIn: '-1s'
      }
    );

    test('should authenticate with valid JWT token', async () => {
      req.cookies.accessToken = validToken;
      isRedisAvailable.mockReturnValue(false);

      await authenticateJWT(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(1);
      expect(req.user.email).toBe('test@example.com');
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 401 when no token provided', async () => {
      await authenticateJWT(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No token provided',
        message: 'Access token cookie required'
      });
    });

    test('should return 401 for expired token', async () => {
      req.cookies.accessToken = expiredToken;
      isRedisAvailable.mockReturnValue(false);

      await authenticateJWT(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expired',
        message: 'Access token has expired. Please refresh.'
      });
    });

    test('should return 403 for invalid token', async () => {
      req.cookies.accessToken = 'invalid-token';
      isRedisAvailable.mockReturnValue(false);

      await authenticateJWT(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      });
    });

    test('should check token blacklist when Redis is available', async () => {
      req.cookies.accessToken = validToken;
      isRedisAvailable.mockReturnValue(true);

      const mockRedis = {
        get: jest.fn().mockResolvedValue(null)
      };
      getRedisClient.mockReturnValue(mockRedis);

      await authenticateJWT(req, res, next);

      expect(mockRedis.get).toHaveBeenCalledWith(`blacklist:${validToken}`);
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
    });

    test('should reject blacklisted token', async () => {
      req.cookies.accessToken = validToken;
      isRedisAvailable.mockReturnValue(true);

      const mockRedis = {
        get: jest.fn().mockResolvedValue('1')
      };
      getRedisClient.mockReturnValue(mockRedis);

      await authenticateJWT(req, res, next);

      expect(mockRedis.get).toHaveBeenCalledWith(`blacklist:${validToken}`);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token invalidated',
        message: 'This token has been invalidated. Please login again.'
      });
    });

    test('should continue if Redis blacklist check fails', async () => {
      req.cookies.accessToken = validToken;
      isRedisAvailable.mockReturnValue(true);

      const mockRedis = {
        get: jest.fn().mockRejectedValue(new Error('Redis connection failed'))
      };
      getRedisClient.mockReturnValue(mockRedis);

      await authenticateJWT(req, res, next);

      expect(logger.warn).toHaveBeenCalledWith('Failed to check token blacklist', {
        error: 'Redis connection failed'
      });
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
    });

    test('should validate JWT algorithm', async () => {
      // Create token with different algorithm
      const rsToken = jwt.sign(
        {
          id: 1,
          iss: 'bollalabz-api',
          aud: 'bollalabz-client'
        },
        'test-jwt-secret',
        { algorithm: 'HS512' } // Different algorithm
      );

      req.cookies.accessToken = rsToken;
      isRedisAvailable.mockReturnValue(false);

      await authenticateJWT(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should validate JWT issuer and audience', async () => {
      const wrongIssuerToken = jwt.sign(
        {
          id: 1,
          iss: 'wrong-issuer',
          aud: 'bollalabz-client'
        },
        'test-jwt-secret',
        { algorithm: 'HS256' }
      );

      req.cookies.accessToken = wrongIssuerToken;
      isRedisAvailable.mockReturnValue(false);

      await authenticateJWT(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('optionalAuth', () => {
    test('should set authenticated=true with valid API key', () => {
      req.headers['x-api-key'] = 'test-api-key-12345';

      optionalAuth(req, res, next);

      expect(req.authenticated).toBe(true);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should set authenticated=false with invalid API key', () => {
      req.headers['x-api-key'] = 'invalid-key';

      optionalAuth(req, res, next);

      expect(req.authenticated).toBe(false);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should set authenticated=false with no API key', () => {
      optionalAuth(req, res, next);

      expect(req.authenticated).toBe(false);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should check query params for API key', () => {
      req.query.api_key = 'test-api-key-12345';

      optionalAuth(req, res, next);

      expect(req.authenticated).toBe(true);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing environment variables gracefully', () => {
      delete process.env.API_KEY;
      req.headers['x-api-key'] = 'any-key';

      authenticateAPIKey(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should handle malformed JWT gracefully', async () => {
      req.cookies.accessToken = 'not.a.jwt';
      isRedisAvailable.mockReturnValue(false);

      await authenticateJWT(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(logger.warn).toHaveBeenCalled();
    });

    test('should handle null/undefined values in request', () => {
      req.headers = null;
      req.query = undefined;

      authenticateAPIKey(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
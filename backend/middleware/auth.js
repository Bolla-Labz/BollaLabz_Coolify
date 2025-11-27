// Last Modified: 2025-11-23 17:30
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from '../config/logger.js';
import { getRedisClient, isRedisAvailable } from '../config/redis.js';

dotenv.config();

// API Key Authentication Middleware
export const authenticateAPIKey = (req, res, next) => {
  // Skip authentication for webhook endpoints (they use signature validation instead)
  const webhookPaths = [
    '/api/v1/webhooks/twilio/sms',
    '/api/v1/webhooks/twilio/status',
    '/api/v1/webhooks/twilio/voice',
    '/api/v1/webhooks/twilio/test'
  ];

  // Skip authentication for chat endpoint in development mode
  if (process.env.NODE_ENV === 'development' && req.path.startsWith('/api/v1/chat')) {
    logger.debug('Skipping API key auth for chat endpoint in development', { path: req.path });
    return next();
  }

  if (webhookPaths.some(path => req.path.startsWith(path))) {
    logger.debug('Skipping API key auth for webhook endpoint', { path: req.path });
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey) {
    logger.warn('API request without API key', { ip: req.ip, path: req.path });
    return res.status(401).json({
      success: false,
      error: 'API key required',
      message: 'Please provide an API key in X-API-Key header or api_key query parameter'
    });
  }

  if (apiKey !== process.env.API_KEY) {
    logger.warn('Invalid API key attempted', { ip: req.ip, path: req.path });
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }

  logger.debug('API key authenticated', { path: req.path });
  next();
};

// JWT Authentication Middleware - reads token from httpOnly cookie
export const authenticateJWT = async (req, res, next) => {
  // Read access token from httpOnly cookie
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
      message: 'Access token cookie required'
    });
  }

  // Check if token is blacklisted (if Redis is available)
  if (isRedisAvailable()) {
    try {
      const redis = getRedisClient();
      const isBlacklisted = await redis.get(`blacklist:${token}`);

      if (isBlacklisted) {
        logger.warn('Blacklisted token attempted', { token: token.substring(0, 20) + '...' });
        return res.status(401).json({
          success: false,
          error: 'Token invalidated',
          message: 'This token has been invalidated. Please login again.'
        });
      }
    } catch (redisError) {
      // Log but continue if Redis check fails (fail open for availability)
      logger.warn('Failed to check token blacklist', { error: redisError.message });
    }
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], // Only allow HS256 algorithm
      issuer: 'bollalabz-api',
      audience: 'bollalabz-client'
    });
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid JWT token', { error: error.message });

    // If token is expired, client should use refresh endpoint
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Access token has expired. Please refresh.'
      });
    }

    return res.status(403).json({
      success: false,
      error: 'Invalid token',
      message: 'The provided token is invalid or expired'
    });
  }
};

// Optional authentication - doesn't fail if no auth provided
export const optionalAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (apiKey && apiKey === process.env.API_KEY) {
    req.authenticated = true;
  } else {
    req.authenticated = false;
  }

  next();
};

// Alias for authenticateAPIKey (for backwards compatibility)
export const requireAuth = authenticateAPIKey;

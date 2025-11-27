// Last Modified: 2025-11-23 17:30
/**
 * CSRF Protection Middleware
 * Implements Double Submit Cookie pattern for CSRF protection
 */

import crypto from 'crypto';
import logger from '../config/logger.js';

// Generate a random CSRF token
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware to generate and set CSRF token cookie
 * This should be called on all GET requests that render pages
 */
export const setCSRFToken = (req, res, next) => {
  // Only set CSRF token if not already present
  if (!req.cookies?.csrfToken) {
    const token = generateCSRFToken();

    res.cookie('csrfToken', token, {
      httpOnly: false, // Must be readable by JavaScript to include in headers
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    logger.debug('CSRF token generated and set');
  }

  next();
};

/**
 * Middleware to verify CSRF token on state-changing requests
 * Should be applied to POST, PUT, PATCH, DELETE requests
 */
export const verifyCSRFToken = (req, res, next) => {
  // Skip CSRF for webhook endpoints (they use signature validation)
  const webhookPaths = [
    '/api/v1/webhooks/',
    '/api/webhooks/',
  ];

  // Skip CSRF for auth endpoints (login/register don't have tokens yet)
  const authPaths = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
  ];

  if (webhookPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  if (authPaths.some(path => req.path === path)) {
    logger.debug('Skipping CSRF verification for auth endpoint', { path: req.path });
    return next();
  }

  // SECURITY: CSRF protection always enforced - no development bypass
  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

  // Validate token format (should be 64 character hex string)
  const isValidTokenFormat = (token) => {
    return token && typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
  };

  if (!cookieToken || !isValidTokenFormat(cookieToken)) {
    logger.warn('CSRF verification failed: No token in cookie', {
      ip: req.ip,
      path: req.path
    });
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing',
      message: 'CSRF token not found in cookies'
    });
  }

  if (!headerToken || !isValidTokenFormat(headerToken)) {
    logger.warn('CSRF verification failed: No token in header or invalid format', {
      ip: req.ip,
      path: req.path
    });
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing',
      message: 'CSRF token required in X-CSRF-Token header'
    });
  }

  // Use constant-time comparison to prevent timing attacks
  try {
    if (!crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    )) {
      logger.warn('CSRF verification failed: Token mismatch', {
        ip: req.ip,
        path: req.path
      });
      return res.status(403).json({
        success: false,
        error: 'CSRF token invalid',
        message: 'CSRF token verification failed'
      });
    }
  } catch (error) {
    // timingSafeEqual throws if buffer lengths don't match
    logger.warn('CSRF verification failed: Token comparison error', {
      ip: req.ip,
      path: req.path,
      error: error.message
    });
    return res.status(403).json({
      success: false,
      error: 'CSRF token invalid',
      message: 'CSRF token verification failed'
    });
  }

  logger.debug('CSRF token verified successfully', { path: req.path });
  next();
};

/**
 * Endpoint to get a new CSRF token (useful for SPA initial load)
 */
export const getCSRFToken = (req, res) => {
  const token = generateCSRFToken();

  res.cookie('csrfToken', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: {
      csrfToken: token
    }
  });
};

// Last Modified: 2025-11-23 17:30
/**
 * Authentication Routes
 * Handles user registration, login, token refresh, and logout
 */

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../config/database.js';
import logger from '../../config/logger.js';
import { requireAuth, authenticateJWT } from '../../middleware/auth.js';
import { getRedisClient, isRedisAvailable } from '../../config/redis.js';

const router = express.Router();

// SECURITY: Never use fallback secrets in production
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Validate JWT secrets are configured
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET environment variable must be set and at least 32 characters');
}
if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32) {
  throw new Error('JWT_REFRESH_SECRET environment variable must be set and at least 32 characters');
}
if (JWT_SECRET === JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
}

// Cookie configuration for secure token storage
const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents XSS attacks by making cookie inaccessible to JavaScript
  secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
  sameSite: 'lax', // 'lax' for auth cookies (allows navigation from external sites), 'strict' breaks OAuth flows
  path: '/',
};

const ACCESS_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Invalid email format'
      });
    }

    // Validate password strength (OWASP recommendations)
    if (password.length < 12) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Password must be at least 12 characters long'
      });
    }

    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Password must contain uppercase, lowercase, numbers, and special characters'
      });
    }

    // Check for common passwords (basic check)
    const commonPasswords = ['password', '12345678', 'qwerty', 'admin', 'letmein', 'welcome'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Password is too common. Please choose a stronger password'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, 'user', true)
       RETURNING id, email, full_name, role, created_at`,
      [email, passwordHash, full_name || null]
    );

    const user = result.rows[0];

    // Generate tokens (explicitly specify algorithm to prevent algorithm confusion attacks)
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      {
        expiresIn: ACCESS_TOKEN_EXPIRY,
        algorithm: 'HS256',
        issuer: 'bollalabz-api',
        audience: 'bollalabz-client'
      }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRY,
        algorithm: 'HS256',
        issuer: 'bollalabz-api',
        audience: 'bollalabz-client'
      }
    );

    // Store refresh token in database with IP tracking (if columns exist after migration)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
      await pool.query(
        `INSERT INTO user_sessions (user_id, refresh_token, expires_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, refreshToken, expiresAt, req.ip, req.get('user-agent') || 'unknown']
      );
    } catch (error) {
      // Fallback if migration hasn't run yet
      await pool.query(
        `INSERT INTO user_sessions (user_id, refresh_token, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, refreshToken, expiresAt]
      );
    }

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    // Set tokens as httpOnly cookies instead of sending in response
    res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,  // Convert to camelCase for frontend
          role: user.role
        }
        // Tokens are now in httpOnly cookies, not in response body
      }
    });
  } catch (error) {
    logger.error('Registration error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to register user'
    });
  }
});

/**
 * POST /api/v1/auth/login
 * Login existing user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }

    // Find user
    const result = await pool.query(
      `SELECT id, email, password_hash, full_name, role, is_active, failed_login_attempts
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account disabled',
        message: 'Your account has been disabled. Please contact support.'
      });
    }

    // Check if account is locked due to too many failed attempts
    if (user.failed_login_attempts >= 5) {
      return res.status(429).json({
        success: false,
        error: 'Account locked',
        message: 'Account locked due to too many failed login attempts. Please reset your password.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // Increment failed login attempts
      await pool.query(
        'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = $1',
        [user.id]
      );

      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Reset failed login attempts on successful login
    await pool.query(
      `UPDATE users
       SET failed_login_attempts = 0, last_login = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [user.id]
    );

    // SECURITY: Invalidate all previous sessions on login (prevents session fixation)
    await pool.query(
      'DELETE FROM user_sessions WHERE user_id = $1',
      [user.id]
    );

    // Generate tokens (explicitly specify algorithm to prevent algorithm confusion attacks)
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      {
        expiresIn: ACCESS_TOKEN_EXPIRY,
        algorithm: 'HS256',
        issuer: 'bollalabz-api',
        audience: 'bollalabz-client'
      }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRY,
        algorithm: 'HS256',
        issuer: 'bollalabz-api',
        audience: 'bollalabz-client'
      }
    );

    // Store refresh token in database with IP tracking (if columns exist after migration)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
      await pool.query(
        `INSERT INTO user_sessions (user_id, refresh_token, expires_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, refreshToken, expiresAt, req.ip, req.get('user-agent') || 'unknown']
      );
    } catch (error) {
      // Fallback if migration hasn't run yet
      await pool.query(
        `INSERT INTO user_sessions (user_id, refresh_token, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, refreshToken, expiresAt]
      );
    }

    logger.info('User logged in successfully', { userId: user.id, email: user.email, ip: req.ip });

    // Set tokens as httpOnly cookies instead of sending in response
    res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,  // Convert to camelCase for frontend
          role: user.role
        }
        // Tokens are now in httpOnly cookies, not in response body
      }
    });
  } catch (error) {
    logger.error('Login error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to login'
    });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token from httpOnly cookie
 */
router.post('/refresh', async (req, res) => {
  try {
    // Read refresh token from httpOnly cookie
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET, {
        algorithms: ['HS256'], // Only allow HS256 algorithm
        issuer: 'bollalabz-api',
        audience: 'bollalabz-client'
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Refresh token is invalid or expired'
      });
    }

    // Check if refresh token exists in database and is not expired
    const sessionResult = await pool.query(
      `SELECT user_id, expires_at
       FROM user_sessions
       WHERE refresh_token = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [refreshToken]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session',
        message: 'Refresh token not found or expired'
      });
    }

    // Get user details
    const userResult = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'User account not found or inactive'
      });
    }

    const user = userResult.rows[0];

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      {
        expiresIn: ACCESS_TOKEN_EXPIRY,
        algorithm: 'HS256',
        issuer: 'bollalabz-api',
        audience: 'bollalabz-client'
      }
    );

    // SECURITY: Rotate refresh token (generate new one and delete old one)
    const newRefreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRY,
        algorithm: 'HS256',
        issuer: 'bollalabz-api',
        audience: 'bollalabz-client'
      }
    );

    // Calculate new expiry date
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // Delete old refresh token from database
    await pool.query(
      'DELETE FROM user_sessions WHERE refresh_token = $1',
      [refreshToken]
    );

    // Insert new refresh token with IP tracking
    try {
      await pool.query(
        `INSERT INTO user_sessions (user_id, refresh_token, expires_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, newRefreshToken, newExpiresAt, req.ip, req.get('user-agent') || 'unknown']
      );
    } catch (error) {
      // Fallback if migration hasn't run yet
      await pool.query(
        `INSERT INTO user_sessions (user_id, refresh_token, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, newRefreshToken, newExpiresAt]
      );
    }

    logger.info('Token refreshed with rotation', { userId: user.id, ip: req.ip });

    // Set both new tokens as httpOnly cookies
    res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      success: true,
      message: 'Token refreshed successfully'
      // Tokens are now in httpOnly cookies, not in response body
    });
  } catch (error) {
    logger.error('Token refresh error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to refresh token'
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout user and invalidate refresh token
 * SECURITY: Adds access token to Redis blacklist if available
 */
router.post('/logout', authenticateJWT, async (req, res) => {
  try {
    // Read tokens from httpOnly cookies
    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.cookies?.accessToken;

    // Blacklist access token in Redis if available
    if (accessToken && isRedisAvailable()) {
      try {
        const redis = getRedisClient();

        // Decode token to get expiration time
        const decoded = jwt.decode(accessToken);
        if (decoded && decoded.exp) {
          // Calculate TTL (time until token expires)
          const now = Math.floor(Date.now() / 1000);
          const ttl = decoded.exp - now;

          if (ttl > 0) {
            // Add to blacklist with TTL matching token expiration
            await redis.setex(`blacklist:${accessToken}`, ttl, '1');
            logger.info('Access token blacklisted', { userId: req.user?.userId, ttl });
          }
        }
      } catch (redisError) {
        // Log but don't fail logout if Redis is unavailable
        logger.warn('Failed to blacklist token in Redis', {
          error: redisError.message,
          userId: req.user?.userId
        });
      }
    }

    // Delete refresh token from database
    if (refreshToken) {
      // Delete specific refresh token
      await pool.query(
        'DELETE FROM user_sessions WHERE refresh_token = $1',
        [refreshToken]
      );
    } else if (req.user?.userId) {
      // Delete all sessions for this user
      await pool.query(
        'DELETE FROM user_sessions WHERE user_id = $1',
        [req.user.userId]
      );
    }

    logger.info('User logged out', { userId: req.user?.userId });

    // Clear httpOnly cookies
    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to logout'
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user info
 */
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, full_name, role, created_at, last_login
       FROM users
       WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'User not found'
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,  // Convert to camelCase for frontend
        role: user.role,
        createdAt: user.created_at,  // Convert to camelCase for frontend
        lastLogin: user.last_login   // Convert to camelCase for frontend
      }
    });
  } catch (error) {
    logger.error('Get user info error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get user info'
    });
  }
});

export default router;

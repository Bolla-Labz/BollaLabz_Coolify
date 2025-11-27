// Last Modified: 2025-11-24 00:30
/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

// Extend Express Request type to include user
declare module 'express' {
  interface Request {
    user?: {
      userId: number;
      email: string;
      role?: string;
    };
  }
}

// SECURITY: No fallback secret allowed - must be configured
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET environment variable must be set and be at least 32 characters long');
}

/**
 * JWT Payload structure for our application
 */
interface JwtUserPayload extends JwtPayload {
  userId: number;
  email: string;
  role?: string;
}

/**
 * Type guard to verify JWT payload has required fields
 */
function isJwtUserPayload(payload: string | JwtPayload): payload is JwtUserPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'userId' in payload &&
    'email' in payload &&
    typeof (payload as JwtUserPayload).userId === 'number' &&
    typeof (payload as JwtUserPayload).email === 'string'
  );
}

/**
 * Middleware to verify JWT token and authenticate user
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'No token provided. Please login to access this resource.'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Validate payload structure
    if (!isJwtUserPayload(decoded)) {
      res.status(401).json({
        error: 'Invalid token payload. Please login again.'
      });
      return;
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error: unknown) {
    // Type guard for errors with 'name' property
    const isJwtError = (err: unknown): err is { name: string; message: string } => {
      return (
        typeof err === 'object' &&
        err !== null &&
        'name' in err &&
        'message' in err &&
        typeof (err as { name: unknown }).name === 'string'
      );
    };

    if (isJwtError(error)) {
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          error: 'Invalid token. Please login again.'
        });
        return;
      }

      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          error: 'Token expired. Please login again.'
        });
        return;
      }
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' && isJwtError(error) ? error.message : undefined
    });
  }
};

/**
 * Optional authentication - sets user if token is valid, but doesn't require it
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);

      // Validate payload structure
      if (isJwtUserPayload(decoded)) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };
      }
    }

    next();
  } catch (error: unknown) {
    // Silently ignore errors for optional auth
    next();
  }
};

/**
 * Alias for backward compatibility with existing code
 */
export const requireAuth = authenticate;

export default authenticate;

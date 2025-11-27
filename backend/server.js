#!/usr/bin/env node
// Last Modified: 2025-11-23 17:30
/**
 * BollaLabz Backend Server
 * Production-grade Express API with 50+ endpoints
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables first (required for Sentry)
dotenv.config();

import pool from './config/database.js';
import logger from './config/logger.js';
import {
  generalLimiter,
  authLimiter,
  webhookLimiter,
  perUserLimiter,
  addRateLimitHeaders
} from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { setCSRFToken, verifyCSRFToken, getCSRFToken } from './middleware/csrf.js';
import { sanitizeInput, detectSQLInjection } from './middleware/sanitize.js';
import { addSecurityHeaders, addCacheHeaders, addCorsPreflightCache, sanitizeErrorHeaders } from './middleware/securityHeaders.js';
import apiV1Router from './api/v1/index.js';
import websocketService from './services/websocket.js';
import twilioService from './services/twilio.js';
import { initializeSentry, setupSentryMiddleware, setupSentryErrorHandler, addBreadcrumb } from './config/sentry.js';

// ES Module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Sentry FIRST (before creating Express app)
initializeSentry();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Setup Sentry request and tracing handlers (must be early in middleware chain)
setupSentryMiddleware(app);

// Additional security headers (must be before helmet)
app.use(addSecurityHeaders);
app.use(addCacheHeaders);
app.use(addCorsPreflightCache);
app.use(sanitizeErrorHeaders);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "ws://localhost:*",
        "wss://localhost:*",
        "https://api.bollalabz.com",
        "https://api.anthropic.com",
        "https://api.elevenlabs.io",
        "https://api.vapi.ai",
        "wss://api.vapi.ai"
      ],
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

// CORS configuration - MUST allow credentials for httpOnly cookies
// Support multiple origins for Railway (frontend URL + custom domain)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [process.env.FRONTEND_URL || 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Required for httpOnly cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-CSRF-Token', 'X-XSRF-Token']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware (required for httpOnly cookie authentication)
app.use(cookieParser());

// Input sanitization middleware (defense in depth)
app.use(sanitizeInput);
app.use(detectSQLInjection);

// Compression middleware
app.use(compression());

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Add custom rate limit headers to all responses
app.use(addRateLimitHeaders);

// Set CSRF token on all GET requests
app.use((req, res, next) => {
  if (req.method === 'GET') {
    setCSRFToken(req, res, next);
  } else {
    next();
  }
});

// CSRF token endpoint
app.get('/api/v1/csrf-token', getCSRFToken);

// Apply CSRF protection to state-changing requests (POST, PUT, PATCH, DELETE)
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    verifyCSRFToken(req, res, next);
  } else {
    next();
  }
});

// Health check endpoint (no auth required)
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV,
      database: 'connected',
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// API info endpoint (no auth required)
app.get('/', (req, res) => {
  res.json({
    name: 'BollaLabz Backend API',
    version: '1.0.0',
    description: 'Production-grade REST API with 50+ endpoints',
    documentation: '/api/v1',
    health: '/health',
    endpoints: {
      apiV1: '/api/v1'
    },
    features: [
      'Contact Management',
      'Conversation Tracking',
      'Call Logging & Analytics',
      'Task Management',
      'Workflow Automation',
      'CRM & People Management',
      'Calendar Integration',
      'Analytics Dashboard',
      'Third-party Integrations'
    ]
  });
});

// Apply webhook rate limiting (must be before general limiter)
app.use('/api/webhooks', webhookLimiter);
app.use('/api/v1/webhooks', webhookLimiter);

// Apply strict auth rate limiting for authentication endpoints
app.use('/api/v1/auth', authLimiter);
app.use('/api/auth', authLimiter);

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

// Apply per-user rate limiting (after authentication)
app.use('/api', perUserLimiter);

// Mount API v1 routes
app.use('/api/v1', apiV1Router);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Sentry error handler (must be before other error handlers)
setupSentryErrorHandler(app);

// Global error handler (must be last)
app.use(errorHandler);

// Start server (listen on all interfaces for Railway deployment)
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info('='.repeat(50));
  logger.info(`🚀 BollaLabz Backend API Server`);
  logger.info('='.repeat(50));
  logger.info(`Environment: ${NODE_ENV}`);
  logger.info(`Server running on port: ${PORT}`);
  logger.info(`API v1 endpoint: http://localhost:${PORT}/api/v1`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info('='.repeat(50));
  logger.info('✓ Server started successfully');

  // Initialize WebSocket service
  websocketService.initialize(server);
  logger.info('✓ WebSocket service initialized');

  // Initialize Twilio service
  const twilioInitialized = twilioService.initialize();
  if (twilioInitialized) {
    logger.info('✓ Twilio SMS service initialized');
  } else {
    logger.warn('⚠ Twilio SMS service not initialized (credentials not configured)');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    pool.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    pool.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Capture in Sentry
  if (reason instanceof Error) {
    addBreadcrumb('Unhandled Promise Rejection', 'error', { promise: String(promise) });
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Capture in Sentry before exiting
  addBreadcrumb('Uncaught Exception - Server Shutting Down', 'fatal');
  process.exit(1);
});

export default app;
export { websocketService };

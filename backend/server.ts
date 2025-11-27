// Last Modified: 2025-11-24 00:30
/**
 * BollaLabz Backend Server
 * Main Express server with all integrations
 */

import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { createWebhookRouter } from './webhooks/router.js';
import { createTestRouter } from './tests/integration-tests.js';
import { logger, LogLevel } from './utils/logger.js';
import authRouter from './routes/auth.js';

/**
 * Custom error type for Express error handling
 */
interface AppError extends Error {
  status?: number;
  stack?: string;
}

// Load environment variables
dotenv.config();

// Set log level from environment
if (process.env.LOG_LEVEL) {
  const level = LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel];
  if (level !== undefined) {
    logger.setLevel(level);
  }
}

const app: Express = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Sentry tunnel endpoint (bypass ad blockers)
app.post('/tunnel', async (req: Request, res: Response) => {
  try {
    const envelope = req.body;
    const pieces = envelope.split('\n');
    const header = JSON.parse(pieces[0]);

    // Extract DSN from header
    const dsn = new URL(header.dsn);
    const projectId = dsn.pathname?.replace('/', '');

    // Forward to Sentry
    const upstream_sentry_url = `https://${dsn.host}/api/${projectId}/envelope/`;

    const response = await fetch(upstream_sentry_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
      body: envelope,
    });

    res.status(response.status).send();
  } catch (error) {
    logger.error('Sentry tunnel error', error);
    res.status(500).json({ error: 'Failed to tunnel request to Sentry' });
  }
});

// API Routes
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    message: 'BollaLabz API v1',
    endpoints: {
      auth: '/api/v1/auth',
      webhooks: '/api/v1/webhooks',
      test: '/api/v1/test',
      costs: '/api/v1/test/costs/current',
    },
  });
});

// Authentication routes
app.use('/api/v1/auth', authRouter);
logger.info('Auth routes initialized');

// Webhook routes
try {
  const webhookRouter = createWebhookRouter();
  app.use('/api/v1/webhooks', webhookRouter);
  logger.info('Webhook routes initialized');
} catch (error) {
  logger.error('Failed to initialize webhook routes', error);
}

// Test routes (only in development)
if (process.env.NODE_ENV !== 'production') {
  try {
    const testRouter = createTestRouter();
    app.use('/api/v1/test', testRouter);
    logger.info('Test routes initialized (development only)');
  } catch (error) {
    logger.error('Failed to initialize test routes', error);
  }
}

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err: AppError, req: Request, res: Response, _next: NextFunction): void => {
  logger.error('Unhandled error', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`BollaLabz Backend Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

export default app;

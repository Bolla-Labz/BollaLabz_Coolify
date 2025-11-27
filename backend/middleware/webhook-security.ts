// Last Modified: 2025-11-23 17:30
/**
 * Webhook Security Middleware
 * Signature verification and rate limiting for webhooks
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import crypto from 'crypto';

/**
 * Rate limiting for webhooks
 */
const webhookRateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

export function webhookRateLimit(req: Request, res: Response, next: NextFunction): void {
  const identifier = req.ip || 'unknown';
  const now = Date.now();

  let limitData = webhookRateLimits.get(identifier);

  if (!limitData || now > limitData.resetTime) {
    limitData = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    webhookRateLimits.set(identifier, limitData);
  }

  limitData.count++;

  if (limitData.count > MAX_REQUESTS_PER_WINDOW) {
    logger.warn(`Rate limit exceeded for ${identifier}`);
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  next();
}

/**
 * Validate Twilio webhook signature
 */
export function validateTwilioSignature(
  authToken: string
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const signature = req.headers['x-twilio-signature'] as string;

    if (!signature) {
      logger.error('Missing Twilio signature');
      res.status(403).json({ error: 'Missing signature' });
      return;
    }

    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const twilio = require('twilio');
    const isValid = twilio.validateRequest(authToken, signature, url, req.body);

    if (!isValid) {
      logger.error('Invalid Twilio signature');
      res.status(403).json({ error: 'Invalid signature' });
      return;
    }

    next();
  };
}

/**
 * Validate Vapi webhook signature
 */
export function validateVapiSignature(
  secret: string
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const signature = req.headers['x-vapi-signature'] as string;

    if (!signature) {
      logger.error('Missing Vapi signature');
      res.status(403).json({ error: 'Missing signature' });
      return;
    }

    // Vapi uses HMAC-SHA256
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.error('Invalid Vapi signature');
      res.status(403).json({ error: 'Invalid signature' });
      return;
    }

    next();
  };
}

/**
 * Generic webhook signature validator
 */
export function validateWebhookSignature(
  secret: string,
  signatureHeader = 'x-webhook-signature',
  algorithm: 'sha256' | 'sha1' = 'sha256'
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const signature = req.headers[signatureHeader] as string;

    if (!signature) {
      logger.error(`Missing webhook signature (${signatureHeader})`);
      res.status(403).json({ error: 'Missing signature' });
      return;
    }

    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.error('Invalid webhook signature');
      res.status(403).json({ error: 'Invalid signature' });
      return;
    }

    next();
  };
}

/**
 * Request validation middleware
 */
export function validateWebhookRequest(req: Request, res: Response, next: NextFunction): void {
  // Check content type
  const contentType = req.headers['content-type'];
  if (!contentType || (!contentType.includes('application/json') && !contentType.includes('application/x-www-form-urlencoded'))) {
    logger.error('Invalid content type for webhook');
    res.status(400).json({ error: 'Invalid content type' });
    return;
  }

  // Check if body is present
  if (!req.body || Object.keys(req.body).length === 0) {
    logger.error('Empty webhook body');
    res.status(400).json({ error: 'Empty body' });
    return;
  }

  next();
}

/**
 * Log webhook requests
 */
export function logWebhookRequest(source: string): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    logger.webhook(source, req.path, {
      method: req.method,
      ip: req.ip,
      body: req.body,
    });
    next();
  };
}

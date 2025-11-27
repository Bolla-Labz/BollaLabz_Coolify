// Last Modified: 2025-11-23 17:30
/**
 * Voice Call API Endpoints
 * Manage Vapi voice calls
 */

import express from 'express';
import { body, param, query } from 'express-validator';
import vapiService from '../../../services/vapi.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';
import { handleValidationErrors, paginationValidators } from '../../../validators/common.js';
import { readLimiter, writeLimiter } from '../../../middleware/rateLimiter.js';
import logger from '../../../config/logger.js';

const router = express.Router();

/**
 * POST /api/v1/calls/voice/outbound
 * Initiate an outbound voice call
 */
router.post(
  '/outbound',
  writeLimiter,
  [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
    body('assistantId')
      .optional()
      .isString()
      .withMessage('Assistant ID must be a string')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { phoneNumber, assistantId } = req.body;

    logger.info(`Initiating outbound call to ${phoneNumber}`);

    try {
      const call = await vapiService.createCall(phoneNumber, assistantId);

      res.status(201).json({
        success: true,
        message: 'Call initiated successfully',
        data: {
          callId: call.id,
          phoneNumber,
          status: 'initiated',
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error initiating outbound call:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to initiate call',
        message: error.message
      });
    }
  })
);

/**
 * GET /api/v1/calls/voice
 * List all voice calls
 */
router.get(
  '/',
  readLimiter,
  [
    ...paginationValidators,
    query('contactId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Contact ID must be a positive integer'),
    query('status')
      .optional()
      .isString()
      .withMessage('Status must be a string')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      contactId,
      status
    } = req.query;

    logger.info('Listing voice calls', { page, limit, contactId, status });

    try {
      const result = await vapiService.listCalls({
        page: parseInt(page),
        limit: parseInt(limit),
        contactId: contactId ? parseInt(contactId) : null,
        status
      });

      res.json({
        success: true,
        data: result.calls,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total
        }
      });
    } catch (error) {
      logger.error('Error listing voice calls:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to list calls',
        message: error.message
      });
    }
  })
);

/**
 * GET /api/v1/calls/voice/:callId/transcript
 * Get transcript for a specific call
 */
router.get(
  '/:callId/transcript',
  readLimiter,
  [
    param('callId')
      .notEmpty()
      .withMessage('Call ID is required')
      .isString()
      .withMessage('Call ID must be a string')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { callId } = req.params;

    logger.info(`Fetching transcript for call: ${callId}`);

    try {
      const transcript = await vapiService.getCallTranscript(callId);

      if (!transcript) {
        return res.status(404).json({
          success: false,
          error: 'Call not found or no transcript available'
        });
      }

      res.json({
        success: true,
        data: {
          callId,
          transcript: transcript.transcript,
          metadata: transcript.metadata,
          createdAt: transcript.createdAt
        }
      });
    } catch (error) {
      logger.error('Error fetching call transcript:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to fetch transcript',
        message: error.message
      });
    }
  })
);

/**
 * POST /api/v1/calls/voice/assistant
 * Create or update AI assistant configuration
 */
router.post(
  '/assistant',
  writeLimiter,
  [
    body('name')
      .optional()
      .isString()
      .withMessage('Name must be a string'),
    body('systemPrompt')
      .optional()
      .isString()
      .withMessage('System prompt must be a string'),
    body('firstMessage')
      .optional()
      .isString()
      .withMessage('First message must be a string'),
    body('voiceId')
      .optional()
      .isString()
      .withMessage('Voice ID must be a string')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const config = req.body;

    logger.info('Creating/updating AI assistant configuration');

    try {
      const assistant = await vapiService.createAssistant(config);

      res.json({
        success: true,
        message: 'Assistant configuration saved',
        data: assistant
      });
    } catch (error) {
      logger.error('Error creating assistant:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to create assistant',
        message: error.message
      });
    }
  })
);

/**
 * GET /api/v1/calls/voice/costs
 * Get voice call cost analytics
 */
router.get(
  '/costs',
  readLimiter,
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO 8601 format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO 8601 format')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    logger.info('Fetching voice call costs', { startDate, endDate });

    try {
      // Query call costs from database
      const pool = (await import('../../../config/database.js')).default;

      let query = `
        SELECT
          COUNT(*) as total_calls,
          SUM(cc.cost_amount) as total_cost,
          AVG(cc.cost_amount) as avg_cost_per_call,
          MIN(cc.cost_amount) as min_cost,
          MAX(cc.cost_amount) as max_cost,
          SUM(CAST(cm.metadata->>'duration' AS INTEGER)) as total_duration_seconds
        FROM call_costs cc
        JOIN conversation_messages cm ON cc.conversation_message_id = cm.id
        WHERE cc.service_provider = 'vapi'
          AND cc.service_type = 'voice'
      `;

      const params = [];
      let paramIndex = 1;

      if (startDate) {
        query += ` AND cc.billing_date >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND cc.billing_date <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      const result = await pool.query(query, params);
      const stats = result.rows[0];

      res.json({
        success: true,
        data: {
          totalCalls: parseInt(stats.total_calls) || 0,
          totalCost: parseFloat(stats.total_cost) || 0,
          avgCostPerCall: parseFloat(stats.avg_cost_per_call) || 0,
          minCost: parseFloat(stats.min_cost) || 0,
          maxCost: parseFloat(stats.max_cost) || 0,
          totalDurationSeconds: parseInt(stats.total_duration_seconds) || 0,
          totalDurationMinutes: parseFloat((parseInt(stats.total_duration_seconds) || 0) / 60).toFixed(2),
          currency: 'USD'
        },
        filters: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      });
    } catch (error) {
      logger.error('Error fetching voice call costs:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to fetch call costs',
        message: error.message
      });
    }
  })
);

export default router;

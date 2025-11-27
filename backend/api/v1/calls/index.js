// Last Modified: 2025-11-23 17:30
import express from 'express';
import { body, query } from 'express-validator';
import { Call } from '../../../models/index.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';
import { handleValidationErrors, paginationValidators, dateRangeValidators } from '../../../validators/common.js';
import { readLimiter, writeLimiter } from '../../../middleware/rateLimiter.js';
import voiceRouter from './voice.js';

const router = express.Router();

// Mount voice call routes
router.use('/voice', voiceRouter);

// GET /api/v1/calls - List all calls
router.get(
  '/',
  readLimiter,
  [
    ...paginationValidators,
    ...dateRangeValidators,
    query('contactId').optional().isInt({ min: 1 }),
    query('status').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, contactId, startDate, endDate } = req.query;

    const result = await Call.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      contactId,
      startDate,
      endDate
    });

    res.json({
      success: true,
      ...result
    });
  })
);

// GET /api/v1/calls/:id - Get call details
router.get(
  '/:id',
  readLimiter,
  asyncHandler(async (req, res) => {
    const call = await Call.findById(req.params.id);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    res.json({
      success: true,
      data: call
    });
  })
);

// POST /api/v1/calls - Log new call
router.post(
  '/',
  writeLimiter,
  [
    body('call_sid').notEmpty().isString(),
    body('conversation_id').notEmpty().isInt({ min: 1 }),
    body('duration').notEmpty().isInt({ min: 0 }),
    body('cost').notEmpty().isDecimal(),
    body('metadata').optional().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { call_sid, conversation_id, duration, cost, metadata } = req.body;

    const call = await Call.create({
      call_sid,
      conversation_id,
      duration,
      cost,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Call logged successfully',
      data: call
    });
  })
);

// GET /api/v1/calls/costs - Get cost breakdown
router.get(
  '/analytics/costs',
  readLimiter,
  dateRangeValidators,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const costs = await Call.getCostBreakdown({ startDate, endDate });

    res.json({
      success: true,
      data: costs,
      filters: {
        startDate: startDate || 'all_time',
        endDate: endDate || 'now'
      }
    });
  })
);

// GET /api/v1/calls/analytics - Call volume analytics
router.get(
  '/analytics/volume',
  readLimiter,
  dateRangeValidators,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const analytics = await Call.getCostBreakdown({ startDate, endDate });

    res.json({
      success: true,
      data: {
        total_calls: parseInt(analytics.total_calls) || 0,
        total_duration_seconds: parseInt(analytics.total_duration) || 0,
        total_duration_minutes: parseFloat((parseInt(analytics.total_duration) || 0) / 60).toFixed(2),
        total_cost: parseFloat(analytics.total_cost) || 0,
        avg_cost_per_call: parseFloat(analytics.avg_cost_per_call) || 0,
        avg_duration_per_call: analytics.total_calls > 0
          ? parseFloat((parseInt(analytics.total_duration) / parseInt(analytics.total_calls))).toFixed(2)
          : 0
      },
      filters: {
        startDate: startDate || 'all_time',
        endDate: endDate || 'now'
      }
    });
  })
);

export default router;

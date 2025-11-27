// Last Modified: 2025-11-23 17:30
import express from 'express';
import { body } from 'express-validator';
import { Workflow } from '../../../models/index.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';
import { handleValidationErrors, paginationValidators, urlValidator } from '../../../validators/common.js';
import { readLimiter, writeLimiter } from '../../../middleware/rateLimiter.js';
import websocketService from '../../../services/websocket.js';

const router = express.Router();

// GET /api/v1/workflows - List workflows
router.get(
  '/',
  readLimiter,
  paginationValidators,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const result = await Workflow.findAll({
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      ...result
    });
  })
);

// GET /api/v1/workflows/:id - Get workflow details
router.get(
  '/:id',
  readLimiter,
  asyncHandler(async (req, res) => {
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      data: workflow
    });
  })
);

// POST /api/v1/workflows - Create workflow
router.post(
  '/',
  writeLimiter,
  [
    body('name').notEmpty().trim().isLength({ min: 1, max: 255 }),
    body('trigger_type').notEmpty().isIn(['webhook', 'schedule', 'event', 'manual']),
    urlValidator('webhook_url').optional(),
    body('conditions').optional().isObject(),
    body('actions').optional().isObject(),
    body('metadata').optional().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { name, trigger_type, webhook_url, conditions, actions, metadata } = req.body;

    const workflow = await Workflow.create({
      name,
      trigger_type,
      webhook_url,
      conditions,
      actions,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Workflow created successfully',
      data: workflow
    });
  })
);

// PUT /api/v1/workflows/:id - Update workflow
router.put(
  '/:id',
  writeLimiter,
  [
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    body('trigger_type').optional().isIn(['webhook', 'schedule', 'event', 'manual']),
    urlValidator('webhook_url').optional(),
    body('conditions').optional().isObject(),
    body('actions').optional().isObject(),
    body('metadata').optional().isObject(),
    body('is_active').optional().isBoolean()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const existing = await Workflow.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    const workflow = await Workflow.update(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Workflow updated successfully',
      data: workflow
    });
  })
);

// DELETE /api/v1/workflows/:id - Delete workflow
router.delete(
  '/:id',
  writeLimiter,
  asyncHandler(async (req, res) => {
    const workflow = await Workflow.delete(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Workflow deleted successfully',
      data: workflow
    });
  })
);

// POST /api/v1/workflows/:id/trigger - Manual trigger
router.post(
  '/:id/trigger',
  writeLimiter,
  [body('payload').optional().isObject()],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    if (!workflow.is_active) {
      return res.status(400).json({
        success: false,
        error: 'Workflow is not active',
        message: 'Cannot trigger an inactive workflow'
      });
    }

    // Increment hit count
    const updated = await Workflow.incrementHitCount(req.params.id);

    // Emit WebSocket event
    if (req.user?.id) {
      websocketService.emitWorkflowTriggered(req.user.id, updated);
    }

    res.json({
      success: true,
      message: 'Workflow triggered successfully',
      data: {
        workflow_id: updated.id,
        name: updated.name,
        trigger_type: updated.trigger_type,
        hit_count: updated.hit_count,
        last_triggered: updated.last_triggered
      }
    });
  })
);

// GET /api/v1/workflows/:id/stats - Get workflow statistics
router.get(
  '/:id/stats',
  readLimiter,
  asyncHandler(async (req, res) => {
    const stats = await Workflow.getStats(req.params.id);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      data: {
        total_hits: stats.hit_count || 0,
        last_triggered: stats.last_triggered,
        created_at: stats.created_at,
        uptime_days: stats.created_at
          ? Math.floor((new Date() - new Date(stats.created_at)) / (1000 * 60 * 60 * 24))
          : 0
      }
    });
  })
);

export default router;

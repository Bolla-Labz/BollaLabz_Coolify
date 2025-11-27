// Last Modified: 2025-11-23 17:30
import express from 'express';
import { body, query } from 'express-validator';
import Task from '../../../models/Task.js';
import { requireAuth } from '../../../middleware/auth.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';
import { handleValidationErrors, paginationValidators } from '../../../validators/common.js';
import { readLimiter, writeLimiter } from '../../../middleware/rateLimiter.js';
import websocketService from '../../../services/websocket.js';

const router = express.Router();
router.use(requireAuth); // Require authentication for all task endpoints

// GET /api/v1/tasks - List tasks
router.get(
  '/',
  readLimiter,
  [
    ...paginationValidators,
    query('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    query('assignee').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, priority, assignee } = req.query;

    const result = await Task.findAll({
      userId: req.user.userId, // Add userId for multi-tenancy
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      priority,
      assignee
    });

    res.json({
      success: true,
      ...result
    });
  })
);

// GET /api/v1/tasks/:id - Get task details
router.get(
  '/:id',
  readLimiter,
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id, req.user.userId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or you don\'t have access to it'
      });
    }

    res.json({
      success: true,
      data: task
    });
  })
);

// POST /api/v1/tasks - Create task
router.post(
  '/',
  writeLimiter,
  [
    body('title').notEmpty().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().isString(),
    body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('assignee').optional().isString(),
    body('due_date').optional().isISO8601(),
    body('dependencies').optional().isArray(),
    body('metadata').optional().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { title, description, status, priority, assignee, due_date, dependencies, metadata } = req.body;

    const task = await Task.create({
      userId: req.user?.userId, // Add userId for multi-tenancy
      title,
      description,
      status,
      priority,
      assignee,
      due_date,
      dependencies,
      metadata
    });

    // Emit WebSocket event - FIX: use userId not id
    if (req.user?.userId) {
      websocketService.emitTaskCreated(req.user.userId, task);
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  })
);

// PUT /api/v1/tasks/:id - Update task
router.put(
  '/:id',
  writeLimiter,
  [
    body('title').optional().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().isString(),
    body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('assignee').optional().isString(),
    body('due_date').optional().isISO8601(),
    body('dependencies').optional().isArray(),
    body('metadata').optional().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const existing = await Task.findById(req.params.id, req.user.userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or you don\'t have permission to update it'
      });
    }

    const task = await Task.update(req.params.id, { ...req.body, userId: req.user.userId });

    // Emit WebSocket event - FIX: use userId not id
    if (req.user?.userId) {
      websocketService.emitTaskUpdated(req.user.userId, task);

      // If status changed, emit additional event
      if (req.body.status && req.body.status !== existing.status) {
        websocketService.emitTaskStatusChanged(
          req.user.userId,
          req.params.id,
          existing.status,
          req.body.status
        );
      }
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  })
);

// DELETE /api/v1/tasks/:id - Delete task
router.delete(
  '/:id',
  writeLimiter,
  asyncHandler(async (req, res) => {
    const task = await Task.delete(req.params.id, req.user.userId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or you don\'t have permission to delete it'
      });
    }

    // Emit WebSocket event - FIX: use userId not id
    if (req.user?.userId) {
      websocketService.emitTaskDeleted(req.user.userId, req.params.id);
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
      data: task
    });
  })
);

// POST /api/v1/tasks/:id/dependencies - Add task dependency
router.post(
  '/:id/dependencies',
  writeLimiter,
  [body('dependencyId').notEmpty().isInt({ min: 1 })],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    // Verify ownership first
    const existing = await Task.findById(req.params.id, req.user.userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or you don\'t have permission to modify it'
      });
    }

    const { dependencyId } = req.body;

    // Verify dependency task also belongs to user
    const depTask = await Task.findById(dependencyId, req.user.userId);
    if (!depTask) {
      return res.status(400).json({
        success: false,
        error: 'Dependency task not found or not accessible'
      });
    }

    const task = await Task.addDependency(req.params.id, dependencyId);

    res.json({
      success: true,
      message: 'Dependency added successfully',
      data: task
    });
  })
);

// DELETE /api/v1/tasks/:id/dependencies/:dependencyId - Remove task dependency
router.delete(
  '/:id/dependencies/:dependencyId',
  writeLimiter,
  asyncHandler(async (req, res) => {
    // Verify ownership first
    const existing = await Task.findById(req.params.id, req.user.userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or you don\'t have permission to modify it'
      });
    }

    const task = await Task.removeDependency(req.params.id, parseInt(req.params.dependencyId));

    res.json({
      success: true,
      message: 'Dependency removed successfully',
      data: task
    });
  })
);

// GET /api/v1/tasks/overdue - Get overdue tasks
router.get(
  '/filter/overdue',
  readLimiter,
  asyncHandler(async (req, res) => {
    const tasks = await Task.getOverdue(req.user.userId);

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  })
);

// GET /api/v1/tasks/today - Get today's tasks
router.get(
  '/filter/today',
  readLimiter,
  asyncHandler(async (req, res) => {
    const tasks = await Task.getToday(req.user.userId);

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  })
);

export default router;

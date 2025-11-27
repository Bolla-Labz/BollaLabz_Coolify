// Last Modified: 2025-11-23 17:30
import express from 'express';
import { body } from 'express-validator';
import { CalendarEvent } from '../../../models/index.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';
import { handleValidationErrors, paginationValidators, dateRangeValidators } from '../../../validators/common.js';
import { readLimiter, writeLimiter } from '../../../middleware/rateLimiter.js';
import websocketService from '../../../services/websocket.js';

const router = express.Router();

// GET /api/v1/calendar/events - List events
router.get(
  '/events',
  readLimiter,
  [...paginationValidators, ...dateRangeValidators],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const result = await CalendarEvent.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      startDate,
      endDate
    });

    res.json({
      success: true,
      ...result
    });
  })
);

// GET /api/v1/calendar/events/:id - Get event details
router.get(
  '/events/:id',
  readLimiter,
  asyncHandler(async (req, res) => {
    const event = await CalendarEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  })
);

// POST /api/v1/calendar/events - Create event
router.post(
  '/events',
  writeLimiter,
  [
    body('title').notEmpty().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().isString(),
    body('start_time').notEmpty().isISO8601(),
    body('end_time').notEmpty().isISO8601(),
    body('location').optional().isString(),
    body('attendees').optional().isArray(),
    body('metadata').optional().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { title, description, start_time, end_time, location, attendees, metadata } = req.body;

    // Validate that end_time is after start_time
    if (new Date(end_time) <= new Date(start_time)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time range',
        message: 'End time must be after start time'
      });
    }

    const event = await CalendarEvent.create({
      title,
      description,
      start_time,
      end_time,
      location,
      attendees,
      metadata
    });

    // Emit WebSocket event
    if (req.user?.id) {
      websocketService.emitCalendarEventCreated(req.user.id, event);
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  })
);

// PUT /api/v1/calendar/events/:id - Update event
router.put(
  '/events/:id',
  writeLimiter,
  [
    body('title').optional().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().isString(),
    body('start_time').optional().isISO8601(),
    body('end_time').optional().isISO8601(),
    body('location').optional().isString(),
    body('attendees').optional().isArray(),
    body('metadata').optional().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const existing = await CalendarEvent.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Validate time range if both are provided
    const startTime = req.body.start_time || existing.start_time;
    const endTime = req.body.end_time || existing.end_time;

    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time range',
        message: 'End time must be after start time'
      });
    }

    const event = await CalendarEvent.update(req.params.id, req.body);

    // Emit WebSocket event
    if (req.user?.id) {
      websocketService.emitCalendarEventUpdated(req.user.id, event);
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  })
);

// DELETE /api/v1/calendar/events/:id - Delete event
router.delete(
  '/events/:id',
  writeLimiter,
  asyncHandler(async (req, res) => {
    const event = await CalendarEvent.delete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Emit WebSocket event
    if (req.user?.id) {
      websocketService.emitCalendarEventDeleted(req.user.id, req.params.id);
    }

    res.json({
      success: true,
      message: 'Event deleted successfully',
      data: event
    });
  })
);

// GET /api/v1/calendar/upcoming - Get upcoming events
router.get(
  '/upcoming',
  readLimiter,
  [body('limit').optional().isInt({ min: 1, max: 100 })],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const events = await CalendarEvent.getUpcoming({ limit: parseInt(limit) });

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  })
);

// GET /api/v1/calendar/today - Get today's events
router.get(
  '/today',
  readLimiter,
  asyncHandler(async (req, res) => {
    const events = await CalendarEvent.getToday();

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  })
);

export default router;

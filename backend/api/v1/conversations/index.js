// Last Modified: 2025-11-23 17:30
import express from 'express';
import { body, query } from 'express-validator';
import Conversation from '../../../models/Conversation.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';
import { handleValidationErrors, paginationValidators, dateRangeValidators } from '../../../validators/common.js';
import { readLimiter, writeLimiter } from '../../../middleware/rateLimiter.js';
import websocketService from '../../../services/websocket.js';

const router = express.Router();

// GET /api/v1/conversations - List conversations
router.get(
  '/',
  readLimiter,
  [
    ...paginationValidators,
    ...dateRangeValidators,
    query('contactId').optional().isInt({ min: 1 }),
    query('direction').optional().isIn(['inbound', 'outbound'])
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, contactId, startDate, endDate, direction } = req.query;

    const result = await Conversation.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      contactId,
      startDate,
      endDate,
      direction
    });

    res.json({
      success: true,
      ...result
    });
  })
);

// GET /api/v1/conversations/:id - Get conversation details
router.get(
  '/:id',
  readLimiter,
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  })
);

// POST /api/v1/conversations - Create conversation
router.post(
  '/',
  writeLimiter,
  [
    body('conversation_id').notEmpty().isString(),
    body('contact_id').notEmpty().isInt({ min: 1 }),
    body('direction').isIn(['inbound', 'outbound']),
    body('content').notEmpty().isString(),
    body('message_type').optional().isString(),
    body('cost').optional().isDecimal(),
    body('metadata').optional().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { conversation_id, contact_id, direction, content, message_type, cost, metadata } = req.body;

    const conversation = await Conversation.create({
      conversation_id,
      contact_id,
      direction,
      content,
      message_type,
      cost: cost || 0,
      metadata
    });

    // Emit WebSocket event for incoming messages
    if (req.user?.id && direction === 'inbound') {
      websocketService.emitMessageReceived(req.user.id, conversation);
    }

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: conversation
    });
  })
);

// POST /api/v1/conversations/:id/messages - Add message to conversation
router.post(
  '/:conversationId/messages',
  writeLimiter,
  [
    body('contact_id').notEmpty().isInt({ min: 1 }),
    body('direction').isIn(['inbound', 'outbound']),
    body('content').notEmpty().isString(),
    body('message_type').optional().isString(),
    body('cost').optional().isDecimal(),
    body('metadata').optional().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { contact_id, direction, content, message_type, cost, metadata } = req.body;

    const message = await Conversation.create({
      conversation_id: req.params.conversationId,
      contact_id,
      direction,
      content,
      message_type,
      cost: cost || 0,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Message added successfully',
      data: message
    });
  })
);

// GET /api/v1/conversations/:conversationId/messages - Get all messages
router.get(
  '/:conversationId/messages',
  readLimiter,
  paginationValidators,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;

    const result = await Conversation.findByConversationId(req.params.conversationId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      conversationId: req.params.conversationId,
      ...result
    });
  })
);

// PUT /api/v1/conversations/messages/:msgId - Update message
router.put(
  '/messages/:msgId',
  writeLimiter,
  [
    body('content').optional().isString(),
    body('metadata').optional().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { content, metadata } = req.body;

    const message = await Conversation.update(req.params.msgId, {
      content,
      metadata
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: message
    });
  })
);

// GET /api/v1/conversations/search - Search messages
router.get(
  '/search',
  readLimiter,
  [
    query('q').notEmpty().isString().trim(),
    query('contactId').optional().isInt({ min: 1 }),
    ...paginationValidators
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { q: searchTerm, contactId, page = 1, limit = 20 } = req.query;

    const result = await Conversation.search({
      searchTerm,
      contactId,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      searchTerm,
      ...result
    });
  })
);

export default router;

// Last Modified: 2025-11-23 17:30
import express from 'express';
import { requireAuth } from '../../../middleware/auth.js';
import { body } from 'express-validator';
import Contact from '../../../models/Contact.js';
import Conversation from '../../../models/Conversation.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';
import { handleValidationErrors, paginationValidators, searchValidator, phoneValidator, emailValidator } from '../../../validators/common.js';
import { readLimiter, writeLimiter } from '../../../middleware/rateLimiter.js';
import { paginationMiddleware } from '../../../middleware/pagination.js';
import websocketService from '../../../services/websocket.js';
import { cacheMiddleware, invalidateCache } from '../../../middleware/cache.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/v1/contacts - List all contacts (scoped to authenticated user)
// Add ?withAnalytics=true to get embedded analytics (optimized, no N+1 queries)
router.get(
  '/',
  readLimiter,
  paginationMiddleware,
  cacheMiddleware(300), // 5 minutes cache
  [...paginationValidators, searchValidator],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    // Use enforced pagination from middleware
    const { limit, offset, page } = req.pagination;
    const { search = '', withAnalytics = false } = req.query;

    // Use optimized method if analytics requested
    if (withAnalytics === 'true' || withAnalytics === true) {
      const result = await Contact.findAllWithAnalytics({
        userId: req.user.userId,
        page,
        limit,
        search,
        offset
      });

      return res.json({
        success: true,
        ...result
      });
    }

    // Standard query without analytics (faster for simple lists)
    const result = await Contact.findAll({
      userId: req.user.userId, // Multi-tenancy: only return user's contacts
      page,
      limit,
      search,
      offset
    });

    res.json({
      success: true,
      ...result
    });
  })
);

// GET /api/v1/contacts/:id - Get contact details (ownership verified)
router.get(
  '/:id',
  readLimiter,
  cacheMiddleware(600), // 10 minutes cache
  asyncHandler(async (req, res) => {
    const contact = await Contact.findById(req.params.id, req.user.userId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
        message: `No contact found with ID ${req.params.id} or you don't have access to it`
      });
    }

    res.json({
      success: true,
      data: contact
    });
  })
);

// POST /api/v1/contacts - Create contact
router.post(
  '/',
  writeLimiter,
  [
    phoneValidator('phone_number').notEmpty(),
    body('contact_name').optional().trim().isLength({ min: 1, max: 255 }),
    emailValidator('contact_email').optional(),
    body('notes').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { phone_number, contact_name, contact_email, notes } = req.body;

    // Check if contact with phone already exists for this user
    const existing = await Contact.findByPhone(phone_number, req.user.userId);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Contact already exists',
        message: `You already have a contact with phone number ${phone_number}`,
        data: existing
      });
    }

    const contact = await Contact.create({
      userId: req.user.userId, // Multi-tenancy: assign contact to user
      phone_number,
      contact_name,
      contact_email,
      notes
    });

    // Invalidate contacts cache for this user
    await invalidateCache(req.user.userId, '/api/v1/contacts*');

    // Emit WebSocket event
    // BUG FIX: JWT token uses 'userId' not 'id' (see auth.js line 139, 294)
    if (req.user?.userId) {
      websocketService.emitContactCreated(req.user.userId, contact);
    }

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: contact
    });
  })
);

// PUT /api/v1/contacts/:id - Update contact
router.put(
  '/:id',
  writeLimiter,
  [
    body('contact_name').optional().trim().isLength({ min: 1, max: 255 }),
    emailValidator('contact_email').optional(),
    body('notes').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { contact_name, contact_email, notes } = req.body;

    // Verify ownership before updating
    const existing = await Contact.findById(req.params.id, req.user.userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found or you don\'t have permission to update it'
      });
    }

    // Only pass defined fields to update
    const updateData = { userId: req.user.userId }; // Multi-tenancy: verify ownership
    if (contact_name !== undefined) updateData.contact_name = contact_name;
    if (contact_email !== undefined) updateData.contact_email = contact_email;
    if (notes !== undefined) updateData.notes = notes;

    if (Object.keys(updateData).length === 1) { // Only userId, no actual updates
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
        message: 'Please provide at least one field to update (contact_name, contact_email, or notes)'
      });
    }

    const contact = await Contact.update(req.params.id, updateData);

    // Invalidate contacts cache for this user
    await invalidateCache(req.user.userId, '/api/v1/contacts*');

    // Emit WebSocket event
    // BUG FIX: JWT token uses 'userId' not 'id' (see auth.js line 139, 294)
    if (req.user?.userId) {
      websocketService.emitContactUpdated(req.user.userId, contact);
    }

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: contact
    });
  })
);

// DELETE /api/v1/contacts/:id - Delete contact (ownership verified)
router.delete(
  '/:id',
  writeLimiter,
  asyncHandler(async (req, res) => {
    const contact = await Contact.delete(req.params.id, req.user.userId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found or you don\'t have permission to delete it'
      });
    }

    // Invalidate contacts cache for this user
    await invalidateCache(req.user.userId, '/api/v1/contacts*');

    // Emit WebSocket event
    // BUG FIX: JWT token uses 'userId' not 'id' (see auth.js line 139, 294)
    if (req.user?.userId) {
      websocketService.emitContactDeleted(req.user.userId, req.params.id);
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully',
      data: contact
    });
  })
);

// GET /api/v1/contacts/:id/conversations - Get contact's conversation history (ownership verified)
router.get(
  '/:id/conversations',
  readLimiter,
  paginationValidators,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    // Verify ownership of contact
    const contact = await Contact.findById(req.params.id, req.user.userId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found or you don\'t have access to it'
      });
    }

    const result = await Conversation.findAll({
      userId: req.user.userId, // Multi-tenancy: only return user's conversations
      contactId: req.params.id,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      contact: {
        id: contact.id,
        contact_name: contact.contact_name,
        phone_number: contact.phone_number
      },
      ...result
    });
  })
);

// GET /api/v1/contacts/:id/analytics - Get contact analytics (ownership verified)
router.get(
  '/:id/analytics',
  readLimiter,
  asyncHandler(async (req, res) => {
    // Verify ownership of contact
    const contact = await Contact.findById(req.params.id, req.user.userId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found or you don\'t have access to it'
      });
    }

    const analytics = await Contact.getAnalytics(req.params.id, req.user.userId);

    res.json({
      success: true,
      data: {
        contact: {
          id: contact.id,
          contact_name: contact.contact_name,
          phone_number: contact.phone_number,
          conversation_count: contact.conversation_count
        },
        analytics
      }
    });
  })
);

// POST /api/v1/contacts/batch/analytics - Get analytics for multiple contacts (OPTIMIZED)
// Prevents N+1 queries when fetching analytics for many contacts
router.post(
  '/batch/analytics',
  readLimiter,
  [
    body('contactIds').isArray({ min: 1, max: 100 }).withMessage('contactIds must be an array of 1-100 contact IDs'),
    body('contactIds.*').isInt({ min: 1 }).withMessage('Each contact ID must be a positive integer')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { contactIds } = req.body;

    // Get batch analytics in a single optimized query
    const analyticsMap = await Contact.getBatchAnalytics(contactIds, req.user.userId);

    res.json({
      success: true,
      data: analyticsMap
    });
  })
);

export default router;

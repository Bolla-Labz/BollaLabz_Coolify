// Last Modified: 2025-11-23 17:30
import express from 'express';
import { body } from 'express-validator';
import { Person } from '../../../models/index.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';
import { handleValidationErrors, paginationValidators, searchValidator, emailValidator, phoneValidator } from '../../../validators/common.js';
import { readLimiter, writeLimiter } from '../../../middleware/rateLimiter.js';
import { query } from '../../../config/database.js';

const router = express.Router();

// GET /api/v1/people - List people
router.get(
  '/',
  readLimiter,
  [...paginationValidators, searchValidator],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '' } = req.query;

    const result = await Person.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search
    });

    res.json({
      success: true,
      ...result
    });
  })
);

// GET /api/v1/people/:id - Get person details
router.get(
  '/:id',
  readLimiter,
  asyncHandler(async (req, res) => {
    const person = await Person.findById(req.params.id);

    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found'
      });
    }

    res.json({
      success: true,
      data: person
    });
  })
);

// POST /api/v1/people - Create person
router.post(
  '/',
  writeLimiter,
  [
    body('full_name').notEmpty().trim().isLength({ min: 1, max: 255 }),
    emailValidator('email').optional(),
    phoneValidator('phone_number').optional(),
    body('company').optional().isString(),
    body('title').optional().isString(),
    body('relationships').optional().isObject(),
    body('notes').optional().isString(),
    body('metadata').optional().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { full_name, email, phone_number, company, title, relationships, notes, metadata } = req.body;

    const person = await Person.create({
      full_name,
      email,
      phone_number,
      company,
      title,
      relationships,
      notes,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Person created successfully',
      data: person
    });
  })
);

// PUT /api/v1/people/:id - Update person
router.put(
  '/:id',
  writeLimiter,
  [
    body('full_name').optional().trim().isLength({ min: 1, max: 255 }),
    emailValidator('email').optional(),
    phoneValidator('phone_number').optional(),
    body('company').optional().isString(),
    body('title').optional().isString(),
    body('relationships').optional().isObject(),
    body('notes').optional().isString(),
    body('metadata').optional().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const existing = await Person.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Person not found'
      });
    }

    const person = await Person.update(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Person updated successfully',
      data: person
    });
  })
);

// DELETE /api/v1/people/:id - Delete person
router.delete(
  '/:id',
  writeLimiter,
  asyncHandler(async (req, res) => {
    const person = await Person.delete(req.params.id);

    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found'
      });
    }

    res.json({
      success: true,
      message: 'Person deleted successfully',
      data: person
    });
  })
);

// GET /api/v1/people/:id/interactions - Get interaction history
router.get(
  '/:id/interactions',
  readLimiter,
  paginationValidators,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found'
      });
    }

    const result = await query(
      `SELECT * FROM relationship_interactions
       WHERE person_id = $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM relationship_interactions WHERE person_id = $1',
      [req.params.id]
    );

    res.json({
      success: true,
      person: {
        id: person.id,
        full_name: person.full_name
      },
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  })
);

// POST /api/v1/people/:id/interactions - Log interaction
router.post(
  '/:id/interactions',
  writeLimiter,
  [
    body('interaction_type').notEmpty().isIn(['call', 'email', 'meeting', 'message', 'note', 'other']),
    body('description').optional().isString(),
    body('metadata').optional().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { interaction_type, description, metadata } = req.body;

    const person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found'
      });
    }

    const result = await query(
      `INSERT INTO relationship_interactions
       (person_id, interaction_type, description, metadata, timestamp)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [req.params.id, interaction_type, description, JSON.stringify(metadata || {})]
    );

    res.status(201).json({
      success: true,
      message: 'Interaction logged successfully',
      data: result.rows[0]
    });
  })
);

// GET /api/v1/people/:id/relationships - Get relationships
router.get(
  '/:id/relationships',
  readLimiter,
  asyncHandler(async (req, res) => {
    const person = await Person.findById(req.params.id);

    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found'
      });
    }

    res.json({
      success: true,
      data: {
        person: {
          id: person.id,
          full_name: person.full_name
        },
        relationships: person.relationships || {}
      }
    });
  })
);

export default router;

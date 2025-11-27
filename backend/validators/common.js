// Last Modified: 2025-11-23 17:30
import { body, param, query, validationResult } from 'express-validator';

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Common validators
export const idValidator = param('id')
  .isInt({ min: 1 })
  .withMessage('ID must be a positive integer');

export const uuidValidator = param('id')
  .isUUID()
  .withMessage('Invalid UUID format');

export const paginationValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
    .toInt()
];

export const searchValidator = query('search')
  .optional()
  .isString()
  .trim()
  .isLength({ min: 1, max: 255 })
  .withMessage('Search query must be between 1 and 255 characters');

export const dateRangeValidators = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format')
];

export const phoneValidator = (field) =>
  body(field)
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Phone number must be in E.164 format (e.g., +1234567890)');

export const emailValidator = (field) =>
  body(field)
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address');

export const urlValidator = (field) =>
  body(field)
    .isURL()
    .withMessage('Invalid URL format');

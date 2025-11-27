// Last Modified: 2025-11-23 17:30
/**
 * Messages API Routes - SMS Management
 * Endpoints for sending SMS and retrieving message history
 */

import express from 'express';
import { body, query, validationResult } from 'express-validator';
import twilioService from '../../../services/twilio.js';
import logger from '../../../config/logger.js';
import { smsLimiter } from '../../../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/v1/messages/send
 * @desc    Send SMS message
 * @access  Private (requires API key)
 * @security Rate limited to 10 requests per hour
 */
router.post(
  '/send',
  smsLimiter,
  [
    body('to')
      .notEmpty()
      .withMessage('Recipient phone number is required')
      .matches(/^\+[1-9]\d{1,14}$/)
      .withMessage('Phone number must be in E.164 format (e.g., +1234567890)'),
    body('message')
      .notEmpty()
      .withMessage('Message content is required')
      .isLength({ max: 1600 })
      .withMessage('Message must not exceed 1600 characters')
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      // Check if Twilio is initialized
      if (!twilioService.isInitialized()) {
        return res.status(503).json({
          error: 'SMS service not available',
          message: 'Twilio service is not configured'
        });
      }

      const { to, message } = req.body;

      // Send SMS via Twilio
      const twilioResponse = await twilioService.sendSMS(to, message);

      // Store message in database
      const storedMessage = await twilioService.storeOutboundSMS(
        to,
        message,
        twilioResponse
      );

      logger.info(`SMS sent successfully to ${to}`);

      res.status(200).json({
        success: true,
        message: 'SMS sent successfully',
        data: {
          messageSid: twilioResponse.sid,
          status: twilioResponse.status,
          to: twilioResponse.to,
          from: twilioResponse.from,
          body: twilioResponse.body,
          dateCreated: twilioResponse.dateCreated,
          messageId: storedMessage.message.id
        }
      });
    } catch (error) {
      logger.error('Error sending SMS:', error);
      res.status(500).json({
        error: 'Failed to send SMS',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/v1/messages
 * @desc    Get message history
 * @access  Private (requires API key)
 */
router.get(
  '/',
  [
    query('phoneNumber')
      .optional()
      .matches(/^\+[1-9]\d{1,14}$/)
      .withMessage('Phone number must be in E.164 format'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { phoneNumber, limit = 50 } = req.query;

      if (phoneNumber) {
        // Get messages for specific phone number
        const messages = await twilioService.getMessageHistory(
          phoneNumber,
          parseInt(limit)
        );

        res.status(200).json({
          success: true,
          data: {
            phoneNumber,
            count: messages.length,
            messages
          }
        });
      } else {
        // Get all recent messages
        const query = `
          SELECT
            cm.*,
            pc.phone_number,
            pc.contact_name,
            cc.cost_amount,
            cc.currency
          FROM conversation_messages cm
          JOIN phone_contacts pc ON cm.contact_id = pc.id
          LEFT JOIN call_costs cc ON cm.id = cc.conversation_message_id
          WHERE cm.message_type = 'sms'
          ORDER BY cm.created_at DESC
          LIMIT $1
        `;
        const pool = (await import('../../../config/database.js')).default;
        const result = await pool.query(query, [parseInt(limit)]);

        res.status(200).json({
          success: true,
          data: {
            count: result.rows.length,
            messages: result.rows
          }
        });
      }
    } catch (error) {
      logger.error('Error retrieving messages:', error);
      res.status(500).json({
        error: 'Failed to retrieve messages',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/v1/messages/costs
 * @desc    Get SMS cost statistics
 * @access  Private (requires API key)
 */
router.get('/costs', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const costs = await twilioService.getTotalSMSCosts(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.status(200).json({
      success: true,
      data: costs
    });
  } catch (error) {
    logger.error('Error retrieving SMS costs:', error);
    res.status(500).json({
      error: 'Failed to retrieve SMS costs',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/v1/messages/:messageId
 * @desc    Get specific message by ID
 * @access  Private (requires API key)
 */
router.get('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    const query = `
      SELECT
        cm.*,
        pc.phone_number,
        pc.contact_name,
        cc.cost_amount,
        cc.currency
      FROM conversation_messages cm
      JOIN phone_contacts pc ON cm.contact_id = pc.id
      LEFT JOIN call_costs cc ON cm.id = cc.conversation_message_id
      WHERE cm.id = $1 AND cm.message_type = 'sms'
    `;
    const pool = (await import('../../../config/database.js')).default;
    const result = await pool.query(query, [messageId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error retrieving message:', error);
    res.status(500).json({
      error: 'Failed to retrieve message',
      message: error.message
    });
  }
});

export default router;

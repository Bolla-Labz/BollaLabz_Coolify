// Last Modified: 2025-11-23 17:30
/**
 * Twilio Service - SMS Integration
 * Handles Twilio client initialization, SMS sending/receiving, and cost tracking
 */

import twilio from 'twilio';
import logger from '../config/logger.js';
import pool from '../config/database.js';
import websocketService from './websocket.js';

class TwilioService {
  constructor() {
    this.client = null;
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.initialized = false;
  }

  /**
   * Initialize Twilio client
   */
  initialize() {
    if (!this.accountSid || !this.authToken || !this.phoneNumber) {
      logger.warn('Twilio credentials not configured. SMS features disabled.');
      return false;
    }

    try {
      this.client = twilio(this.accountSid, this.authToken);
      this.initialized = true;
      logger.info('✓ Twilio service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Twilio client:', error);
      return false;
    }
  }

  /**
   * Check if Twilio is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Send SMS message
   * @param {string} to - Recipient phone number
   * @param {string} message - Message content
   * @param {string} statusCallbackUrl - Optional status callback URL
   * @returns {Promise<object>} - Message details
   */
  async sendSMS(to, message, statusCallbackUrl = null) {
    if (!this.initialized) {
      throw new Error('Twilio service not initialized');
    }

    try {
      // Validate phone number format
      if (!to.startsWith('+')) {
        throw new Error('Phone number must include country code (e.g., +1234567890)');
      }

      const messageOptions = {
        body: message,
        from: this.phoneNumber,
        to: to
      };

      // Add status callback if provided
      if (statusCallbackUrl) {
        messageOptions.statusCallback = statusCallbackUrl;
      } else if (process.env.TWILIO_STATUS_CALLBACK_URL) {
        messageOptions.statusCallback = process.env.TWILIO_STATUS_CALLBACK_URL;
      }

      logger.info(`Sending SMS to ${to}`);
      const twilioMessage = await this.client.messages.create(messageOptions);

      logger.info(`SMS sent successfully. SID: ${twilioMessage.sid}`);

      return {
        sid: twilioMessage.sid,
        status: twilioMessage.status,
        to: twilioMessage.to,
        from: twilioMessage.from,
        body: twilioMessage.body,
        dateCreated: twilioMessage.dateCreated,
        price: twilioMessage.price,
        priceUnit: twilioMessage.priceUnit
      };
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      throw error;
    }
  }

  /**
   * Store received SMS in database
   * @param {object} messageData - Twilio webhook data
   * @returns {Promise<object>} - Stored message record
   */
  async storeInboundSMS(messageData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get or create contact
      const contactQuery = `
        INSERT INTO phone_contacts (phone_number, contact_name, last_contact_date, conversation_count)
        VALUES ($1, $2, CURRENT_TIMESTAMP, 1)
        ON CONFLICT (phone_number)
        DO UPDATE SET
          last_contact_date = CURRENT_TIMESTAMP,
          conversation_count = phone_contacts.conversation_count + 1
        RETURNING id, phone_number, contact_name
      `;
      const contactResult = await client.query(contactQuery, [
        messageData.From,
        messageData.FromCity || messageData.From
      ]);
      const contact = contactResult.rows[0];

      // Store message
      const messageQuery = `
        INSERT INTO conversation_messages (
          contact_id,
          direction,
          message_type,
          message_content,
          metadata,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const metadata = {
        twilio_sid: messageData.MessageSid,
        from_city: messageData.FromCity,
        from_state: messageData.FromState,
        from_zip: messageData.FromZip,
        from_country: messageData.FromCountry,
        to: messageData.To,
        num_media: messageData.NumMedia
      };

      const messageResult = await client.query(messageQuery, [
        contact.id,
        'inbound',
        'sms',
        messageData.Body,
        JSON.stringify(metadata)
      ]);
      const message = messageResult.rows[0];

      // Store cost if available
      if (messageData.Price) {
        const costQuery = `
          INSERT INTO call_costs (
            conversation_message_id,
            service_provider,
            service_type,
            cost_amount,
            currency,
            metadata,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        `;
        await client.query(costQuery, [
          message.id,
          'twilio',
          'sms',
          Math.abs(parseFloat(messageData.Price || 0)),
          messageData.PriceUnit || 'USD',
          JSON.stringify({ twilio_sid: messageData.MessageSid })
        ]);
      }

      await client.query('COMMIT');

      logger.info(`Inbound SMS stored. Message ID: ${message.id}, Contact: ${contact.phone_number}`);

      // Emit WebSocket event for real-time updates
      // SECURITY: Using emitToAll is acceptable here for single-user systems
      // For multi-user systems, phone_contacts would need a user_id column
      // and we'd use: websocketService.emitToUser(userId, 'message:received', {...})
      websocketService.emitToAll('message:received', {
        message: {
          ...message,
          contact
        }
      });

      return {
        message,
        contact
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to store inbound SMS:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Store outbound SMS in database
   * @param {string} to - Recipient phone number
   * @param {string} messageBody - Message content
   * @param {object} twilioResponse - Twilio API response
   * @returns {Promise<object>} - Stored message record
   */
  async storeOutboundSMS(to, messageBody, twilioResponse) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get or create contact
      const contactQuery = `
        INSERT INTO phone_contacts (phone_number, last_contact_date, conversation_count)
        VALUES ($1, CURRENT_TIMESTAMP, 1)
        ON CONFLICT (phone_number)
        DO UPDATE SET
          last_contact_date = CURRENT_TIMESTAMP,
          conversation_count = phone_contacts.conversation_count + 1
        RETURNING id, phone_number, contact_name
      `;
      const contactResult = await client.query(contactQuery, [to]);
      const contact = contactResult.rows[0];

      // Store message
      const messageQuery = `
        INSERT INTO conversation_messages (
          contact_id,
          direction,
          message_type,
          message_content,
          metadata,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const metadata = {
        twilio_sid: twilioResponse.sid,
        status: twilioResponse.status,
        from: twilioResponse.from
      };

      const messageResult = await client.query(messageQuery, [
        contact.id,
        'outbound',
        'sms',
        messageBody,
        JSON.stringify(metadata)
      ]);
      const message = messageResult.rows[0];

      // Store initial cost if available
      if (twilioResponse.price) {
        const costQuery = `
          INSERT INTO call_costs (
            conversation_message_id,
            service_provider,
            service_type,
            cost_amount,
            currency,
            metadata,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        `;
        await client.query(costQuery, [
          message.id,
          'twilio',
          'sms',
          Math.abs(parseFloat(twilioResponse.price || 0)),
          twilioResponse.priceUnit || 'USD',
          JSON.stringify({ twilio_sid: twilioResponse.sid })
        ]);
      }

      await client.query('COMMIT');

      logger.info(`Outbound SMS stored. Message ID: ${message.id}, To: ${to}`);

      return {
        message,
        contact
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to store outbound SMS:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update message status from delivery receipt
   * @param {string} messageSid - Twilio message SID
   * @param {string} status - Message status
   * @param {object} statusData - Additional status data
   */
  async updateMessageStatus(messageSid, status, statusData = {}) {
    try {
      const query = `
        UPDATE conversation_messages
        SET
          metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{status}',
            $2
          ),
          updated_at = CURRENT_TIMESTAMP
        WHERE metadata->>'twilio_sid' = $1
        RETURNING *
      `;
      const result = await pool.query(query, [messageSid, JSON.stringify(status)]);

      if (result.rows.length > 0) {
        logger.info(`Message status updated: SID=${messageSid}, Status=${status}`);

        // Update cost if provided in status data
        if (statusData.price) {
          const costQuery = `
            UPDATE call_costs
            SET
              cost_amount = $1,
              currency = $2,
              metadata = jsonb_set(
                COALESCE(metadata, '{}'::jsonb),
                '{status}',
                $3
              )
            WHERE metadata->>'twilio_sid' = $4
          `;
          await pool.query(costQuery, [
            Math.abs(parseFloat(statusData.price)),
            statusData.priceUnit || 'USD',
            JSON.stringify(status),
            messageSid
          ]);
        }

        return result.rows[0];
      }

      return null;
    } catch (error) {
      logger.error('Failed to update message status:', error);
      throw error;
    }
  }

  /**
   * Validate Twilio webhook signature
   * @param {string} signature - X-Twilio-Signature header
   * @param {string} url - Full webhook URL
   * @param {object} params - Request body parameters
   * @returns {boolean}
   */
  validateWebhookSignature(signature, url, params) {
    if (!this.initialized) {
      logger.warn('Cannot validate webhook signature: Twilio not initialized');
      return false;
    }

    try {
      return twilio.validateRequest(
        this.authToken,
        signature,
        url,
        params
      );
    } catch (error) {
      logger.error('Error validating Twilio webhook signature:', error);
      return false;
    }
  }

  /**
   * Get message history by phone number (OPTIMIZED with proper JOINs and indexing)
   * @param {string} phoneNumber - Phone number
   * @param {number} limit - Maximum number of messages (capped at 100 for performance)
   * @param {number} offset - Offset for pagination
   * @returns {Promise<object>} - Message history with pagination info
   */
  async getMessageHistory(phoneNumber, limit = 50, offset = 0) {
    try {
      // Cap limit at 100 to prevent excessive data retrieval
      const cappedLimit = Math.min(limit, 100);

      // Single optimized query with all JOINs
      const query = `
        SELECT
          cm.id,
          cm.contact_id,
          cm.direction,
          cm.message_type,
          cm.message_content,
          cm.metadata,
          cm.created_at,
          cm.updated_at,
          pc.phone_number,
          pc.contact_name,
          cc.cost_amount,
          cc.currency,
          cc.service_provider
        FROM conversation_messages cm
        JOIN phone_contacts pc ON cm.contact_id = pc.id
        LEFT JOIN call_costs cc ON cm.id = cc.conversation_message_id AND cc.service_type = 'sms'
        WHERE pc.phone_number = $1 AND cm.message_type = 'sms'
        ORDER BY cm.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await pool.query(query, [phoneNumber, cappedLimit, offset]);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM conversation_messages cm
        JOIN phone_contacts pc ON cm.contact_id = pc.id
        WHERE pc.phone_number = $1 AND cm.message_type = 'sms'
      `;
      const countResult = await pool.query(countQuery, [phoneNumber]);

      return {
        messages: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: cappedLimit,
          offset,
          hasMore: offset + cappedLimit < parseInt(countResult.rows[0].total)
        }
      };
    } catch (error) {
      logger.error('Failed to get message history:', error);
      throw error;
    }
  }

  /**
   * Batch get message history for multiple phone numbers (prevents N+1 queries)
   * @param {string[]} phoneNumbers - Array of phone numbers
   * @param {number} limitPerContact - Maximum messages per contact
   * @returns {Promise<object>} - Map of phone numbers to their message histories
   */
  async getBatchMessageHistory(phoneNumbers, limitPerContact = 10) {
    try {
      if (!phoneNumbers || phoneNumbers.length === 0) {
        return {};
      }

      // Cap limit at 50 per contact to prevent excessive data
      const cappedLimit = Math.min(limitPerContact, 50);

      // Use window function to limit messages per contact efficiently
      const query = `
        WITH ranked_messages AS (
          SELECT
            cm.id,
            cm.contact_id,
            cm.direction,
            cm.message_type,
            cm.message_content,
            cm.metadata,
            cm.created_at,
            pc.phone_number,
            pc.contact_name,
            cc.cost_amount,
            cc.currency,
            ROW_NUMBER() OVER (PARTITION BY pc.phone_number ORDER BY cm.created_at DESC) as rn
          FROM conversation_messages cm
          JOIN phone_contacts pc ON cm.contact_id = pc.id
          LEFT JOIN call_costs cc ON cm.id = cc.conversation_message_id AND cc.service_type = 'sms'
          WHERE pc.phone_number = ANY($1) AND cm.message_type = 'sms'
        )
        SELECT * FROM ranked_messages
        WHERE rn <= $2
        ORDER BY phone_number, created_at DESC
      `;

      const result = await pool.query(query, [phoneNumbers, cappedLimit]);

      // Group messages by phone number
      const messagesByPhone = {};
      result.rows.forEach(row => {
        if (!messagesByPhone[row.phone_number]) {
          messagesByPhone[row.phone_number] = [];
        }
        messagesByPhone[row.phone_number].push(row);
      });

      return messagesByPhone;
    } catch (error) {
      logger.error('Failed to get batch message history:', error);
      throw error;
    }
  }

  /**
   * Get total SMS costs
   * @param {Date} startDate - Start date for cost calculation
   * @param {Date} endDate - End date for cost calculation
   * @returns {Promise<object>}
   */
  async getTotalSMSCosts(startDate = null, endDate = null) {
    try {
      let query = `
        SELECT
          COUNT(*) as total_messages,
          SUM(cost_amount) as total_cost,
          currency
        FROM call_costs
        WHERE service_type = 'sms' AND service_provider = 'twilio'
      `;
      const params = [];

      if (startDate) {
        params.push(startDate);
        query += ` AND billing_date >= $${params.length}`;
      }

      if (endDate) {
        params.push(endDate);
        query += ` AND billing_date <= $${params.length}`;
      }

      query += ' GROUP BY currency';

      const result = await pool.query(query, params);
      return result.rows[0] || { total_messages: 0, total_cost: 0, currency: 'USD' };
    } catch (error) {
      logger.error('Failed to get total SMS costs:', error);
      throw error;
    }
  }
}

// Export singleton instance
const twilioService = new TwilioService();
export default twilioService;

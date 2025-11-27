// Last Modified: 2025-11-23 17:30
/**
 * Vapi Voice AI Service
 * Handles AI-powered voice calls with Claude integration
 */

import Vapi from '@vapi-ai/web';
import pool from '../config/database.js';
import logger from '../config/logger.js';

class VapiService {
  constructor() {
    this.apiKey = process.env.VAPI_API_KEY;
    this.phoneNumber = process.env.VAPI_PHONE_NUMBER;
    this.assistantId = process.env.VAPI_ASSISTANT_ID;
    this.webhookUrl = process.env.VAPI_WEBHOOK_URL;

    if (!this.apiKey) {
      logger.warn('VAPI_API_KEY not configured');
    }
  }

  /**
   * Initialize Vapi client
   */
  getClient() {
    if (!this.apiKey) {
      throw new Error('Vapi API key not configured');
    }
    return new Vapi(this.apiKey);
  }

  /**
   * Create outbound call
   * @param {string} phoneNumber - Target phone number
   * @param {string} assistantId - Optional assistant ID (uses default if not provided)
   * @returns {Promise<Object>} Call details
   */
  async createCall(phoneNumber, assistantId = null) {
    try {
      const vapi = this.getClient();

      // Create call configuration
      const callConfig = {
        phoneNumberId: this.phoneNumber,
        customer: {
          number: phoneNumber
        },
        assistantId: assistantId || this.assistantId
      };

      logger.info(`Creating outbound call to ${phoneNumber}`);
      const call = await vapi.start(callConfig);

      // Store call record in database
      await this.storeCallRecord({
        callId: call.id,
        phoneNumber,
        status: 'initiated',
        direction: 'outbound',
        assistantId: assistantId || this.assistantId
      });

      return call;
    } catch (error) {
      logger.error('Error creating Vapi call:', error);
      throw error;
    }
  }

  /**
   * Create or update AI assistant configuration
   * @param {Object} config - Assistant configuration
   * @returns {Promise<Object>} Assistant details
   */
  async createAssistant(config) {
    try {
      const assistantConfig = {
        name: config.name || 'BollaLabz AI Assistant',
        model: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-5-20250929',
          messages: [
            {
              role: 'system',
              content: config.systemPrompt || this.getDefaultSystemPrompt()
            }
          ],
          temperature: 0.7,
          maxTokens: 4096
        },
        voice: {
          provider: 'elevenlabs',
          voiceId: config.voiceId || 'ErXwobaYiN019PkySvjV' // Default ElevenLabs voice
        },
        firstMessage: config.firstMessage || "Hi, I'm your AI assistant. How can I help you today?",
        serverUrl: this.webhookUrl,
        functions: [
          {
            name: 'createTask',
            description: 'Create a new task in the system',
            parameters: {
              type: 'object',
              properties: {
                taskName: { type: 'string', description: 'Name of the task' },
                description: { type: 'string', description: 'Task description' },
                priority: { type: 'number', description: 'Priority (1-5)' },
                dueDate: { type: 'string', description: 'Due date (ISO format)' }
              },
              required: ['taskName']
            }
          },
          {
            name: 'scheduleEvent',
            description: 'Schedule a calendar event',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Event title' },
                startTime: { type: 'string', description: 'Start time (ISO format)' },
                endTime: { type: 'string', description: 'End time (ISO format)' },
                description: { type: 'string', description: 'Event description' }
              },
              required: ['title', 'startTime', 'endTime']
            }
          },
          {
            name: 'searchContacts',
            description: 'Search for contacts in the database',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' }
              },
              required: ['query']
            }
          }
        ]
      };

      logger.info('Creating Vapi assistant');

      // Note: Actual Vapi API call would go here
      // For now, returning configuration that would be used
      return {
        id: this.assistantId,
        config: assistantConfig
      };
    } catch (error) {
      logger.error('Error creating Vapi assistant:', error);
      throw error;
    }
  }

  /**
   * Get default system prompt from project vision
   */
  getDefaultSystemPrompt() {
    return `You are an AI assistant for BollaLabz, a comprehensive personal command center.

Your role is to:
1. Help users manage tasks, calendar events, and contacts
2. Provide intelligent assistance with zero cognitive load
3. Remember context from all previous interactions
4. Proactively anticipate user needs
5. Track costs and maintain efficiency

Core capabilities:
- Create and manage tasks
- Schedule calendar events
- Search and manage contacts
- Provide insights from user data
- Execute automated workflows

Always be helpful, efficient, and context-aware. Use the available functions to take action when appropriate.`;
  }

  /**
   * Handle Vapi webhook events
   * @param {Object} event - Webhook event payload
   * @returns {Promise<Object>} Response data
   */
  async handleWebhook(event) {
    try {
      logger.info('Processing Vapi webhook:', { type: event.type, callId: event.callId });

      switch (event.type) {
        case 'call-started':
          return await this.handleCallStarted(event);

        case 'call-ended':
          return await this.handleCallEnded(event);

        case 'function-call':
          return await this.handleFunctionCall(event);

        case 'transcript':
          return await this.handleTranscript(event);

        case 'status-update':
          return await this.handleStatusUpdate(event);

        default:
          logger.warn(`Unknown webhook event type: ${event.type}`);
          return { success: true, message: 'Event received' };
      }
    } catch (error) {
      logger.error('Error handling Vapi webhook:', error);
      throw error;
    }
  }

  /**
   * Handle call started event
   */
  async handleCallStarted(event) {
    const { callId, phoneNumber } = event;

    await pool.query(
      `UPDATE conversation_messages
       SET metadata = jsonb_set(
         COALESCE(metadata, '{}'::jsonb),
         '{vapiCallId}',
         $1::jsonb
       )
       WHERE metadata->>'vapiCallId' = $2`,
      [JSON.stringify(callId), callId]
    );

    logger.info(`Call started: ${callId}`);
    return { success: true, message: 'Call started' };
  }

  /**
   * Handle call ended event
   */
  async handleCallEnded(event) {
    const { callId, duration, cost, transcript } = event;

    try {
      // Find the conversation message
      const messageResult = await pool.query(
        `SELECT cm.id, cm.contact_id
         FROM conversation_messages cm
         WHERE cm.metadata->>'vapiCallId' = $1`,
        [callId]
      );

      if (messageResult.rows.length === 0) {
        logger.warn(`No conversation message found for call: ${callId}`);
        return { success: true, message: 'Call ended' };
      }

      const message = messageResult.rows[0];

      // Update conversation message with transcript
      await pool.query(
        `UPDATE conversation_messages
         SET transcript = $1,
             metadata = jsonb_set(
               COALESCE(metadata, '{}'::jsonb),
               '{callEnded}',
               $2::jsonb
             ),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [transcript, JSON.stringify(new Date().toISOString()), message.id]
      );

      // Store call cost
      if (cost > 0) {
        await pool.query(
          `INSERT INTO call_costs (
            conversation_message_id,
            service_provider,
            service_type,
            cost_amount,
            currency,
            metadata
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            message.id,
            'vapi',
            'voice',
            cost,
            'USD',
            JSON.stringify({ duration, callId })
          ]
        );
      }

      // Update contact's last contact date
      await pool.query(
        `UPDATE phone_contacts
         SET last_contact_date = CURRENT_TIMESTAMP,
             conversation_count = conversation_count + 1
         WHERE id = $1`,
        [message.contact_id]
      );

      logger.info(`Call ended: ${callId}, duration: ${duration}s, cost: $${cost}`);
      return { success: true, message: 'Call ended and recorded' };
    } catch (error) {
      logger.error('Error processing call ended event:', error);
      throw error;
    }
  }

  /**
   * Handle function call from AI assistant
   */
  async handleFunctionCall(event) {
    const { functionName, parameters, callId } = event;

    logger.info(`Function call: ${functionName}`, parameters);

    try {
      let result;

      switch (functionName) {
        case 'createTask':
          result = await this.executeCreateTask(parameters);
          break;

        case 'scheduleEvent':
          result = await this.executeScheduleEvent(parameters);
          break;

        case 'searchContacts':
          result = await this.executeSearchContacts(parameters);
          break;

        default:
          result = { error: `Unknown function: ${functionName}` };
      }

      return {
        success: true,
        result
      };
    } catch (error) {
      logger.error(`Error executing function ${functionName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle transcript update
   */
  async handleTranscript(event) {
    const { callId, transcript, speaker } = event;

    // Store transcript segment in real-time
    await pool.query(
      `UPDATE conversation_messages
       SET metadata = jsonb_set(
         COALESCE(metadata, '{}'::jsonb),
         '{liveTranscript}',
         $1::jsonb
       )
       WHERE metadata->>'vapiCallId' = $2`,
      [JSON.stringify({ transcript, speaker, timestamp: new Date().toISOString() }), callId]
    );

    return { success: true, message: 'Transcript updated' };
  }

  /**
   * Handle status update
   */
  async handleStatusUpdate(event) {
    const { callId, status } = event;

    await pool.query(
      `UPDATE conversation_messages
       SET metadata = jsonb_set(
         COALESCE(metadata, '{}'::jsonb),
         '{callStatus}',
         $1::jsonb
       )
       WHERE metadata->>'vapiCallId' = $2`,
      [JSON.stringify(status), callId]
    );

    return { success: true, message: 'Status updated' };
  }

  /**
   * Execute createTask function
   */
  async executeCreateTask(params) {
    const { taskName, description, priority = 3, dueDate } = params;

    const result = await pool.query(
      `INSERT INTO scheduled_tasks (
        task_name,
        task_description,
        priority,
        scheduled_for,
        status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [taskName, description, priority, dueDate || null, 'pending']
    );

    logger.info(`Task created via Vapi: ${taskName}`);
    return { taskId: result.rows[0].id, message: 'Task created successfully' };
  }

  /**
   * Execute scheduleEvent function
   */
  async executeScheduleEvent(params) {
    const { title, startTime, endTime, description } = params;

    const result = await pool.query(
      `INSERT INTO calendar_events (
        event_title,
        event_description,
        start_time,
        end_time
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [title, description, startTime, endTime]
    );

    logger.info(`Event scheduled via Vapi: ${title}`);
    return { eventId: result.rows[0].id, message: 'Event scheduled successfully' };
  }

  /**
   * Execute searchContacts function
   */
  async executeSearchContacts(params) {
    const { query } = params;

    const result = await pool.query(
      `SELECT id, phone_number, contact_name, contact_email, last_contact_date
       FROM phone_contacts
       WHERE contact_name ILIKE $1
          OR contact_email ILIKE $1
          OR phone_number ILIKE $1
       LIMIT 10`,
      [`%${query}%`]
    );

    logger.info(`Contact search via Vapi: ${query}, found: ${result.rows.length}`);
    return {
      contacts: result.rows,
      count: result.rows.length
    };
  }

  /**
   * Store call record in database
   */
  async storeCallRecord({ callId, phoneNumber, status, direction, assistantId }) {
    try {
      // Find or create contact
      let contactResult = await pool.query(
        'SELECT id FROM phone_contacts WHERE phone_number = $1',
        [phoneNumber]
      );

      let contactId;
      if (contactResult.rows.length === 0) {
        const newContact = await pool.query(
          `INSERT INTO phone_contacts (phone_number, contact_name)
           VALUES ($1, $2)
           RETURNING id`,
          [phoneNumber, 'Unknown']
        );
        contactId = newContact.rows[0].id;
      } else {
        contactId = contactResult.rows[0].id;
      }

      // Create conversation message
      await pool.query(
        `INSERT INTO conversation_messages (
          contact_id,
          direction,
          message_type,
          message_content,
          metadata
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          contactId,
          direction,
          'voice',
          'Voice call via Vapi',
          JSON.stringify({
            vapiCallId: callId,
            status,
            assistantId,
            initiatedAt: new Date().toISOString()
          })
        ]
      );

      logger.info(`Call record stored: ${callId}`);
    } catch (error) {
      logger.error('Error storing call record:', error);
      throw error;
    }
  }

  /**
   * Get call transcript
   * @param {string} callId - Vapi call ID
   * @returns {Promise<Object>} Transcript data
   */
  async getCallTranscript(callId) {
    try {
      const result = await pool.query(
        `SELECT cm.transcript, cm.metadata, cm.created_at
         FROM conversation_messages cm
         WHERE cm.metadata->>'vapiCallId' = $1`,
        [callId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return {
        transcript: result.rows[0].transcript,
        metadata: result.rows[0].metadata,
        createdAt: result.rows[0].created_at
      };
    } catch (error) {
      logger.error('Error getting call transcript:', error);
      throw error;
    }
  }

  /**
   * List calls with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of calls
   */
  async listCalls({ page = 1, limit = 20, contactId = null, status = null }) {
    try {
      let query = `
        SELECT
          cm.id,
          cm.contact_id,
          pc.contact_name,
          pc.phone_number,
          cm.direction,
          cm.transcript,
          cm.metadata,
          cm.created_at,
          cc.cost_amount as cost,
          cc.currency
        FROM conversation_messages cm
        JOIN phone_contacts pc ON cm.contact_id = pc.id
        LEFT JOIN call_costs cc ON cm.id = cc.conversation_message_id
        WHERE cm.message_type = 'voice'
          AND cm.metadata->>'vapiCallId' IS NOT NULL
      `;

      const params = [];
      let paramIndex = 1;

      if (contactId) {
        query += ` AND cm.contact_id = $${paramIndex}`;
        params.push(contactId);
        paramIndex++;
      }

      if (status) {
        query += ` AND cm.metadata->>'callStatus' = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` ORDER BY cm.created_at DESC`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);

      return {
        calls: result.rows,
        page,
        limit,
        total: result.rows.length
      };
    } catch (error) {
      logger.error('Error listing calls:', error);
      throw error;
    }
  }
}

export default new VapiService();

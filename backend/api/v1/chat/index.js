// Last Modified: 2025-11-23 17:30
/**
 * Chat API Routes
 * Comprehensive AI chat with Claude, streaming, history, and tool execution
 */

import express from 'express';
import claudeService, { ConversationContext, AVAILABLE_TOOLS } from '../../../services/claude.js';
import twilioService from '../../../services/twilio.js';
import costTrackingService from '../../../services/costTracking.js';
import logger from '../../../utils/logger.js';
import { requireAuth } from '../../../middleware/auth.js';
import { chatLimiter } from '../../../middleware/rateLimiter.js';
import { costControlMiddleware, SERVICE_TYPES } from '../../../middleware/costControl.js';
import Contact from '../../../models/Contact.js';
import Task from '../../../models/Task.js';
import CalendarEvent from '../../../models/CalendarEvent.js';
import ChatConversation from '../../../models/ChatConversation.js';

const router = express.Router();

/**
 * Get or create conversation context for user from database
 */
async function getConversation(userId) {
  try {
    const dbConversation = await ChatConversation.getOrCreate(userId);
    const context = new ConversationContext();

    // Load conversation data from database
    if (dbConversation.conversation_data) {
      context.fromJSON(dbConversation.conversation_data);
    }

    return context;
  } catch (error) {
    logger.error('Failed to get conversation from database:', error);
    // Fallback to new context if database fails
    return new ConversationContext();
  }
}

/**
 * Save conversation context to database
 */
async function saveConversation(userId, context) {
  try {
    await ChatConversation.update(userId, context.toJSON());
  } catch (error) {
    logger.error('Failed to save conversation to database:', error);
  }
}

/**
 * Execute tool calls with real implementations
 */
async function executeToolCall(toolName, toolInput, userId) {
  logger.info(`Executing tool: ${toolName}`, toolInput);

  try {
    switch (toolName) {
      case 'searchContacts': {
        // Real contact search implementation
        const { query: searchQuery, limit = 10 } = toolInput;

        const result = await Contact.findAll({
          userId,
          page: 1,
          limit,
          search: searchQuery
        });

        return {
          success: true,
          results: result.data.map(contact => ({
            id: contact.id,
            name: contact.contact_name,
            phone: contact.phone_number,
            email: contact.contact_email,
            conversationCount: contact.conversation_count,
            lastContact: contact.last_contact_date,
            notes: contact.notes
          })),
          count: result.data.length,
          message: `Found ${result.data.length} contact(s) matching "${searchQuery}"`
        };
      }

      case 'createTask': {
        // Real task creation implementation
        const { title, description, priority, dueDate } = toolInput;

        // Map priority from tool format to database format (1-5)
        const priorityMap = {
          'low': 4,
          'medium': 3,
          'high': 2,
          'urgent': 1
        };

        const task = await Task.create({
          userId,
          title,
          description: description || '',
          priority: priorityMap[priority] || 3,
          status: 'pending',
          due_date: dueDate || null,
          metadata: {
            createdVia: 'chat',
            createdAt: new Date().toISOString()
          }
        });

        return {
          success: true,
          taskId: task.id,
          task: {
            id: task.id,
            title: task.title,
            description: task.description,
            priority: priority,
            dueDate: task.due_date,
            status: task.status
          },
          message: `Task "${title}" created with ${priority} priority`
        };
      }

      case 'scheduleEvent': {
        // Real event scheduling implementation
        const { title, description, startTime, endTime, location } = toolInput;

        const event = await CalendarEvent.create({
          userId,
          title,
          description: description || '',
          startTime,
          endTime: endTime || null,
          location: location || '',
          type: 'appointment',
          metadata: {
            createdVia: 'chat',
            createdAt: new Date().toISOString()
          }
        });

        return {
          success: true,
          eventId: event.id,
          event: {
            id: event.id,
            title: event.title,
            description: event.description,
            startTime: event.start_time,
            endTime: event.end_time,
            location: event.location
          },
          message: `Event "${title}" scheduled for ${startTime}`
        };
      }

      case 'sendSMS': {
        // Real SMS sending via Twilio
        const { to, message } = toolInput;

        if (!twilioService.isInitialized()) {
          return {
            success: false,
            error: 'Twilio service not initialized. SMS features are disabled.'
          };
        }

        // Send SMS
        const twilioResponse = await twilioService.sendSMS(to, message);

        // Store in database
        const { message: storedMessage, contact } = await twilioService.storeOutboundSMS(
          to,
          message,
          twilioResponse
        );

        // Track cost if available
        if (twilioResponse.price) {
          await costTrackingService.trackTwilioSMSCost(
            userId,
            storedMessage.id,
            { amount: Math.abs(parseFloat(twilioResponse.price)), currency: twilioResponse.priceUnit },
            {
              twilioSid: twilioResponse.sid,
              direction: 'outbound',
              to,
              from: twilioResponse.from
            }
          );
        }

        return {
          success: true,
          messageId: twilioResponse.sid,
          to,
          contact: contact.contact_name || to,
          status: twilioResponse.status,
          message: `SMS sent to ${contact.contact_name || to}`,
          cost: twilioResponse.price ? `$${Math.abs(parseFloat(twilioResponse.price)).toFixed(4)}` : 'pending'
        };
      }

      case 'makeCall': {
        // Real call via Twilio
        const { to, message: callMessage } = toolInput;

        if (!twilioService.isInitialized()) {
          return {
            success: false,
            error: 'Twilio service not initialized. Voice features are disabled.'
          };
        }

        // Note: Actual call implementation would use Twilio Voice API
        // For now, we return a placeholder that indicates the feature is available
        // but requires additional Twilio Voice configuration

        return {
          success: false,
          error: 'Voice call feature requires additional Twilio Voice configuration. Please use SMS for now.',
          to,
          suggestedAction: 'Consider sending an SMS instead using the sendSMS tool'
        };
      }

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`
        };
    }
  } catch (error) {
    logger.error(`Tool execution error: ${toolName}`, error);
    return {
      success: false,
      error: error.message || 'Tool execution failed'
    };
  }
}

/**
 * POST /api/v1/chat
 * Send a message and get AI response
 * @access Private (requires authentication)
 * @security Rate limited to 100 requests per hour
 * @security Cost control: Daily Claude API limit enforced
 */
router.post('/', requireAuth, costControlMiddleware(SERVICE_TYPES.CLAUDE), chatLimiter, async (req, res) => {
  try {
    const { message, context = {}, useTools = true } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Get user ID from auth middleware
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    // Get conversation context from database
    const conversation = await getConversation(userId);

    // Add user message to context
    conversation.addUserMessage(message);

    // Build system prompt with user context
    const systemPrompt = claudeService.buildSystemPrompt({
      page: context.page,
      userName: req.user?.full_name || req.user?.email || 'User',
      ...context
    });

    // Prepare tools if enabled
    const tools = useTools ? AVAILABLE_TOOLS : null;

    // Call Claude API
    const result = await claudeService.chat(
      conversation.getMessages(),
      systemPrompt,
      tools
    );

    if (!result.success) {
      throw new Error('Failed to get response from Claude');
    }

    const response = result.response;

    // Handle tool calls if present
    let toolResults = [];
    if (response.stop_reason === 'tool_use') {
      for (const content of response.content) {
        if (content.type === 'tool_use') {
          const toolResult = await executeToolCall(content.name, content.input, userId);
          toolResults.push({
            toolName: content.name,
            toolInput: content.input,
            result: toolResult
          });

          // Add tool result to conversation
          conversation.addMessage('assistant', response.content);
          conversation.addMessage('user', [
            {
              type: 'tool_result',
              tool_use_id: content.id,
              content: JSON.stringify(toolResult)
            }
          ]);

          // Get follow-up response
          const followUp = await claudeService.chat(
            conversation.getMessages(),
            systemPrompt,
            tools
          );

          if (followUp.success) {
            response.content = followUp.response.content;
            result.cost.totalCost += followUp.cost.totalCost;
            result.cost.inputTokens += followUp.cost.inputTokens;
            result.cost.outputTokens += followUp.cost.outputTokens;
          }
        }
      }
    }

    // Extract text response
    const textContent = response.content.find(c => c.type === 'text');
    const responseText = textContent?.text || 'Sorry, I could not generate a response.';

    // Add assistant response to context
    conversation.addAssistantMessage(responseText);

    // Save conversation to database
    await saveConversation(userId, conversation);

    // Track Claude API cost in database
    await costTrackingService.trackClaudeCost(userId, result.cost, {
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
      context: 'chat',
      toolsUsed: toolResults.length > 0,
      messageCount: conversation.getMessages().length
    });

    // Log cost
    logger.cost('claude-chat', result.cost.totalCost, {
      inputTokens: result.cost.inputTokens,
      outputTokens: result.cost.outputTokens,
      userId
    });

    res.json({
      success: true,
      response: responseText,
      toolsUsed: toolResults.length > 0,
      toolResults,
      cost: result.cost,
      messageCount: conversation.getMessages().length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Chat API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/chat/stream
 * Stream chat response from Claude
 * @access Private (requires authentication)
 * @security Rate limited to 100 requests per hour
 * @security Cost control: Daily Claude API limit enforced
 */
router.post('/stream', requireAuth, costControlMiddleware(SERVICE_TYPES.CLAUDE), chatLimiter, async (req, res) => {
  try {
    const { message, context = {}, useTools = true } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Get user ID
    const userId = req.user?.id;
    if (!userId) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'User authentication required' })}\n\n`);
      res.end();
      return;
    }

    // Get conversation context from database
    const conversation = await getConversation(userId);

    // Add user message to context
    conversation.addUserMessage(message);

    // Build system prompt
    const systemPrompt = claudeService.buildSystemPrompt({
      page: context.page,
      userName: req.user?.full_name || req.user?.email || 'User',
      ...context
    });

    // Prepare tools
    const tools = useTools ? AVAILABLE_TOOLS : null;

    let fullResponse = '';

    // Stream response
    const result = await claudeService.streamChat(
      conversation.getMessages(),
      systemPrompt,
      tools,
      (chunk) => {
        if (chunk.type === 'text') {
          fullResponse += chunk.text;
          res.write(`data: ${JSON.stringify({ type: 'text', text: chunk.text })}\n\n`);
        } else if (chunk.type === 'content_block_delta') {
          if (chunk.delta.type === 'text_delta') {
            fullResponse += chunk.delta.text;
            res.write(`data: ${JSON.stringify({ type: 'text', text: chunk.delta.text })}\n\n`);
          }
        }
      }
    );

    // Add assistant response to context
    conversation.addAssistantMessage(fullResponse);

    // Save conversation to database
    await saveConversation(userId, conversation);

    // Track Claude API cost in database
    await costTrackingService.trackClaudeCost(userId, result.cost, {
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
      context: 'chat-stream',
      messageCount: conversation.getMessages().length
    });

    // Send final message with cost
    res.write(`data: ${JSON.stringify({
      type: 'done',
      cost: result.cost,
      messageCount: conversation.getMessages().length
    })}\n\n`);

    // Log cost
    logger.cost('claude-stream', result.cost.totalCost, {
      inputTokens: result.cost.inputTokens,
      outputTokens: result.cost.outputTokens,
      userId
    });

    res.end();

  } catch (error) {
    logger.error('Chat stream API error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

/**
 * GET /api/v1/chat/history
 * Get conversation history
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    const conversation = await getConversation(userId);

    res.json({
      success: true,
      messages: conversation.getMessages(),
      messageCount: conversation.getMessages().length,
      metadata: conversation.metadata
    });

  } catch (error) {
    logger.error('Chat history API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve chat history',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/chat/clear
 * Clear conversation history
 */
router.post('/clear', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    const conversation = await getConversation(userId);
    const previousCount = conversation.getMessages().length;

    conversation.clear();
    await saveConversation(userId, conversation);

    res.json({
      success: true,
      message: 'Conversation history cleared',
      clearedMessages: previousCount
    });

  } catch (error) {
    logger.error('Chat clear API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear chat history',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/chat/tools
 * Get available tools
 */
router.get('/tools', async (req, res) => {
  try {
    res.json({
      success: true,
      tools: AVAILABLE_TOOLS.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema.properties,
        required: tool.input_schema.required
      }))
    });

  } catch (error) {
    logger.error('Chat tools API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve tools',
      message: error.message
    });
  }
});

export default router;

/**
 * Claude AI Service
 * Handles all interactions with Anthropic's Claude API
 * Last Modified: 2025-11-23 18:30
 */

import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger.js';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096', 10);

// Cost per million tokens (in USD)
const COSTS = {
  'claude-sonnet-4-5-20250929': {
    input: 3.00,  // $3 per million input tokens
    output: 15.00, // $15 per million output tokens
  },
};

/**
 * SECURITY: Sanitize user input to prevent prompt injection attacks
 * Blocks common injection patterns and limits input length
 * Added: 2025-11-23
 */
function sanitizePrompt(userInput) {
  if (typeof userInput !== 'string') {
    throw new Error('Invalid input type');
  }

  // Block common prompt injection patterns
  const blockedPatterns = [
    /ignore\s+previous\s+instructions?/i,
    /system:/i,
    /\{\{.*\}\}/,
    /```[\s\S]*```/,
    /<script/i,
    /\[INST\]/i,
    /disregard\s+all\s+previous/i,
    /forget\s+everything/i,
    /new\s+instructions?:/i,
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(userInput)) {
      logger.warn('Blocked prompt injection attempt', {
        pattern: pattern.toString(),
        input: userInput.substring(0, 100),
      });
      throw new Error('Invalid input detected');
    }
  }

  // Prevent token stuffing attacks
  const MAX_PROMPT_LENGTH = 4000;
  if (userInput.length > MAX_PROMPT_LENGTH) {
    logger.warn('Truncating excessively long input', {
      originalLength: userInput.length,
      truncatedLength: MAX_PROMPT_LENGTH,
    });
    userInput = userInput.substring(0, MAX_PROMPT_LENGTH);
  }

  // Escape special characters to prevent injection
  return userInput
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .trim();
}

/**
 * Calculate cost of API usage
 */
export function calculateCost(model, inputTokens, outputTokens) {
  const modelCosts = COSTS[model] || COSTS[MODEL];
  const inputCost = (inputTokens / 1_000_000) * modelCosts.input;
  const outputCost = (outputTokens / 1_000_000) * modelCosts.output;
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}

/**
 * Build system prompt for BollaLabz
 * SECURITY: Now sanitizes user-provided context to prevent injection
 */
export function buildSystemPrompt(userContext = {}) {
  // Sanitize user-provided values
  const page = sanitizePrompt(userContext.page || 'BollaLabz Command Center');
  const userName = sanitizePrompt(userContext.userName || 'User');

  return `You are the BollaLabz AI Assistant - an intelligent, proactive assistant for a comprehensive personal command center.

CURRENT CONTEXT:
- User: ${userName}
- Current Page: ${page}
- Platform: BollaLabz - AI-powered personal command center

CORE PRINCIPLES (Zero Cognitive Load Philosophy):
1. **Zero Cognitive Load** - Remember everything, anticipate needs
2. **Proactive Intelligence** - Suggest before being asked
3. **Context Everywhere** - Use full historical context
4. **Human-First Design** - Natural, conversational interaction
5. **Seamless Extension** - Act as an extension of human capability

AVAILABLE CAPABILITIES (via function calling):
1. **searchContacts** - Search and retrieve contact information
2. **createTask** - Create tasks with priorities and due dates
3. **scheduleEvent** - Schedule calendar events
4. **sendSMS** - Send SMS messages via Twilio
5. **makeCall** - Initiate phone calls via Twilio

AVAILABLE FEATURES:
1. **Dashboard** - Overview, quick stats, insights
2. **Contacts** - Contact and relationship management
3. **Conversations** - SMS/call conversation history
4. **Tasks** - Task management with smart scheduling
5. **Calendar** - Event and appointment management
6. **Financial Analytics** - Financial insights, budgets, spending
7. **Credit Score** - Credit monitoring and recommendations
8. **People Analytics** - Relationship insights, interaction metrics

YOUR ROLE:
- Provide intelligent, context-aware assistance
- Proactively suggest actions when appropriate
- Execute tasks using available tools when requested
- Maintain conversation context across messages
- Be conversational, friendly, and helpful
- Keep responses concise but complete
- Use markdown formatting for clarity

RESPONSE GUIDELINES:
- Start with acknowledgment of the user's intent
- Provide clear, actionable guidance
- Use bullet points for multiple items
- Include relevant context when suggesting actions
- When using tools, explain what you're doing
- If uncertain, ask clarifying questions
- Always maintain user privacy and data security

Remember: You're not just answering questions - you're serving as an intelligent extension of the user's capabilities, helping them achieve zero cognitive load in managing their digital life.`;
}

/**
 * Define available tools for function calling
 */
export const AVAILABLE_TOOLS = [
  {
    name: 'searchContacts',
    description: 'Search for contacts by name, phone number, or email. Returns matching contact information.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (name, phone, or email)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'createTask',
    description: 'Create a new task with title, description, priority, and optional due date.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Task title',
        },
        description: {
          type: 'string',
          description: 'Task description (optional)',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Task priority',
        },
        dueDate: {
          type: 'string',
          description: 'Due date in ISO 8601 format (optional)',
        },
      },
      required: ['title', 'priority'],
    },
  },
  {
    name: 'scheduleEvent',
    description: 'Schedule a calendar event with title, date, time, and optional duration.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Event title',
        },
        description: {
          type: 'string',
          description: 'Event description (optional)',
        },
        startTime: {
          type: 'string',
          description: 'Start time in ISO 8601 format',
        },
        endTime: {
          type: 'string',
          description: 'End time in ISO 8601 format (optional)',
        },
        location: {
          type: 'string',
          description: 'Event location (optional)',
        },
      },
      required: ['title', 'startTime'],
    },
  },
  {
    name: 'sendSMS',
    description: 'Send an SMS message to a phone number.',
    input_schema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Phone number to send to (E.164 format)',
        },
        message: {
          type: 'string',
          description: 'Message content',
        },
      },
      required: ['to', 'message'],
    },
  },
  {
    name: 'makeCall',
    description: 'Initiate a phone call to a phone number.',
    input_schema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Phone number to call (E.164 format)',
        },
        message: {
          type: 'string',
          description: 'Message to say when call is answered (optional)',
        },
      },
      required: ['to'],
    },
  },
];

/**
 * Send a chat message to Claude
 */
export async function chat(messages, systemPrompt = null, tools = null) {
  try {
    const requestParams = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages,
    };

    if (systemPrompt) {
      requestParams.system = systemPrompt;
    }

    if (tools && tools.length > 0) {
      requestParams.tools = tools;
    }

    const response = await anthropic.messages.create(requestParams);

    // Calculate cost
    const cost = calculateCost(
      MODEL,
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    logger.info('Claude API call completed', {
      model: MODEL,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cost: cost.totalCost,
    });

    return {
      success: true,
      response,
      cost,
      stopReason: response.stop_reason,
    };
  } catch (error) {
    logger.error('Claude API error:', error);
    throw error;
  }
}

/**
 * Stream a chat message from Claude
 */
export async function streamChat(messages, systemPrompt = null, tools = null, onChunk = null) {
  try {
    const requestParams = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages,
      stream: true,
    };

    if (systemPrompt) {
      requestParams.system = systemPrompt;
    }

    if (tools && tools.length > 0) {
      requestParams.tools = tools;
    }

    const stream = await anthropic.messages.stream(requestParams);

    let inputTokens = 0;
    let outputTokens = 0;

    stream.on('message', (message) => {
      if (message.usage) {
        inputTokens = message.usage.input_tokens || 0;
        outputTokens = message.usage.output_tokens || 0;
      }
    });

    if (onChunk) {
      stream.on('text', (text) => {
        onChunk({ type: 'text', text });
      });

      stream.on('content_block_start', (block) => {
        onChunk({ type: 'content_block_start', block });
      });

      stream.on('content_block_delta', (delta) => {
        onChunk({ type: 'content_block_delta', delta });
      });
    }

    const response = await stream.finalMessage();

    // Calculate cost
    const cost = calculateCost(MODEL, inputTokens, outputTokens);

    logger.info('Claude streaming API call completed', {
      model: MODEL,
      inputTokens,
      outputTokens,
      cost: cost.totalCost,
    });

    return {
      success: true,
      response,
      cost,
      stopReason: response.stop_reason,
    };
  } catch (error) {
    logger.error('Claude streaming API error:', error);
    throw error;
  }
}

/**
 * Manage conversation context
 */
export class ConversationContext {
  constructor(maxMessages = 50) {
    this.messages = [];
    this.maxMessages = maxMessages;
    this.metadata = {};
  }

  /**
   * Add a message to the context
   */
  addMessage(role, content) {
    this.messages.push({ role, content });

    // Trim if exceeding max messages
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  /**
   * Add user message
   * SECURITY: Sanitizes user input before adding to context
   */
  addUserMessage(content) {
    const sanitizedContent = sanitizePrompt(content);
    this.addMessage('user', sanitizedContent);
  }

  /**
   * Add assistant message
   */
  addAssistantMessage(content) {
    this.addMessage('assistant', content);
  }

  /**
   * Get all messages
   */
  getMessages() {
    return [...this.messages];
  }

  /**
   * Clear context
   */
  clear() {
    this.messages = [];
    this.metadata = {};
  }

  /**
   * Set metadata
   */
  setMetadata(key, value) {
    this.metadata[key] = value;
  }

  /**
   * Get metadata
   */
  getMetadata(key) {
    return this.metadata[key];
  }

  /**
   * Export context to JSON
   */
  toJSON() {
    return {
      messages: this.messages,
      metadata: this.metadata,
    };
  }

  /**
   * Import context from JSON
   */
  fromJSON(data) {
    this.messages = data.messages || [];
    this.metadata = data.metadata || {};
  }
}

export default {
  chat,
  streamChat,
  buildSystemPrompt,
  calculateCost,
  ConversationContext,
  AVAILABLE_TOOLS,
};

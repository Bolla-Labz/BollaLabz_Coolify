// Last Modified: 2025-11-23 17:30
/**
 * Chat API Routes
 * Handles AI chatbot conversations using Claude API
 */

import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Validate API key is configured
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required for chat functionality');
}

/**
 * POST /api/v1/chat
 * Send a message and get AI response
 */
router.post('/', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context);

    // Build conversation history
    const messages = [];

    // Add conversation history if provided
    if (context?.history && Array.isArray(context.history)) {
      context.history.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    // Extract response text
    const responseText = response.content[0]?.text || 'Sorry, I could not generate a response.';

    res.json({
      success: true,
      response: responseText,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      message: error.message,
    });
  }
});

/**
 * Build system prompt with context
 */
function buildSystemPrompt(context) {
  const page = context?.page || 'BollaLabz Command Center';

  return `You are the BollaLabz Assistant, a helpful AI guide for the BollaLabz Command Center platform.

CURRENT CONTEXT:
- User is currently on: ${page}
- Platform: BollaLabz - AI-powered personal command center

AVAILABLE FEATURES:
1. **Dashboard** - Overview of all activity, quick stats, and insights
2. **Contacts** - Manage contacts and relationships
3. **Conversations** - View and manage SMS/call conversations
4. **Tasks** - Task management with priorities and scheduling
5. **Calendar** - Event and appointment management
6. **Financial Analytics** - Financial overview, spending insights, budgets
7. **Credit Score** - Credit monitoring and recommendations
8. **People Analytics** - Relationship insights and interaction metrics

YOUR ROLE:
- Help users navigate the platform
- Answer questions about features
- Guide users to the right pages
- Provide helpful tips and suggestions
- Be conversational and friendly
- Keep responses concise and actionable

GUIDELINES:
- Always be helpful and positive
- Use markdown for formatting (bold, lists, links)
- When suggesting navigation, use format: "Go to [Feature Name] to do X"
- If you don't know something, be honest
- Focus on the user's immediate needs
- Provide step-by-step guidance when helpful

Remember: You're assisting with BollaLabz, a comprehensive personal command center designed for zero cognitive load and seamless productivity.`;
}

export default router;

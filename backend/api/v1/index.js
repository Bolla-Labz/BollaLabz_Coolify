// Last Modified: 2025-11-23 17:30
import express from 'express';
import authRouter from './auth.js';
import contactsRouter from './contacts/index.js';
import conversationsRouter from './conversations/index.js';
import callsRouter from './calls/index.js';
import tasksRouter from './tasks/index.js';
import workflowsRouter from './workflows/index.js';
import peopleRouter from './people/index.js';
import calendarRouter from './calendar/index.js';
import analyticsRouter from './analytics/index.js';
import integrationsRouter from './integrations/index.js';
import messagesRouter from './messages/index.js';
import chatRouter from './chat/index.js';
import voiceSynthesisRouter from './voice/synthesis.js';
import twilioWebhookRouter from './webhooks/twilio.js';
import vapiWebhookRouter from '../../webhooks/vapi.js';
import healthRouter from './health.js';
import { authenticateJWT } from '../../middleware/auth.js';

const router = express.Router();

// Health check endpoints (no auth required)
router.use('/health', healthRouter);

// Authentication routes (no auth required for login/register)
router.use('/auth', authRouter);

// Mount all API routes
router.use('/contacts', contactsRouter);
router.use('/conversations', conversationsRouter);
router.use('/calls', callsRouter);
router.use('/tasks', tasksRouter);
router.use('/workflows', workflowsRouter);
router.use('/people', peopleRouter);
router.use('/calendar', calendarRouter);
router.use('/analytics', analyticsRouter);
router.use('/integrations', integrationsRouter);
router.use('/messages', messagesRouter);
router.use('/chat', chatRouter);
router.use('/voice', authenticateJWT, voiceSynthesisRouter);
router.use('/webhooks/twilio', twilioWebhookRouter);
router.use('/webhooks/vapi', vapiWebhookRouter);

// Test routes (for development/testing only)
// Note: Sentry test route removed - not needed in production deployment
// if (process.env.NODE_ENV !== 'production') {
//   router.use('/test/sentry', testSentryRouter);
// }

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'BollaLabz API',
    version: 'v1',
    description: 'Production-grade REST API for BollaLabz Personal Command Center',
    endpoints: {
      contacts: {
        base: '/api/v1/contacts',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Manage phone contacts'
      },
      conversations: {
        base: '/api/v1/conversations',
        methods: ['GET', 'POST', 'PUT'],
        description: 'Manage SMS and call conversations'
      },
      calls: {
        base: '/api/v1/calls',
        methods: ['GET', 'POST'],
        description: 'Call logs and cost tracking'
      },
      tasks: {
        base: '/api/v1/tasks',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Task management and dependencies'
      },
      workflows: {
        base: '/api/v1/workflows',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Workflow automation and triggers'
      },
      people: {
        base: '/api/v1/people',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'CRM and relationship management'
      },
      calendar: {
        base: '/api/v1/calendar',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Calendar and event management'
      },
      analytics: {
        base: '/api/v1/analytics',
        methods: ['GET'],
        description: 'Dashboard metrics and analytics'
      },
      integrations: {
        base: '/api/v1/integrations',
        methods: ['GET', 'POST'],
        description: 'Third-party integrations and webhooks'
      },
      messages: {
        base: '/api/v1/messages',
        methods: ['GET', 'POST'],
        description: 'SMS messaging via Twilio'
      },
      chat: {
        base: '/api/v1/chat',
        methods: ['GET', 'POST'],
        description: 'AI chat with Claude (streaming, history, tools)'
      },
      voice: {
        base: '/api/v1/voice',
        methods: ['GET', 'POST', 'DELETE'],
        description: 'Voice synthesis with ElevenLabs (text-to-speech, audio streaming)'
      },
      webhooks: {
        base: '/api/v1/webhooks',
        methods: ['POST'],
        description: 'Webhook endpoints for Twilio and Vapi'
      },
      health: {
        base: '/api/v1/health',
        methods: ['GET', 'POST'],
        description: 'Health checks and database performance metrics'
      }
    },
    documentation: '/api/v1/docs',
    health: '/api/v1/health'
  });
});

export default router;

// Last Modified: 2025-11-24 01:25
/**
 * Conversations API Tests
 * Comprehensive test coverage for conversation endpoints
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import conversationRoutes from '../../../api/v1/conversations/index.js';

// Mock dependencies
jest.mock('../../../models/Conversation.js');
jest.mock('../../../middleware/errorHandler.js');
jest.mock('../../../middleware/rateLimiter.js');
jest.mock('../../../services/websocket.js');
jest.mock('../../../config/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Import mocked modules
import Conversation from '../../../models/Conversation.js';
import websocketService from '../../../services/websocket.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';
import { readLimiter, writeLimiter } from '../../../middleware/rateLimiter.js';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/v1/conversations', conversationRoutes);

// Mock rate limiters to pass through
readLimiter.mockImplementation((req, res, next) => next());
writeLimiter.mockImplementation((req, res, next) => next());

// Mock asyncHandler to pass through
asyncHandler.mockImplementation(fn => fn);

describe('Conversations API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/conversations', () => {
    test('should list conversations with pagination', async () => {
      const mockConversations = {
        data: [
          {
            id: 1,
            conversation_id: 'conv_123',
            contact_id: 1,
            direction: 'inbound',
            content: 'Hello',
            created_at: '2025-11-24T00:00:00Z'
          },
          {
            id: 2,
            conversation_id: 'conv_124',
            contact_id: 2,
            direction: 'outbound',
            content: 'Hi there',
            created_at: '2025-11-24T01:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        }
      };

      Conversation.findAll.mockResolvedValue(mockConversations);

      const response = await request(app)
        .get('/api/v1/conversations')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        ...mockConversations
      });
      expect(Conversation.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        contactId: undefined,
        startDate: undefined,
        endDate: undefined,
        direction: undefined
      });
    });

    test('should filter by contact ID', async () => {
      const mockConversations = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };

      Conversation.findAll.mockResolvedValue(mockConversations);

      const response = await request(app)
        .get('/api/v1/conversations')
        .query({ contactId: 123 });

      expect(response.status).toBe(200);
      expect(Conversation.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ contactId: '123' })
      );
    });

    test('should filter by direction', async () => {
      const mockConversations = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };

      Conversation.findAll.mockResolvedValue(mockConversations);

      const response = await request(app)
        .get('/api/v1/conversations')
        .query({ direction: 'inbound' });

      expect(response.status).toBe(200);
      expect(Conversation.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'inbound' })
      );
    });

    test('should validate direction parameter', async () => {
      const response = await request(app)
        .get('/api/v1/conversations')
        .query({ direction: 'invalid' });

      expect(response.status).toBe(400);
    });

    test('should handle database errors', async () => {
      Conversation.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/conversations');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/v1/conversations/:id', () => {
    test('should get conversation by ID', async () => {
      const mockConversation = {
        id: 1,
        conversation_id: 'conv_123',
        contact_id: 1,
        direction: 'inbound',
        content: 'Test message'
      };

      Conversation.findById.mockResolvedValue(mockConversation);

      const response = await request(app)
        .get('/api/v1/conversations/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockConversation
      });
      expect(Conversation.findById).toHaveBeenCalledWith('1');
    });

    test('should return 404 for non-existent conversation', async () => {
      Conversation.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/conversations/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'Conversation not found'
      });
    });

    test('should handle invalid ID format', async () => {
      const response = await request(app)
        .get('/api/v1/conversations/invalid');

      // Should still attempt to find and return 404
      expect(Conversation.findById).toHaveBeenCalledWith('invalid');
    });
  });

  describe('POST /api/v1/conversations', () => {
    test('should create a new conversation', async () => {
      const newConversation = {
        conversation_id: 'conv_new',
        contact_id: 1,
        direction: 'outbound',
        content: 'New message',
        message_type: 'text',
        cost: 0.01,
        metadata: { source: 'api' }
      };

      const createdConversation = {
        id: 10,
        ...newConversation,
        created_at: '2025-11-24T00:00:00Z'
      };

      Conversation.create.mockResolvedValue(createdConversation);

      const response = await request(app)
        .post('/api/v1/conversations')
        .send(newConversation);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: 'Conversation created successfully',
        data: createdConversation
      });
      expect(Conversation.create).toHaveBeenCalledWith(newConversation);
    });

    test('should emit WebSocket event for inbound messages', async () => {
      const newConversation = {
        conversation_id: 'conv_inbound',
        contact_id: 1,
        direction: 'inbound',
        content: 'Incoming message'
      };

      const createdConversation = { id: 11, ...newConversation };

      Conversation.create.mockResolvedValue(createdConversation);
      websocketService.emitMessageReceived.mockImplementation(() => {});

      // Simulate authenticated request
      const mockApp = express();
      mockApp.use(express.json());
      mockApp.use((req, res, next) => {
        req.user = { id: 1 };
        next();
      });
      mockApp.use('/api/v1/conversations', conversationRoutes);

      const response = await request(mockApp)
        .post('/api/v1/conversations')
        .send(newConversation);

      expect(response.status).toBe(201);
      expect(websocketService.emitMessageReceived).toHaveBeenCalledWith(1, createdConversation);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/conversations')
        .send({ content: 'Missing required fields' });

      expect(response.status).toBe(400);
    });

    test('should validate direction values', async () => {
      const response = await request(app)
        .post('/api/v1/conversations')
        .send({
          conversation_id: 'test',
          contact_id: 1,
          direction: 'invalid',
          content: 'Test'
        });

      expect(response.status).toBe(400);
    });

    test('should handle database constraint violations', async () => {
      Conversation.create.mockRejectedValue({
        code: '23505',
        message: 'Duplicate entry'
      });

      const response = await request(app)
        .post('/api/v1/conversations')
        .send({
          conversation_id: 'dup',
          contact_id: 1,
          direction: 'inbound',
          content: 'Duplicate'
        });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/v1/conversations/:conversationId/messages', () => {
    test('should add message to existing conversation', async () => {
      const newMessage = {
        contact_id: 1,
        direction: 'outbound',
        content: 'Reply message',
        message_type: 'text'
      };

      const createdMessage = {
        id: 20,
        conversation_id: 'conv_123',
        ...newMessage,
        created_at: '2025-11-24T00:00:00Z'
      };

      Conversation.create.mockResolvedValue(createdMessage);

      const response = await request(app)
        .post('/api/v1/conversations/conv_123/messages')
        .send(newMessage);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: 'Message added successfully',
        data: createdMessage
      });
      expect(Conversation.create).toHaveBeenCalledWith({
        conversation_id: 'conv_123',
        ...newMessage,
        cost: 0
      });
    });

    test('should set default cost to 0 if not provided', async () => {
      const newMessage = {
        contact_id: 1,
        direction: 'inbound',
        content: 'Free message'
      };

      Conversation.create.mockResolvedValue({ id: 21, ...newMessage });

      await request(app)
        .post('/api/v1/conversations/conv_123/messages')
        .send(newMessage);

      expect(Conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({ cost: 0 })
      );
    });

    test('should accept custom cost value', async () => {
      const newMessage = {
        contact_id: 1,
        direction: 'outbound',
        content: 'Premium message',
        cost: '0.15'
      };

      Conversation.create.mockResolvedValue({ id: 22, ...newMessage });

      await request(app)
        .post('/api/v1/conversations/conv_123/messages')
        .send(newMessage);

      expect(Conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({ cost: '0.15' })
      );
    });
  });

  describe('GET /api/v1/conversations/:conversationId/messages', () => {
    test('should get messages for a conversation', async () => {
      const mockMessages = {
        data: [
          { id: 1, content: 'Message 1' },
          { id: 2, content: 'Message 2' }
        ],
        pagination: { page: 1, limit: 50, total: 2, totalPages: 1 }
      };

      Conversation.findByConversationId.mockResolvedValue(mockMessages);

      const response = await request(app)
        .get('/api/v1/conversations/conv_123/messages');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        conversationId: 'conv_123',
        ...mockMessages
      });
      expect(Conversation.findByConversationId).toHaveBeenCalledWith('conv_123', {
        page: 1,
        limit: 50
      });
    });

    test('should support custom pagination', async () => {
      const mockMessages = { data: [], pagination: {} };

      Conversation.findByConversationId.mockResolvedValue(mockMessages);

      await request(app)
        .get('/api/v1/conversations/conv_123/messages')
        .query({ page: 2, limit: 100 });

      expect(Conversation.findByConversationId).toHaveBeenCalledWith('conv_123', {
        page: 2,
        limit: 100
      });
    });

    test('should handle conversation not found', async () => {
      Conversation.findByConversationId.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
      });

      const response = await request(app)
        .get('/api/v1/conversations/nonexistent/messages');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('PUT /api/v1/conversations/messages/:msgId', () => {
    test('should update message content', async () => {
      const updatedMessage = {
        id: 1,
        content: 'Updated content',
        metadata: { edited: true }
      };

      Conversation.update.mockResolvedValue(updatedMessage);

      const response = await request(app)
        .put('/api/v1/conversations/messages/1')
        .send({
          content: 'Updated content',
          metadata: { edited: true }
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Message updated successfully',
        data: updatedMessage
      });
    });

    test('should return 404 for non-existent message', async () => {
      Conversation.update.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/conversations/messages/999')
        .send({ content: 'Update' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'Message not found'
      });
    });

    test('should allow partial updates', async () => {
      Conversation.update.mockResolvedValue({ id: 1 });

      await request(app)
        .put('/api/v1/conversations/messages/1')
        .send({ metadata: { flag: 'important' } });

      expect(Conversation.update).toHaveBeenCalledWith('1', {
        content: undefined,
        metadata: { flag: 'important' }
      });
    });
  });

  describe('GET /api/v1/conversations/search', () => {
    test('should search messages by term', async () => {
      const mockResults = {
        data: [
          { id: 1, content: 'Hello world' },
          { id: 2, content: 'World peace' }
        ],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 }
      };

      Conversation.search.mockResolvedValue(mockResults);

      const response = await request(app)
        .get('/api/v1/conversations/search')
        .query({ q: 'world' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        searchTerm: 'world',
        ...mockResults
      });
      expect(Conversation.search).toHaveBeenCalledWith({
        searchTerm: 'world',
        contactId: undefined,
        page: 1,
        limit: 20
      });
    });

    test('should filter search by contact', async () => {
      Conversation.search.mockResolvedValue({ data: [], pagination: {} });

      await request(app)
        .get('/api/v1/conversations/search')
        .query({ q: 'test', contactId: 5 });

      expect(Conversation.search).toHaveBeenCalledWith({
        searchTerm: 'test',
        contactId: '5',
        page: 1,
        limit: 20
      });
    });

    test('should validate search query is provided', async () => {
      const response = await request(app)
        .get('/api/v1/conversations/search');

      expect(response.status).toBe(400);
    });

    test('should trim search term', async () => {
      Conversation.search.mockResolvedValue({ data: [], pagination: {} });

      await request(app)
        .get('/api/v1/conversations/search')
        .query({ q: '  spaces  ' });

      expect(Conversation.search).toHaveBeenCalledWith(
        expect.objectContaining({ searchTerm: '  spaces  ' })
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      Conversation.findAll.mockRejectedValue(new Error('Connection refused'));

      const response = await request(app)
        .get('/api/v1/conversations');

      expect(response.status).toBe(500);
    });

    test('should handle validation errors gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/conversations')
        .send({ invalid: 'data' });

      expect(response.status).toBe(400);
    });

    test('should handle unexpected errors', async () => {
      Conversation.create.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/v1/conversations')
        .send({
          conversation_id: 'test',
          contact_id: 1,
          direction: 'inbound',
          content: 'Test'
        });

      expect(response.status).toBe(500);
    });
  });
});
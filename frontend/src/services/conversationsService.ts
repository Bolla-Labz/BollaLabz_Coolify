// Last Modified: 2025-11-23 17:30
import { apiClient } from '@/lib/api/client';

// Backend types matching conversation_messages table
export interface ConversationMessage {
  id: number;
  conversation_id: string;
  contact_id: number;
  direction: 'inbound' | 'outbound';
  content: string;
  message_type: string;
  cost: number;
  metadata: any;
  timestamp: string;
  contact_name?: string;
  phone_number?: string;
}

// Frontend types for UI
export interface Message {
  id: string;
  conversationId: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  timestamp: string;
  metadata?: {
    cost?: number;
    duration?: number;
    attachments?: Array<{
      id: string;
      type: string;
      url: string;
      name: string;
    }>;
  };
}

export interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactAvatar?: string;
  lastMessage?: Message;
  unreadCount: number;
  messages: Message[];
  isTyping?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageDTO {
  conversationId: string;
  contactId: number;
  direction: 'inbound' | 'outbound';
  content: string;
  messageType?: string;
  cost?: number;
  metadata?: any;
}

export interface UpdateMessageDTO {
  content?: string;
  metadata?: any;
}

export interface ConversationsResponse {
  success: boolean;
  data: ConversationMessage[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SingleMessageResponse {
  success: boolean;
  data: ConversationMessage;
}

export interface ConversationMessagesResponse {
  success: boolean;
  conversationId: string;
  data: ConversationMessage[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Transform backend message to frontend message
function transformMessage(msg: ConversationMessage): Message {
  return {
    id: msg.id.toString(),
    conversationId: msg.conversation_id,
    content: msg.content,
    direction: msg.direction,
    status: 'delivered', // Default status
    timestamp: msg.timestamp,
    metadata: {
      cost: msg.cost,
      ...msg.metadata,
    },
  };
}

// Group messages by conversation_id
function groupMessagesByConversation(messages: ConversationMessage[]): Map<string, Conversation> {
  const conversationsMap = new Map<string, Conversation>();

  messages.forEach((msg) => {
    const convId = msg.conversation_id;

    if (!conversationsMap.has(convId)) {
      conversationsMap.set(convId, {
        id: convId,
        contactId: msg.contact_id.toString(),
        contactName: msg.contact_name || 'Unknown',
        contactPhone: msg.phone_number || '',
        messages: [],
        unreadCount: 0,
        createdAt: msg.timestamp,
        updatedAt: msg.timestamp,
      });
    }

    const conversation = conversationsMap.get(convId)!;
    const transformedMsg = transformMessage(msg);
    conversation.messages.push(transformedMsg);
    conversation.lastMessage = transformedMsg;
    conversation.updatedAt = msg.timestamp;
  });

  return conversationsMap;
}

class ConversationsService {
  private baseUrl = '/v1/conversations';

  /**
   * Get all conversations (grouped by conversation_id)
   */
  async getAll(): Promise<Conversation[]> {
    const response = await apiClient.get<ConversationsResponse>(this.baseUrl, {
      params: { limit: 100 }, // Get more messages to group conversations
    });

    const conversationsMap = groupMessagesByConversation(response.data.data);
    return Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Get messages for a specific conversation
   */
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const response = await apiClient.get<ConversationMessagesResponse>(
      `${this.baseUrl}/${conversationId}/messages`,
      {
        params: { limit: 100 },
      }
    );

    return response.data.data.map(transformMessage).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Get conversations for a specific contact
   */
  async getByContactId(contactId: number): Promise<Conversation[]> {
    const response = await apiClient.get<ConversationsResponse>(this.baseUrl, {
      params: { contactId, limit: 100 },
    });

    const conversationsMap = groupMessagesByConversation(response.data.data);
    return Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Send a message (create new message in conversation)
   */
  async sendMessage(data: CreateMessageDTO): Promise<Message> {
    const response = await apiClient.post<SingleMessageResponse>(
      `${this.baseUrl}/${data.conversationId}/messages`,
      {
        contact_id: data.contactId,
        direction: data.direction,
        content: data.content,
        message_type: data.messageType || 'sms',
        cost: data.cost || 0,
        metadata: data.metadata || {},
      }
    );

    return transformMessage(response.data.data);
  }

  /**
   * Create a new conversation (first message)
   */
  async createConversation(data: CreateMessageDTO): Promise<Message> {
    const response = await apiClient.post<SingleMessageResponse>(this.baseUrl, {
      conversation_id: data.conversationId,
      contact_id: data.contactId,
      direction: data.direction,
      content: data.content,
      message_type: data.messageType || 'sms',
      cost: data.cost || 0,
      metadata: data.metadata || {},
    });

    return transformMessage(response.data.data);
  }

  /**
   * Update a message
   */
  async updateMessage(messageId: number, data: UpdateMessageDTO): Promise<Message> {
    const response = await apiClient.put<SingleMessageResponse>(
      `${this.baseUrl}/messages/${messageId}`,
      {
        content: data.content,
        metadata: data.metadata,
      }
    );

    return transformMessage(response.data.data);
  }

  /**
   * Search messages
   */
  async search(query: string, contactId?: number): Promise<ConversationMessage[]> {
    const response = await apiClient.get<ConversationsResponse>(
      `${this.baseUrl}/search`,
      {
        params: { q: query, contactId },
      }
    );

    return response.data.data;
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/messages/${messageId}`);
  }
}

export const conversationsService = new ConversationsService();
export default conversationsService;

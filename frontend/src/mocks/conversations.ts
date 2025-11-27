// Last Modified: 2025-11-23 17:30
import { Conversation, Message } from '../stores/conversationsStore';
import { mockContacts } from './contacts';

const messageTemplates = [
  "Hey, can we reschedule our meeting?",
  "Thanks for the quick response!",
  "I'll get back to you on that soon.",
  "Let me know if you need anything else.",
  "Great talking to you earlier!",
  "Can you send me the documents we discussed?",
  "Looking forward to our collaboration.",
  "That sounds perfect, let's proceed.",
  "I have a few questions about the proposal.",
  "When would be a good time to call?",
];

function generateMockMessage(
  conversationId: string,
  index: number,
  timestamp: Date
): Message {
  const isInbound = Math.random() > 0.5;

  return {
    id: `msg-${conversationId}-${index}`,
    conversationId,
    content: messageTemplates[Math.floor(Math.random() * messageTemplates.length)],
    direction: isInbound ? 'inbound' : 'outbound',
    status: isInbound ? 'read' : (['sent', 'delivered', 'read'][Math.floor(Math.random() * 3)] as Message['status']),
    timestamp: timestamp.toISOString(),
    metadata: Math.random() > 0.8 ? {
      cost: parseFloat((Math.random() * 0.5).toFixed(2)),
    } : undefined,
  };
}

function generateMockConversation(contact: typeof mockContacts[0], index: number): Conversation {
  const messageCount = Math.floor(Math.random() * 20) + 5;
  const messages: Message[] = [];

  let currentTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Within last week

  for (let i = 0; i < messageCount; i++) {
    messages.push(generateMockMessage(`conv-${index}`, i, currentTime));
    currentTime = new Date(currentTime.getTime() + Math.random() * 2 * 60 * 60 * 1000); // Add random hours
  }

  const lastMessage = messages[messages.length - 1];
  const unreadCount = Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0;

  return {
    id: `conv-${index}`,
    contactId: contact.id,
    contactName: contact.name,
    contactPhone: contact.phone,
    contactAvatar: contact.avatar,
    lastMessage,
    unreadCount,
    messages,
    isTyping: false,
    isPinned: Math.random() > 0.9,
    isMuted: Math.random() > 0.95,
    createdAt: messages[0].timestamp,
    updatedAt: lastMessage.timestamp,
  };
}

// Generate mock conversations for first 20 contacts
export const mockConversations: Conversation[] = mockContacts
  .slice(0, 20)
  .map((contact, index) => generateMockConversation(contact, index))
  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

// Helper to get conversations with filters
export function getMockConversations(filters?: {
  search?: string;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  let filtered = [...mockConversations];

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (conv) =>
        conv.contactName.toLowerCase().includes(searchLower) ||
        conv.contactPhone.includes(searchLower) ||
        conv.lastMessage?.content.toLowerCase().includes(searchLower)
    );
  }

  if (filters?.unreadOnly) {
    filtered = filtered.filter((conv) => conv.unreadCount > 0);
  }

  const offset = filters?.offset || 0;
  const limit = filters?.limit || filtered.length;

  return {
    conversations: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
}

// Helper to get messages for a conversation
export function getMockMessages(conversationId: string) {
  const conversation = mockConversations.find((c) => c.id === conversationId);
  return conversation?.messages || [];
}
// Last Modified: 2025-11-23 17:30
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import conversationsService, {
  Conversation,
  Message,
  CreateMessageDTO
} from '@/services/conversationsService';

// Re-export types for convenience
export type { Conversation, Message };

interface ConversationsFilter {
  search?: string;
  unreadOnly?: boolean;
  pinnedOnly?: boolean;
  sortBy?: 'recent' | 'name' | 'unread';
}

interface ConversationsState {
  // Data
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Map<string, Message[]>; // conversationId -> messages
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  // Filters
  filters: ConversationsFilter;

  // Typing indicators
  typingIndicators: Map<string, boolean>; // conversationId -> isTyping

  // API Actions
  fetchConversations: () => Promise<void>;
  fetchConversationMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, contactId: number) => Promise<void>;
  searchMessages: (query: string, contactId?: number) => Promise<void>;

  // Local Actions
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;

  // Messages
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  markAsRead: (conversationId: string) => void;

  // Real-time
  setTyping: (conversationId: string, isTyping: boolean) => void;

  // UI
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: ConversationsFilter) => void;

  // Computed
  getFilteredConversations: () => Conversation[];
  getConversationMessages: (conversationId: string) => Message[];
  getTotalUnread: () => number;
}

export const useConversationsStore = create<ConversationsState>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        // Initial state
        conversations: [],
        activeConversation: null,
        messages: new Map(),
        isLoading: false,
        isSending: false,
        error: null,
        filters: {
          sortBy: 'recent',
        },
        typingIndicators: new Map(),

        // API Actions
        fetchConversations: async () => {
          set({ isLoading: true, error: null });
          try {
            const conversations = await conversationsService.getAll();
            set({ conversations, isLoading: false });
          } catch (error: any) {
            set({
              error: error.message || 'Failed to fetch conversations',
              isLoading: false,
            });
            console.error('Error fetching conversations:', error);
          }
        },

        fetchConversationMessages: async (conversationId: string) => {
          set({ isLoading: true, error: null });
          try {
            const messages = await conversationsService.getConversationMessages(conversationId);
            const newMessages = new Map(get().messages);
            newMessages.set(conversationId, messages);
            set({ messages: newMessages, isLoading: false });
          } catch (error: any) {
            set({
              error: error.message || 'Failed to fetch messages',
              isLoading: false,
            });
            console.error('Error fetching messages:', error);
          }
        },

        sendMessage: async (conversationId: string, content: string, contactId: number) => {
          set({ isSending: true, error: null });
          try {
            const messageData: CreateMessageDTO = {
              conversationId,
              contactId,
              direction: 'outbound',
              content,
              messageType: 'sms',
            };

            const newMessage = await conversationsService.sendMessage(messageData);

            // Add message to local state
            get().addMessage(conversationId, newMessage);

            set({ isSending: false });
          } catch (error: any) {
            set({
              error: error.message || 'Failed to send message',
              isSending: false,
            });
            console.error('Error sending message:', error);
          }
        },

        searchMessages: async (query: string, contactId?: number) => {
          set({ isLoading: true, error: null });
          try {
            const results = await conversationsService.search(query, contactId);
            // For now, just log the results
            // You can implement highlighting or filtering based on search results
            console.log('Search results:', results);
            set({ isLoading: false });
          } catch (error: any) {
            set({
              error: error.message || 'Failed to search messages',
              isLoading: false,
            });
            console.error('Error searching messages:', error);
          }
        },

        // Local Actions
        setConversations: (conversations) => set({ conversations }),

        setActiveConversation: (conversation) =>
          set({ activeConversation: conversation }),

        addConversation: (conversation) =>
          set((state) => ({
            conversations: [conversation, ...state.conversations],
          })),

        updateConversation: (id, updates) =>
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === id
                ? { ...conv, ...updates, updatedAt: new Date().toISOString() }
                : conv
            ),
            activeConversation:
              state.activeConversation?.id === id
                ? { ...state.activeConversation, ...updates }
                : state.activeConversation,
          })),

        deleteConversation: (id) =>
          set((state) => {
            const newMessages = new Map(state.messages);
            newMessages.delete(id);

            return {
              conversations: state.conversations.filter((c) => c.id !== id),
              activeConversation:
                state.activeConversation?.id === id ? null : state.activeConversation,
              messages: newMessages,
            };
          }),

        // Messages
        addMessage: (conversationId, message) =>
          set((state) => {
            const newMessages = new Map(state.messages);
            const existing = newMessages.get(conversationId) || [];
            newMessages.set(conversationId, [...existing, message]);

            // Update conversation's last message
            const conversations = state.conversations.map((conv) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    lastMessage: message,
                    updatedAt: message.timestamp,
                    unreadCount:
                      message.direction === 'inbound'
                        ? conv.unreadCount + 1
                        : conv.unreadCount,
                  }
                : conv
            );

            return { messages: newMessages, conversations };
          }),

        updateMessage: (conversationId, messageId, updates) =>
          set((state) => {
            const newMessages = new Map(state.messages);
            const existing = newMessages.get(conversationId) || [];
            newMessages.set(
              conversationId,
              existing.map((msg) =>
                msg.id === messageId ? { ...msg, ...updates } : msg
              )
            );

            return { messages: newMessages };
          }),

        setMessages: (conversationId, messages) =>
          set((state) => {
            const newMessages = new Map(state.messages);
            newMessages.set(conversationId, messages);
            return { messages: newMessages };
          }),

        markAsRead: (conversationId) =>
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
            ),
          })),

        // Real-time
        setTyping: (conversationId, isTyping) =>
          set((state) => {
            const newIndicators = new Map(state.typingIndicators);
            if (isTyping) {
              newIndicators.set(conversationId, true);
            } else {
              newIndicators.delete(conversationId);
            }

            // Update conversation
            const conversations = state.conversations.map((conv) =>
              conv.id === conversationId ? { ...conv, isTyping } : conv
            );

            return { typingIndicators: newIndicators, conversations };
          }),

        // UI
        setLoading: (loading) => set({ isLoading: loading }),
        setSending: (sending) => set({ isSending: sending }),
        setError: (error) => set({ error }),
        setFilters: (filters) =>
          set((state) => ({ filters: { ...state.filters, ...filters } })),

        // Computed
        getFilteredConversations: () => {
          const { conversations, filters } = get();
          let filtered = [...conversations];

          // Apply search filter
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(
              (conv) =>
                conv.contactName.toLowerCase().includes(searchLower) ||
                conv.contactPhone.includes(searchLower) ||
                conv.lastMessage?.content.toLowerCase().includes(searchLower)
            );
          }

          // Apply unread filter
          if (filters.unreadOnly) {
            filtered = filtered.filter((conv) => conv.unreadCount > 0);
          }

          // Apply pinned filter
          if (filters.pinnedOnly) {
            filtered = filtered.filter((conv) => conv.isPinned);
          }

          // Apply sorting
          filtered.sort((a, b) => {
            // Pinned conversations always come first
            if (a.isPinned !== b.isPinned) {
              return a.isPinned ? -1 : 1;
            }

            switch (filters.sortBy) {
              case 'recent':
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
              case 'name':
                return a.contactName.localeCompare(b.contactName);
              case 'unread':
                return b.unreadCount - a.unreadCount;
              default:
                return 0;
            }
          });

          return filtered;
        },

        getConversationMessages: (conversationId) => {
          const { messages } = get();
          return messages.get(conversationId) || [];
        },

        getTotalUnread: () => {
          const { conversations } = get();
          return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
        },
      })
    ),
    {
      name: 'conversations-store',
    }
  )
);
// Last Modified: 2025-11-23 17:30
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatState {
  messages: Message[];
  isOpen: boolean;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isOpen: false,

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      clearMessages: () =>
        set({
          messages: [],
        }),

      setIsOpen: (isOpen) =>
        set({
          isOpen,
        }),
    }),
    {
      name: 'bollalabz-chat-storage',
      partialize: (state) => ({
        messages: state.messages.slice(-20), // Only persist last 20 messages
      }),
    }
  )
);

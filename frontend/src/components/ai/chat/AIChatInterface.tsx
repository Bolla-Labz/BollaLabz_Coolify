// Last Modified: 2025-11-23 17:30
/**
 * AIChatInterface Component
 * Advanced AI chat with context awareness, suggestions, and multimodal support
 * Integrates with Claude/OpenAI for intelligent conversations
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mic,
  MicOff,
  Paperclip,
  Image,
  FileText,
  Code,
  Sparkles,
  Brain,
  Zap,
  Info,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  StopCircle,
  Settings,
  User,
  Bot,
  Hash,
  AtSign,
  Command,
  MessageSquarePlus,
  History,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InteractiveButton } from '@/components/interactive/buttons/InteractiveButton';
import { TypingIndicator } from '@/components/interactive/conversation/TypingIndicator';
import { useWebSocket } from '@/lib/websocket/useWebSocket';
import { SimpleMarkdown } from './SimpleMarkdown';
import * as Sentry from '@sentry/react';

// ============================================
// TYPES
// ============================================

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: Array<{
    type: 'image' | 'file' | 'code';
    url?: string;
    name: string;
    size?: number;
    language?: string;
  }>;
  metadata?: {
    model?: string;
    tokens?: number;
    processingTime?: number;
    confidence?: number;
    suggestions?: string[];
    context?: any;
  };
  status?: 'sending' | 'sent' | 'error' | 'generating';
  feedback?: 'positive' | 'negative';
}

export interface AIChatInterfaceProps {
  // Configuration
  apiKey?: string;
  model?: 'claude-3-opus' | 'claude-3-sonnet' | 'gpt-4' | 'gpt-3.5-turbo';
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;

  // Features
  features?: {
    voice?: boolean;
    attachments?: boolean;
    codeBlocks?: boolean;
    markdown?: boolean;
    suggestions?: boolean;
    history?: boolean;
    feedback?: boolean;
    streaming?: boolean;
    multimodal?: boolean;
    contextAware?: boolean;
    smartReply?: boolean;
    commands?: boolean;
  };

  // UI Options
  variant?: 'default' | 'minimal' | 'sidebar' | 'floating';
  height?: string | number;
  placeholder?: string;
  welcomeMessage?: string;

  // Context
  context?: any;
  conversationId?: string;
  userId?: string;

  // Callbacks
  onSendMessage?: (message: string, attachments?: any[]) => Promise<string>;
  onReceiveMessage?: (message: AIMessage) => void;
  onError?: (error: Error) => void;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;

  className?: string;
}

interface SuggestionChip {
  id: string;
  text: string;
  icon?: React.ElementType;
  action: () => void;
}

// ============================================
// MARKDOWN RENDERING
// ============================================

// ============================================
// MESSAGE COMPONENT
// ============================================

const ChatMessage: React.FC<{
  message: AIMessage;
  onFeedback?: (feedback: 'positive' | 'negative') => void;
  onRetry?: () => void;
  features?: AIChatInterfaceProps['features'];
}> = ({ message, onFeedback, onRetry, features }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'flex gap-3 px-4 py-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      <div className={cn('flex flex-col gap-1 max-w-[70%]', isUser && 'items-end')}>
        {/* Message bubble */}
        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          )}
        >
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1 rounded',
                    isUser ? 'bg-blue-700' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                >
                  {attachment.type === 'image' && <Image className="w-4 h-4" />}
                  {attachment.type === 'file' && <FileText className="w-4 h-4" />}
                  {attachment.type === 'code' && <Code className="w-4 h-4" />}
                  <span className="text-xs">{attachment.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Content */}
          {message.status === 'generating' ? (
            <TypingIndicator variant="dots" size="sm" />
          ) : features?.markdown && !isUser ? (
            <SimpleMarkdown content={message.content} />
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Metadata */}
          {message.metadata && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2 text-xs opacity-70">
                {message.metadata.model && (
                  <span className="flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    {message.metadata.model}
                  </span>
                )}
                {message.metadata.tokens && (
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {message.metadata.tokens} tokens
                  </span>
                )}
                {message.metadata.processingTime && (
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {message.metadata.processingTime}ms
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isUser && (
          <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
            <InteractiveButton
              variant="ghost"
              size="sm"
              icon={Copy}
              onClick={handleCopy}
              tooltip={copied ? 'Copied!' : 'Copy'}
              className="h-7"
            />

            {features?.feedback && (
              <>
                <InteractiveButton
                  variant="ghost"
                  size="sm"
                  icon={ThumbsUp}
                  onClick={() => onFeedback?.('positive')}
                  className={cn('h-7', message.feedback === 'positive' && 'text-green-600')}
                />
                <InteractiveButton
                  variant="ghost"
                  size="sm"
                  icon={ThumbsDown}
                  onClick={() => onFeedback?.('negative')}
                  className={cn('h-7', message.feedback === 'negative' && 'text-red-600')}
                />
              </>
            )}

            {message.status === 'error' && onRetry && (
              <InteractiveButton
                variant="ghost"
                size="sm"
                icon={RefreshCw}
                onClick={onRetry}
                tooltip="Retry"
                className="h-7"
              />
            )}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-gray-500 dark:text-gray-400 px-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  apiKey,
  model = 'claude-3-sonnet',
  systemPrompt = 'You are a helpful AI assistant.',
  temperature = 0.7,
  maxTokens = 2048,
  features = {
    voice: true,
    attachments: true,
    markdown: true,
    suggestions: true,
    feedback: true,
    streaming: true,
    commands: true,
  },
  variant = 'default',
  height = '600px',
  placeholder = 'Type your message...',
  welcomeMessage = 'Hello! How can I help you today?',
  context,
  conversationId,
  userId,
  onSendMessage,
  onReceiveMessage,
  onError,
  onFeedback,
  className,
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WebSocket for streaming with Sentry instrumentation
  const { send, subscribe, isConnected } = useWebSocket({
    url: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8000',
    debug: import.meta.env.DEV,
    onAuthExpired: async () => {
      Sentry.addBreadcrumb({
        category: 'websocket',
        message: 'WebSocket auth expired',
        level: 'warning',
      });
      return '';
    },
  });

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Smart suggestions
  const suggestions = useMemo<SuggestionChip[]>(() => {
    if (!features.suggestions || !showSuggestions) return [];

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role !== 'assistant') return [];

    // Context-aware suggestions
    return [
      {
        id: '1',
        text: 'Tell me more',
        icon: MessageSquarePlus,
        action: () => handleSend('Tell me more about that'),
      },
      {
        id: '2',
        text: 'Explain simply',
        icon: Info,
        action: () => handleSend('Can you explain that in simpler terms?'),
      },
      {
        id: '3',
        text: 'Give an example',
        icon: Code,
        action: () => handleSend('Can you give me an example?'),
      },
      {
        id: '4',
        text: 'What\'s next?',
        icon: Sparkles,
        action: () => handleSend('What should I do next?'),
      },
    ];
  }, [messages, features.suggestions, showSuggestions]);

  // Handle sending message with Sentry instrumentation
  const handleSend = useCallback(async (text?: string) => {
    return Sentry.startSpan(
      { op: 'ai.chat.send', name: 'Send AI Chat Message' },
      async (span) => {
        const messageText = text || input.trim();
        if (!messageText && attachments.length === 0) return;

        span?.setAttributes({
          'message.length': messageText.length,
          'attachments.count': attachments.length,
          'ai.model': model,
        });

        // Add user message
        const userMessage: AIMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: messageText,
          timestamp: new Date(),
          attachments: attachments.length > 0 ? attachments : undefined,
          status: 'sent',
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setAttachments([]);
        setShowSuggestions(false);

        // Add assistant "generating" message
        const assistantMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          status: 'generating',
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsGenerating(true);

        try {
          // Call API or custom handler
          let response: string;

          if (onSendMessage) {
            response = await Sentry.startSpan(
              { op: 'ai.chat.custom_handler', name: 'Custom Message Handler' },
              () => onSendMessage(messageText, attachments)
            );
          } else if (features.streaming && isConnected) {
            // Stream response via WebSocket
            response = await Sentry.startSpan(
              { op: 'ai.chat.websocket_stream', name: 'WebSocket Streaming' },
              () => streamResponse(messageText)
            );
          } else {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            response = `I received your message: "${messageText}". This is a simulated response.`;
            Sentry.addBreadcrumb({
              category: 'ai.chat',
              message: 'Simulated response used',
              level: 'info',
            });
          }

          // Update assistant message
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? {
                    ...msg,
                    content: response,
                    status: 'sent',
                    metadata: {
                      model,
                      tokens: response.split(' ').length * 1.3,
                      processingTime: Date.now() - userMessage.timestamp.getTime(),
                    },
                  }
                : msg
            )
          );

          span?.setAttributes({
            'response.length': response.length,
            'processing.time_ms': Date.now() - userMessage.timestamp.getTime(),
          });

          onReceiveMessage?.({ ...assistantMessage, content: response, status: 'sent' });
        } catch (error) {
          Sentry.captureException(error, {
            tags: {
              component: 'AIChatInterface',
              action: 'send_message',
            },
            contexts: {
              ai_chat: {
                model,
                message_length: messageText.length,
                is_connected: isConnected,
                features_enabled: Object.keys(features).filter(k => features[k as keyof typeof features]),
              },
            },
          });

          // Handle error
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? {
                    ...msg,
                    content: 'Sorry, I encountered an error processing your request.',
                    status: 'error',
                  }
                : msg
            )
          );
          onError?.(error as Error);
        } finally {
          setIsGenerating(false);
          setShowSuggestions(true);
        }
      }
    );
  }, [input, attachments, onSendMessage, isConnected, model, features]);

  // Stream response via WebSocket
  const streamResponse = async (message: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      let fullResponse = '';

      const unsubscribe = subscribe('ai.response', (data: any) => {
        if (data.done) {
          unsubscribe();
          resolve(fullResponse);
        } else if (data.error) {
          unsubscribe();
          reject(new Error(data.error));
        } else {
          fullResponse += data.chunk;
          // Update message in real-time
          setMessages(prev =>
            prev.map((msg, index) =>
              index === prev.length - 1 && msg.role === 'assistant'
                ? { ...msg, content: fullResponse }
                : msg
            )
          );
        }
      });

      // Send message via WebSocket
      send({
        type: 'ai.request',
        payload: {
          message,
          model,
          temperature,
          maxTokens,
          systemPrompt,
          context,
        },
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Request timeout'));
      }, 30000);
    });
  };

  // Handle voice input
  const handleVoiceToggle = useCallback(() => {
    if (!features.voice) return;

    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // Process audio...
    } else {
      // Start recording
      setIsRecording(true);
      // Initialize audio recording...
    }
  }, [isRecording, features.voice]);

  // Handle file attachment
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newAttachments = files.map(file => ({
      type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  // Handle command shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Command shortcuts
    if (features.commands && e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'k': // Clear chat
          e.preventDefault();
          setMessages([{
            id: '0',
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date(),
          }]);
          break;
        case '/': // Focus input
          e.preventDefault();
          inputRef.current?.focus();
          break;
      }
    }
  }, [handleSend, features.commands, welcomeMessage]);

  return (
    <div
      className={cn(
        'flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800',
        variant === 'minimal' && 'border-0',
        variant === 'floating' && 'shadow-xl',
        className
      )}
      style={{ height }}
    >
      {/* Header */}
      {variant !== 'minimal' && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">AI Assistant</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isGenerating ? 'Thinking...' : 'Online'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {features.history && (
              <InteractiveButton
                variant="ghost"
                size="sm"
                icon={History}
                tooltip="Chat history"
              />
            )}
            <InteractiveButton
              variant="ghost"
              size="sm"
              icon={Settings}
              tooltip="Settings"
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {messages.map(message => (
            <ChatMessage
              key={message.id}
              message={message}
              onFeedback={(feedback) => {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === message.id ? { ...msg, feedback } : msg
                  )
                );
                onFeedback?.(message.id, feedback);
              }}
              onRetry={() => {
                // Retry logic
              }}
              features={features}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap gap-2">
            {suggestions.map(suggestion => (
              <motion.button
                key={suggestion.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                onClick={suggestion.action}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
              >
                {suggestion.icon && <suggestion.icon className="w-3 h-3" />}
                {suggestion.text}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
              >
                {attachment.type === 'image' && <Image className="w-4 h-4" />}
                {attachment.type === 'file' && <FileText className="w-4 h-4" />}
                <span className="text-xs">{attachment.name}</span>
                <button
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Attachment button */}
          {features.attachments && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <InteractiveButton
                variant="ghost"
                size="sm"
                icon={Paperclip}
                onClick={() => fileInputRef.current?.click()}
                tooltip="Attach file"
              />
            </>
          )}

          {/* Voice input */}
          {features.voice && (
            <InteractiveButton
              variant="ghost"
              size="sm"
              icon={isRecording ? MicOff : Mic}
              onClick={handleVoiceToggle}
              tooltip={isRecording ? 'Stop recording' : 'Start recording'}
              className={cn(isRecording && 'text-red-600 animate-pulse')}
            />
          )}

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isGenerating}
            rows={1}
            className="flex-1 resize-none bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            style={{ minHeight: '36px', maxHeight: '120px' }}
          />

          {/* Send/Stop button */}
          {isGenerating ? (
            <InteractiveButton
              variant="primary"
              size="sm"
              icon={StopCircle}
              onClick={() => setIsGenerating(false)}
              tooltip="Stop generating"
            />
          ) : (
            <InteractiveButton
              variant="primary"
              size="sm"
              icon={Send}
              onClick={() => handleSend()}
              disabled={!input.trim() && attachments.length === 0}
              tooltip="Send message"
              shortcut="⏎"
            />
          )}
        </div>

        {/* Helper text */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {features.commands && 'Press ⌘K to clear • ⌘/ to focus'}
          </span>
          <span>
            {isConnected ? (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-500">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                Offline mode
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AIChatInterface;
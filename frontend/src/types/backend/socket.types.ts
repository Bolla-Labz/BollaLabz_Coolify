// Last Modified: 2025-11-23 17:30
/**
 * WebSocket event type definitions
 * Defines all socket events and their payloads for type safety
 *
 * Extracted from backend to ensure frontend/backend compatibility
 */

/**
 * Client-to-Server Events
 */
export enum ClientEvent {
  // Connection events
  JOIN_CONVERSATION = 'join-conversation',
  LEAVE_CONVERSATION = 'leave-conversation',
  JOIN_AGENT_ROOM = 'join-agent-room',
  LEAVE_AGENT_ROOM = 'leave-agent-room',

  // Message events
  SEND_MESSAGE = 'send-message',
  TYPING_START = 'typing-start',
  TYPING_STOP = 'typing-stop',

  // Call events
  CALL_STATUS_UPDATE = 'call-status-update',
  CALL_END = 'call-end',

  // Agent events
  AGENT_STATUS_UPDATE = 'agent-status-update',

  // Dashboard events
  SUBSCRIBE_METRICS = 'subscribe-metrics',
  UNSUBSCRIBE_METRICS = 'unsubscribe-metrics',
}

/**
 * Server-to-Client Events
 */
export enum ServerEvent {
  // Connection events
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',

  // Message events
  NEW_MESSAGE = 'new-message',
  MESSAGE_UPDATED = 'message-updated',
  MESSAGE_DELETED = 'message-deleted',
  USER_TYPING = 'user-typing',

  // Conversation events
  CONVERSATION_CREATED = 'conversation-created',
  CONVERSATION_UPDATED = 'conversation-updated',
  CONVERSATION_ENDED = 'conversation-ended',
  CONVERSATION_STATUS_CHANGED = 'conversation-status-changed',

  // Call events
  CALL_STARTED = 'call-started',
  CALL_RINGING = 'call-ringing',
  CALL_ANSWERED = 'call-answered',
  CALL_ENDED = 'call-ended',
  CALL_FAILED = 'call-failed',
  CALL_TRANSFERRED = 'call-transferred',

  // Agent events
  AGENT_CREATED = 'agent-created',
  AGENT_UPDATED = 'agent-updated',
  AGENT_DELETED = 'agent-deleted',
  AGENT_STATUS_CHANGED = 'agent-status-changed',
  AGENT_ASSIGNED = 'agent-assigned',

  // Phone number events
  PHONE_NUMBER_ADDED = 'phone-number-added',
  PHONE_NUMBER_REMOVED = 'phone-number-removed',
  PHONE_NUMBER_ASSIGNED = 'phone-number-assigned',

  // Workflow events
  WORKFLOW_TRIGGERED = 'workflow-triggered',
  WORKFLOW_COMPLETED = 'workflow-completed',
  WORKFLOW_FAILED = 'workflow-failed',

  // Metrics events
  METRICS_UPDATE = 'metrics-update',
  REAL_TIME_STATS = 'real-time-stats',

  // Notification events
  NOTIFICATION = 'notification',
  ALERT = 'alert',
}

/**
 * Event Payload Interfaces
 */

// Connection payloads
export interface JoinConversationPayload {
  conversationId: string;
}

export interface JoinAgentRoomPayload {
  agentId: string;
}

export interface ConnectedPayload {
  socketId: string;
  userId: string;
  timestamp: string;
}

// Message payloads
export interface SendMessagePayload {
  conversationId: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface NewMessagePayload {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'FUNCTION';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface MessageUpdatedPayload extends NewMessagePayload {}

export interface MessageDeletedPayload {
  id: string;
  conversationId: string;
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  userName: string;
}

// Conversation payloads
export interface ConversationCreatedPayload {
  id: string;
  agentId: string;
  phoneNumberId: string;
  externalNumber: string;
  status: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  startedAt: string;
}

export interface ConversationUpdatedPayload {
  id: string;
  status?: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  endedAt?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface ConversationStatusChangedPayload {
  conversationId: string;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
}

// Call payloads
export interface CallStatusUpdatePayload {
  conversationId: string;
  status: 'initiated' | 'ringing' | 'answered' | 'ended' | 'failed';
  timestamp: string;
}

export interface CallStartedPayload {
  conversationId: string;
  agentId: string;
  phoneNumber: string;
  externalNumber: string;
  timestamp: string;
}

export interface CallEndedPayload {
  conversationId: string;
  duration: number;
  endReason: 'completed' | 'failed' | 'cancelled' | 'no-answer';
  timestamp: string;
}

export interface CallFailedPayload {
  conversationId: string;
  error: string;
  reason: string;
  timestamp: string;
}

// Agent payloads
export interface AgentStatusUpdatePayload {
  agentId: string;
  isActive: boolean;
}

export interface AgentCreatedPayload {
  id: string;
  name: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
}

export interface AgentUpdatedPayload {
  id: string;
  name?: string;
  isActive?: boolean;
  updatedAt: string;
}

export interface AgentDeletedPayload {
  id: string;
  deletedAt: string;
}

export interface AgentStatusChangedPayload {
  agentId: string;
  oldStatus: boolean;
  newStatus: boolean;
  timestamp: string;
}

// Phone number payloads
export interface PhoneNumberAddedPayload {
  id: string;
  phoneNumber: string;
  agentId: string;
  isActive: boolean;
}

export interface PhoneNumberRemovedPayload {
  id: string;
  phoneNumber: string;
}

// Workflow payloads
export interface WorkflowTriggeredPayload {
  workflowId: string;
  executionId: string;
  triggeredBy: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface WorkflowCompletedPayload {
  workflowId: string;
  executionId: string;
  result: any;
  duration: number;
  timestamp: string;
}

export interface WorkflowFailedPayload {
  workflowId: string;
  executionId: string;
  error: string;
  timestamp: string;
}

// Metrics payloads
export interface MetricsUpdatePayload {
  timestamp: string;
  totalCalls: number;
  activeCalls: number;
  completedCalls: number;
  failedCalls: number;
  averageDuration: number;
  activeAgents: number;
}

export interface RealTimeStatsPayload {
  timestamp: string;
  activeConversations: number;
  messagesPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
}

// Notification payloads
export interface NotificationPayload {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface AlertPayload {
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  requiresAction: boolean;
  actionUrl?: string;
}

// Error payload
export interface SocketErrorPayload {
  code: string;
  message: string;
  details?: any;
}

/**
 * Type-safe event emitter interfaces
 */
export interface ServerToClientEvents {
  [ServerEvent.CONNECTED]: (data: ConnectedPayload) => void;
  [ServerEvent.DISCONNECTED]: () => void;
  [ServerEvent.ERROR]: (data: SocketErrorPayload) => void;

  [ServerEvent.NEW_MESSAGE]: (data: NewMessagePayload) => void;
  [ServerEvent.MESSAGE_UPDATED]: (data: MessageUpdatedPayload) => void;
  [ServerEvent.MESSAGE_DELETED]: (data: MessageDeletedPayload) => void;
  [ServerEvent.USER_TYPING]: (data: TypingPayload) => void;

  [ServerEvent.CONVERSATION_CREATED]: (data: ConversationCreatedPayload) => void;
  [ServerEvent.CONVERSATION_UPDATED]: (data: ConversationUpdatedPayload) => void;
  [ServerEvent.CONVERSATION_ENDED]: (data: ConversationUpdatedPayload) => void;
  [ServerEvent.CONVERSATION_STATUS_CHANGED]: (data: ConversationStatusChangedPayload) => void;

  [ServerEvent.CALL_STARTED]: (data: CallStartedPayload) => void;
  [ServerEvent.CALL_RINGING]: (data: CallStatusUpdatePayload) => void;
  [ServerEvent.CALL_ANSWERED]: (data: CallStatusUpdatePayload) => void;
  [ServerEvent.CALL_ENDED]: (data: CallEndedPayload) => void;
  [ServerEvent.CALL_FAILED]: (data: CallFailedPayload) => void;

  [ServerEvent.AGENT_CREATED]: (data: AgentCreatedPayload) => void;
  [ServerEvent.AGENT_UPDATED]: (data: AgentUpdatedPayload) => void;
  [ServerEvent.AGENT_DELETED]: (data: AgentDeletedPayload) => void;
  [ServerEvent.AGENT_STATUS_CHANGED]: (data: AgentStatusChangedPayload) => void;

  [ServerEvent.PHONE_NUMBER_ADDED]: (data: PhoneNumberAddedPayload) => void;
  [ServerEvent.PHONE_NUMBER_REMOVED]: (data: PhoneNumberRemovedPayload) => void;

  [ServerEvent.WORKFLOW_TRIGGERED]: (data: WorkflowTriggeredPayload) => void;
  [ServerEvent.WORKFLOW_COMPLETED]: (data: WorkflowCompletedPayload) => void;
  [ServerEvent.WORKFLOW_FAILED]: (data: WorkflowFailedPayload) => void;

  [ServerEvent.METRICS_UPDATE]: (data: MetricsUpdatePayload) => void;
  [ServerEvent.REAL_TIME_STATS]: (data: RealTimeStatsPayload) => void;

  [ServerEvent.NOTIFICATION]: (data: NotificationPayload) => void;
  [ServerEvent.ALERT]: (data: AlertPayload) => void;
}

export interface ClientToServerEvents {
  [ClientEvent.JOIN_CONVERSATION]: (data: JoinConversationPayload) => void;
  [ClientEvent.LEAVE_CONVERSATION]: (data: JoinConversationPayload) => void;
  [ClientEvent.JOIN_AGENT_ROOM]: (data: JoinAgentRoomPayload) => void;
  [ClientEvent.LEAVE_AGENT_ROOM]: (data: JoinAgentRoomPayload) => void;

  [ClientEvent.SEND_MESSAGE]: (data: SendMessagePayload) => void;
  [ClientEvent.TYPING_START]: (data: { conversationId: string }) => void;
  [ClientEvent.TYPING_STOP]: (data: { conversationId: string }) => void;

  [ClientEvent.CALL_STATUS_UPDATE]: (data: CallStatusUpdatePayload) => void;
  [ClientEvent.CALL_END]: (data: { conversationId: string }) => void;

  [ClientEvent.AGENT_STATUS_UPDATE]: (data: AgentStatusUpdatePayload) => void;

  [ClientEvent.SUBSCRIBE_METRICS]: () => void;
  [ClientEvent.UNSUBSCRIBE_METRICS]: () => void;
}

/**
 * Socket data attached to each socket connection
 */
export interface SocketData {
  userId: string;
  email: string;
  role: string;
}

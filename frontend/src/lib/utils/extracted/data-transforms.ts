// Last Modified: 2025-11-23 17:30
/**
 * Data transformation utilities for converting API responses to table row formats
 */

import type {
  Agent,
  Conversation,
  PhoneNumber,
} from "@/types";
import type {
  AgentRow,
  ConversationRow,
  PhoneNumberRow,
} from "@/types/table";

/**
 * Transform Agent to AgentRow for table display
 */
export function agentToTableRow(agent: Agent): AgentRow {
  return {
    id: agent.id,
    name: agent.name,
    voiceProvider: "ElevenLabs", // Default, could be extracted from voiceId
    model: "GPT-4", // Default, could be configured per agent
    phoneNumber: agent.phoneNumbers?.[0]?.phoneNumber || null,
    status: agent.isActive ? "active" : "inactive",
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
  };
}

/**
 * Transform Conversation to ConversationRow for table display
 */
export function conversationToTableRow(
  conversation: Conversation
): ConversationRow {
  // Extract caller name from external number or use a default
  const callerName = formatCallerName(conversation.externalNumber);

  // Calculate duration if endedAt is available
  const duration = conversation.endedAt
    ? Math.floor(
        (new Date(conversation.endedAt).getTime() -
          new Date(conversation.startedAt).getTime()) /
          1000
      )
    : 0;

  // Generate a title from the conversation
  const title = generateConversationTitle(conversation);

  // Generate a rating (placeholder - would come from analysis)
  const rating = generatePlaceholderRating();

  return {
    id: conversation.id,
    title,
    emoji: getConversationEmoji(conversation),
    callerName,
    callerAvatar: undefined, // Would come from user profile if available
    rating,
    duration,
    date: conversation.startedAt,
    status:
      conversation.status === "COMPLETED"
        ? "completed"
        : conversation.status === "IN_PROGRESS"
        ? "in_progress"
        : "failed",
  };
}

/**
 * Transform PhoneNumber to PhoneNumberRow for table display
 */
export function phoneNumberToTableRow(
  phoneNumber: PhoneNumber
): PhoneNumberRow {
  return {
    id: phoneNumber.id,
    phoneNumber: phoneNumber.phoneNumber,
    friendlyName: `${phoneNumber.agent?.name || "Main"} Line`,
    assignedAgentId: phoneNumber.agentId || null,
    assignedAgentName: phoneNumber.agent?.name || null,
    country: "United States", // Would be extracted from phone number
    status: phoneNumber.isActive ? "active" : "available",
    capabilities: ["Voice", "SMS"], // Default Twilio capabilities
    monthlyPrice: 1.0, // Standard Twilio pricing
  };
}

/**
 * Helper: Format caller name from phone number
 */
function formatCallerName(phoneNumber: string): string {
  // In a real app, this would lookup the contact name
  // For now, just format the number nicely
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phoneNumber;
}

/**
 * Helper: Generate conversation title
 */
function generateConversationTitle(conversation: Conversation): string {
  // Use agent name as base
  const agentName = conversation.agent?.name || "Assistant";

  // Add context based on message count or duration
  const messageCount = conversation._count?.messages || 0;
  if (messageCount > 0) {
    return `${agentName} Call - ${messageCount} messages`;
  }

  return `${agentName} Call`;
}

/**
 * Helper: Get emoji for conversation
 */
function getConversationEmoji(conversation: Conversation): string {
  const emojis = [
    "📞",
    "💬",
    "🎯",
    "🚀",
    "💡",
    "⚡",
    "🎤",
    "📱",
    "🔔",
    "🌟",
  ];

  // Generate consistent emoji based on conversation ID
  const hash = conversation.id
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return emojis[hash % emojis.length];
}

/**
 * Helper: Generate placeholder rating
 * In production, this would come from conversation analysis
 */
function generatePlaceholderRating(): number {
  // Generate random rating between 4.0 and 10.0
  return Math.round((4 + Math.random() * 6) * 10) / 10;
}

/**
 * Batch transform agents
 */
export function agentsToTableRows(agents: Agent[]): AgentRow[] {
  return agents.map(agentToTableRow);
}

/**
 * Batch transform conversations
 */
export function conversationsToTableRows(
  conversations: Conversation[]
): ConversationRow[] {
  return conversations.map(conversationToTableRow);
}

/**
 * Batch transform phone numbers
 */
export function phoneNumbersToTableRows(
  phoneNumbers: PhoneNumber[]
): PhoneNumberRow[] {
  return phoneNumbers.map(phoneNumberToTableRow);
}

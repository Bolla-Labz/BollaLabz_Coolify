// 08 December 2025 03 45 00

/**
 * Productivity Types (Tasks & Calendar)
 *
 * Aligned with database schemas as source of truth:
 * - packages/db/src/schema/tasks.ts
 * - packages/db/src/schema/calendar-events.ts
 */

// Task entity - aligned with database schema
export interface Task {
  // Core fields from database
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;

  // Dates (from database)
  dueDate?: string | null;
  completedAt?: string | null;

  // Contact relationship (from database)
  contactId?: string | null;

  // Categorization (from database)
  tags: string[];

  // Timestamps (from database)
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  // Extended fields for future use (optional)
  startDate?: string;
  assigneeId?: string;
  assigneeName?: string;
  createdBy?: string;
  projectId?: string;
  projectName?: string;
  parentTaskId?: string;
  subtasks?: Task[];
  category?: string;
  progress?: number;
  estimatedHours?: number;
  actualHours?: number;
  recurrence?: RecurrenceRule;
  recurringTaskId?: string;
  attachments?: Attachment[];
  linkedContacts?: string[];
  linkedEvents?: string[];
  customFields?: Record<string, unknown>;
  aiSuggestions?: AISuggestion[];
}

// Database-aligned enums
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

// Calendar event - aligned with database schema
export interface CalendarEvent {
  // Core fields from database
  id: string;
  userId: string;
  title: string;
  description?: string | null;

  // Time (from database)
  startTime: string;
  endTime: string;
  allDay: boolean;

  // Location (from database)
  location?: string | null;

  // Contact associations (from database - JSONB array of contact UUIDs)
  contactIds?: string[];

  // Reminder configuration (from database - minutes before event)
  reminderMinutes?: number | null;

  // External calendar integration (from database)
  externalId?: string | null;
  externalSource?: CalendarSource | null;

  // Timestamps (from database)
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  // Extended fields for future use (optional)
  type?: EventType;
  timezone?: string;
  isVirtual?: boolean;
  meetingUrl?: string;
  organizer?: EventAttendee;
  attendees?: EventAttendee[];
  recurrence?: RecurrenceRule;
  recurringEventId?: string;
  reminders?: Reminder[];
  status?: EventStatus;
  visibility?: EventVisibility;
  category?: string;
  tags?: string[];
  color?: string;
  linkedTasks?: string[];
  linkedContacts?: string[];
  attachments?: Attachment[];
  customFields?: Record<string, unknown>;
  meetingData?: MeetingData;
}

// Database-aligned enum
export type CalendarSource = 'google' | 'outlook' | 'apple' | 'manual';

// Extended enums for future use
export type EventType =
  | 'meeting'
  | 'appointment'
  | 'task'
  | 'reminder'
  | 'birthday'
  | 'holiday'
  | 'other';

export type EventStatus =
  | 'confirmed'
  | 'tentative'
  | 'cancelled'
  | 'completed';

export type EventVisibility = 'public' | 'private' | 'confidential';

// Event attendee
export interface EventAttendee {
  id?: string;
  name: string;
  email: string;
  status: AttendeeStatus;
  role: AttendeeRole;
  optional?: boolean;
  comment?: string;
}

export type AttendeeStatus =
  | 'accepted'
  | 'declined'
  | 'tentative'
  | 'needs-action';

export type AttendeeRole =
  | 'organizer'
  | 'required'
  | 'optional'
  | 'resource';

// Meeting data
export interface MeetingData {
  provider: 'zoom' | 'teams' | 'meet' | 'other';
  meetingId?: string;
  password?: string;
  dialIn?: string;
  recordingUrl?: string;
}

// Recurrence rule
export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  monthOfYear?: number;
  count?: number;
  until?: string;
  exceptions?: string[];
}

export type RecurrenceFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly';

// Reminder
export interface Reminder {
  id: string;
  method: ReminderMethod;
  minutes: number;
  message?: string;
}

export type ReminderMethod =
  | 'email'
  | 'push'
  | 'sms'
  | 'popup';

// Attachment
export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// AI suggestion
export interface AISuggestion {
  id: string;
  type: 'schedule' | 'priority' | 'delegate' | 'break-down' | 'automate';
  suggestion: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

// Time block
export interface TimeBlock {
  id: string;
  userId: string;
  title: string;
  type: 'focus' | 'break' | 'meeting' | 'personal';
  startTime: string;
  endTime: string;
  taskIds?: string[];
  isRecurring?: boolean;
  recurrence?: RecurrenceRule;
}

// Productivity stats
export interface ProductivityStats {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
  startDate: string;
  endDate: string;

  tasks: {
    completed: number;
    created: number;
    overdue: number;
    inProgress: number;
    totalHours: number;
  };

  meetings: {
    total: number;
    totalHours: number;
    cancelled: number;
  };

  focus: {
    totalHours: number;
    sessions: number;
    averageSessionLength: number;
  };

  trends?: {
    productivityScore: number;
    improvement: number;
    suggestions: string[];
  };
}
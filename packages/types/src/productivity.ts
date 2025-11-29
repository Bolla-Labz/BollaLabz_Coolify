/**
 * Productivity Types (Tasks & Calendar)
 */

// Task entity
export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;

  // Dates
  dueDate?: string;
  startDate?: string;
  completedAt?: string;

  // Assignment
  assigneeId?: string;
  assigneeName?: string;
  createdBy: string;

  // Organization
  projectId?: string;
  projectName?: string;
  parentTaskId?: string;
  subtasks?: Task[];
  tags: string[];
  category?: string;

  // Progress
  progress?: number;
  estimatedHours?: number;
  actualHours?: number;

  // Recurrence
  recurrence?: RecurrenceRule;
  recurringTaskId?: string;

  // Attachments & links
  attachments?: Attachment[];
  linkedContacts?: string[];
  linkedEvents?: string[];

  // Metadata
  customFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;

  // AI suggestions
  aiSuggestions?: AISuggestion[];
}

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'on_hold'
  | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Calendar event
export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: EventType;

  // Time
  startTime: string;
  endTime: string;
  allDay: boolean;
  timezone?: string;

  // Location
  location?: string;
  isVirtual?: boolean;
  meetingUrl?: string;

  // Attendees
  organizer?: EventAttendee;
  attendees?: EventAttendee[];

  // Recurrence
  recurrence?: RecurrenceRule;
  recurringEventId?: string;

  // Reminders
  reminders?: Reminder[];

  // Status
  status: EventStatus;
  visibility: EventVisibility;

  // Categories
  category?: string;
  tags?: string[];
  color?: string;

  // Links
  linkedTasks?: string[];
  linkedContacts?: string[];
  attachments?: Attachment[];

  // Metadata
  source?: EventSource;
  externalId?: string;
  customFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;

  // Meeting data
  meetingData?: MeetingData;
}

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

export type EventSource =
  | 'manual'
  | 'google'
  | 'outlook'
  | 'apple'
  | 'import'
  | 'api';

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
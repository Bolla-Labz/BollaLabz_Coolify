// Last Modified: 2025-11-23 17:30
/**
 * Event/Calendar Type Definitions
 *
 * Types for calendar events, scheduling, and event management
 */

export type EventType = 'meeting' | 'call' | 'task' | 'reminder' | 'deadline' | 'other';
export type EventStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  status: EventStatus;
  startTime: Date;
  endTime: Date;
  allDay?: boolean;
  location?: string;
  participants?: string[];
  contactId?: string;
  reminders?: EventReminder[];
  recurrence?: RecurrenceRule;
  color?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventReminder {
  id: string;
  type: 'email' | 'sms' | 'push' | 'popup';
  minutesBefore: number;
  sent?: boolean;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  count?: number;
  daysOfWeek?: number[];
}

export interface CreateEventInput {
  title: string;
  description?: string;
  type: EventType;
  status?: EventStatus;
  startTime: Date;
  endTime: Date;
  allDay?: boolean;
  location?: string;
  participants?: string[];
  contactId?: string;
  reminders?: Omit<EventReminder, 'id'>[];
  recurrence?: RecurrenceRule;
  color?: string;
  metadata?: Record<string, any>;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
}

export interface CalendarFilters {
  types?: EventType[];
  statuses?: EventStatus[];
  contactIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export interface DaySchedule {
  date: Date;
  events: CalendarEvent[];
  totalEvents: number;
  hasConflicts: boolean;
}

export interface WeekSchedule {
  weekStart: Date;
  weekEnd: Date;
  days: DaySchedule[];
}

// Last Modified: 2025-11-23 17:30
/**
 * Schedule Store
 *
 * Manages calendar events, scheduling, and time management including:
 * - Calendar events
 * - Event participants and reminders
 * - Day/week/month views
 * - Event filtering and search
 * - Recurring events
 * - Scheduling conflicts detection
 */

import { create } from 'zustand';
import { scheduleAPI } from '@/lib/api/store-adapter';
import {
  CalendarEvent,
  EventType,
  EventStatus,
  CreateEventInput,
  UpdateEventInput,
  CalendarFilters,
  DaySchedule,
  WeekSchedule,
} from '@/types/event';

type ViewMode = 'day' | 'week' | 'month' | 'agenda';

interface ScheduleState {
  // Core Data
  events: CalendarEvent[];
  selectedEvent: CalendarEvent | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Calendar State
  currentDate: Date;
  viewMode: ViewMode;
  selectedDate: Date | null;

  // Filters
  filters: CalendarFilters;

  // Actions - Data Fetching
  fetchEvents: (dateRange?: { start: Date; end: Date }) => Promise<void>;
  fetchEventById: (id: string) => Promise<void>;

  // Actions - Event CRUD
  createEvent: (input: CreateEventInput) => Promise<CalendarEvent | null>;
  updateEvent: (id: string, input: UpdateEventInput) => Promise<CalendarEvent | null>;
  deleteEvent: (id: string) => Promise<boolean>;
  duplicateEvent: (id: string, newStartTime: Date) => Promise<CalendarEvent | null>;

  // Actions - Event Status
  markAsCompleted: (id: string) => Promise<boolean>;
  markAsInProgress: (id: string) => Promise<boolean>;
  cancelEvent: (id: string) => Promise<boolean>;

  // Actions - Calendar Navigation
  setCurrentDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  selectDate: (date: Date | null) => void;
  goToToday: () => void;
  goToNext: () => void;
  goToPrevious: () => void;

  // Actions - Filters
  setFilters: (filters: CalendarFilters) => void;
  resetFilters: () => void;

  // Actions - Selection
  selectEvent: (event: CalendarEvent | null) => void;

  // Actions - Utility
  clearError: () => void;
  reset: () => void;

  // Selectors (Derived State)
  getFilteredEvents: () => CalendarEvent[];
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForWeek: (weekStart: Date) => WeekSchedule;
  getDaySchedule: (date: Date) => DaySchedule;
  getUpcomingEvents: (limit?: number) => CalendarEvent[];
  hasConflict: (event: CreateEventInput | UpdateEventInput, excludeId?: string) => boolean;
  getEventsByType: (type: EventType) => CalendarEvent[];
  getEventsByStatus: (status: EventStatus) => CalendarEvent[];
}

// Default state
const defaultState = {
  events: [],
  selectedEvent: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  currentDate: new Date(),
  viewMode: 'week' as ViewMode,
  selectedDate: null,
  filters: {},
};

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  ...defaultState,

  // ============================================================================
  // Data Fetching Actions
  // ============================================================================

  fetchEvents: async (dateRange?: { start: Date; end: Date }): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // const response = await scheduleApi.getEvents(dateRange);
      // set({ events: response.data, lastUpdated: new Date() });

      // Mock implementation
      set({ events: [], isLoading: false, lastUpdated: new Date() });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch events';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchEventById: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // const response = await scheduleApi.getEventById(id);
      // set({ selectedEvent: response.data, isLoading: false });

      // Mock implementation
      const event = get().events.find((e) => e.id === id);
      set({ selectedEvent: event || null, isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch event';
      set({ error: errorMessage, isLoading: false });
    }
  },

  // ============================================================================
  // Event CRUD Actions
  // ============================================================================

  createEvent: async (input: CreateEventInput): Promise<CalendarEvent | null> => {
    set({ isLoading: true, error: null });
    try {
      // Check for conflicts
      if (get().hasConflict(input)) {
        throw new Error('Event conflicts with existing event');
      }

      // TODO: Replace with actual API call
      // const response = await scheduleApi.createEvent(input);
      // const newEvent = response.data;

      // Mock implementation
      const newEvent: CalendarEvent = {
        id: Math.random().toString(36).substr(2, 9),
        ...input,
        // Generate ids for reminders if they exist
        reminders: input.reminders?.map(r => ({
          ...r,
          id: Math.random().toString(36).substr(2, 9),
        })),
        status: input.status || 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      set((state) => ({
        events: [...state.events, newEvent],
        isLoading: false,
      }));

      return newEvent;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create event';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  updateEvent: async (id: string, input: UpdateEventInput): Promise<CalendarEvent | null> => {
    set({ isLoading: true, error: null });
    try {
      const event = get().events.find((e) => e.id === id);
      if (!event) throw new Error('Event not found');

      // Check for conflicts (excluding current event)
      if (get().hasConflict(input, id)) {
        throw new Error('Event conflicts with existing event');
      }

      // TODO: Replace with actual API call
      // const response = await scheduleApi.updateEvent(id, input);
      // const updatedEvent = response.data;

      // Mock implementation
      const updatedEvent: CalendarEvent = {
        ...event,
        ...input,
        // Generate ids for reminders if they exist in input
        reminders: input.reminders?.map(r => ({
          ...r,
          id: Math.random().toString(36).substr(2, 9),
        })) || event.reminders,
        updatedAt: new Date(),
      };

      set((state) => ({
        events: state.events.map((e) => (e.id === id ? updatedEvent : e)),
        selectedEvent: state.selectedEvent?.id === id ? updatedEvent : state.selectedEvent,
        isLoading: false,
      }));

      return updatedEvent;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update event';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  deleteEvent: async (id: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // await scheduleApi.deleteEvent(id);

      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
        isLoading: false,
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete event';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  duplicateEvent: async (id: string, newStartTime: Date): Promise<CalendarEvent | null> => {
    try {
      const event = get().events.find((e) => e.id === id);
      if (!event) throw new Error('Event not found');

      const duration = event.endTime.getTime() - event.startTime.getTime();
      const newEndTime = new Date(newStartTime.getTime() + duration);

      return get().createEvent({
        title: `${event.title} (Copy)`,
        description: event.description,
        type: event.type,
        startTime: newStartTime,
        endTime: newEndTime,
        allDay: event.allDay,
        location: event.location,
        recurrence: event.recurrence,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate event';
      set({ error: errorMessage });
      return null;
    }
  },

  // ============================================================================
  // Event Status Actions
  // ============================================================================

  markAsCompleted: async (id: string): Promise<boolean> => {
    return (await get().updateEvent(id, { id, status: 'completed' })) !== null;
  },

  markAsInProgress: async (id: string): Promise<boolean> => {
    return (await get().updateEvent(id, { id, status: 'in-progress' })) !== null;
  },

  cancelEvent: async (id: string): Promise<boolean> => {
    return (await get().updateEvent(id, { id, status: 'cancelled' })) !== null;
  },

  // ============================================================================
  // Calendar Navigation Actions
  // ============================================================================

  setCurrentDate: (date: Date): void => {
    set({ currentDate: date });
  },

  setViewMode: (mode: ViewMode): void => {
    set({ viewMode: mode });
  },

  selectDate: (date: Date | null): void => {
    set({ selectedDate: date });
  },

  goToToday: (): void => {
    set({ currentDate: new Date() });
  },

  goToNext: (): void => {
    const { currentDate, viewMode } = get();
    const newDate = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'agenda':
        newDate.setDate(newDate.getDate() + 7);
        break;
    }

    set({ currentDate: newDate });
  },

  goToPrevious: (): void => {
    const { currentDate, viewMode } = get();
    const newDate = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'agenda':
        newDate.setDate(newDate.getDate() - 7);
        break;
    }

    set({ currentDate: newDate });
  },

  // ============================================================================
  // Filter Actions
  // ============================================================================

  setFilters: (filters: CalendarFilters): void => {
    set({ filters });
  },

  resetFilters: (): void => {
    set({ filters: {} });
  },

  // ============================================================================
  // Selection Actions
  // ============================================================================

  selectEvent: (event: CalendarEvent | null): void => {
    set({ selectedEvent: event });
  },

  // ============================================================================
  // Utility Actions
  // ============================================================================

  clearError: (): void => {
    set({ error: null });
  },

  reset: (): void => {
    set(defaultState);
  },

  // ============================================================================
  // Selectors (Derived State)
  // ============================================================================

  getFilteredEvents: (): CalendarEvent[] => {
    const { events, filters } = get();

    return events.filter((event) => {
      // Type filter
      if (filters.types?.length && !filters.types.includes(event.type)) {
        return false;
      }

      // Status filter
      if (filters.statuses?.length && !filters.statuses.includes(event.status)) {
        return false;
      }

      // Participant filter
      if (filters.contactIds?.length) {
        const hasParticipant = event.participants?.some((p) =>
          filters.contactIds?.includes(p)
        );
        if (!hasParticipant) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const eventStart = new Date(event.startTime);
        if (eventStart < filters.dateRange.start || eventStart > filters.dateRange.end) {
          return false;
        }
      }

      // Search filter
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(searchLower);
        const matchesDescription = event.description?.toLowerCase().includes(searchLower);
        const matchesLocation = event.location?.toLowerCase().includes(searchLower);

        if (!matchesTitle && !matchesDescription && !matchesLocation) {
          return false;
        }
      }

      return true;
    });
  },

  getEventsForDate: (date: Date): CalendarEvent[] => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return get()
      .getFilteredEvents()
      .filter((event) => {
        const eventStart = new Date(event.startTime);
        return eventStart >= startOfDay && eventStart <= endOfDay;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  },

  getEventsForWeek: (weekStart: Date): WeekSchedule => {
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);

    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const days: DaySchedule[] = [];
    let totalEvents = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);

      const daySchedule = get().getDaySchedule(date);
      days.push(daySchedule);
      totalEvents += daySchedule.totalEvents;
    }

    return {
      weekStart: start,
      weekEnd: end,
      days,
    };
  },

  getDaySchedule: (date: Date): DaySchedule => {
    const events = get().getEventsForDate(date);
    const totalEvents = events.length;

    // TODO: Calculate busy and free slots
    // TODO: Implement conflict detection

    return {
      date,
      events,
      totalEvents,
      hasConflicts: false, // TODO: Implement conflict detection
    };
  },

  getUpcomingEvents: (limit = 5): CalendarEvent[] => {
    const now = new Date();

    return get()
      .getFilteredEvents()
      .filter((event) => new Date(event.startTime) > now && event.status !== 'cancelled')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, limit);
  },

  hasConflict: (
    eventInput: CreateEventInput | UpdateEventInput,
    excludeId?: string
  ): boolean => {
    if (!eventInput.startTime || !eventInput.endTime) return false;

    const events = get().events.filter((e) => e.id !== excludeId && e.status !== 'cancelled');

    return events.some((event) => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const inputStart = new Date(eventInput.startTime!);
      const inputEnd = new Date(eventInput.endTime!);

      // Check for overlap
      return inputStart < eventEnd && inputEnd > eventStart;
    });
  },

  getEventsByType: (type: EventType): CalendarEvent[] => {
    return get()
      .getFilteredEvents()
      .filter((event) => event.type === type);
  },

  getEventsByStatus: (status: EventStatus): CalendarEvent[] => {
    return get()
      .getFilteredEvents()
      .filter((event) => event.status === status);
  },
}));

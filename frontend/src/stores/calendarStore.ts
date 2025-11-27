// Last Modified: 2025-11-23 17:30
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import calendarService, {
  CalendarEvent as BackendCalendarEvent,
  CreateCalendarEventDTO,
  UpdateCalendarEventDTO
} from '@/services/calendarService';
import toast from 'react-hot-toast';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date | string;
  end: Date | string;
  allDay?: boolean;
  location?: string;
  color?: string;
  attendees?: string[];
  reminders?: {
    method: 'email' | 'popup' | 'sms';
    minutes: number;
  }[];
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    until?: Date;
    count?: number;
    daysOfWeek?: number[];
  };
  status?: 'tentative' | 'confirmed' | 'cancelled';
  type?: 'meeting' | 'call' | 'task' | 'reminder' | 'other';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface CalendarView {
  type: 'month' | 'week' | 'day' | 'list';
  date: Date;
}

interface CalendarStore {
  events: CalendarEvent[];
  currentView: CalendarView;
  selectedEvent: CalendarEvent | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadEvents: () => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  selectEvent: (event: CalendarEvent | null) => void;
  setView: (view: Partial<CalendarView>) => void;
  loadMockEvents: () => void;

  // Queries
  getEventsByDate: (date: Date) => CalendarEvent[];
  getEventsByRange: (start: Date, end: Date) => CalendarEvent[];
  getUpcomingEvents: (limit?: number) => CalendarEvent[];
}

// Mock event generator
const generateMockEvents = (): CalendarEvent[] => {
  const now = new Date();
  const events: CalendarEvent[] = [];

  // Today's events
  events.push({
    id: '1',
    title: 'Team Standup',
    description: 'Daily team sync meeting',
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30),
    type: 'meeting',
    color: '#3b82f6',
    attendees: ['john@example.com', 'jane@example.com'],
    location: 'Zoom',
    recurrence: {
      frequency: 'daily',
      interval: 1,
    },
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  events.push({
    id: '2',
    title: 'Client Call - Acme Corp',
    description: 'Quarterly review with Acme Corp',
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0),
    type: 'call',
    color: '#10b981',
    attendees: ['client@acme.com'],
    location: 'Phone',
    reminders: [
      { method: 'popup', minutes: 15 },
      { method: 'email', minutes: 60 },
    ],
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Tomorrow's events
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  events.push({
    id: '3',
    title: 'Product Demo',
    description: 'Demo new features to stakeholders',
    start: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 0),
    end: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12, 0),
    type: 'meeting',
    color: '#8b5cf6',
    location: 'Conference Room A',
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Next week events
  for (let i = 4; i < 10; i++) {
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() + i);

    events.push({
      id: i.toString(),
      title: `Event ${i}`,
      description: `Description for event ${i}`,
      start: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 10 + i, 0),
      end: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 11 + i, 0),
      type: i % 2 === 0 ? 'meeting' : 'task',
      color: i % 3 === 0 ? '#ef4444' : i % 3 === 1 ? '#f59e0b' : '#06b6d4',
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // All-day events
  events.push({
    id: '10',
    title: 'Conference',
    description: 'Annual Tech Conference',
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 9),
    allDay: true,
    type: 'other',
    color: '#ec4899',
    location: 'San Francisco',
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return events;
};

// Helper function to convert backend event to frontend event
const backendToFrontend = (backendEvent: BackendCalendarEvent): CalendarEvent => {
  const eventType = backendEvent.title.toLowerCase().includes('meeting') ? 'meeting' :
                    backendEvent.title.toLowerCase().includes('call') ? 'call' :
                    backendEvent.title.toLowerCase().includes('task') ? 'task' : 'other';

  const color = eventType === 'meeting' ? '#3b82f6' :
                eventType === 'call' ? '#10b981' :
                eventType === 'task' ? '#f59e0b' : '#6b7280';

  // Extract is_all_day and reminder_minutes from metadata if they exist
  const metadata = backendEvent.metadata || {};
  const isAllDay = metadata.is_all_day || false;
  const reminderMinutes = metadata.reminder_minutes;

  return {
    id: backendEvent.id.toString(),
    title: backendEvent.title,
    description: backendEvent.description,
    start: backendEvent.start_time,
    end: backendEvent.end_time,
    allDay: isAllDay,
    location: backendEvent.location,
    attendees: backendEvent.attendees,
    type: eventType,
    color,
    reminders: reminderMinutes ? [
      { method: 'popup', minutes: reminderMinutes }
    ] : undefined,
    status: 'confirmed',
    metadata: backendEvent.metadata,
    createdAt: new Date(backendEvent.created_at),
    updatedAt: new Date(backendEvent.updated_at),
  };
};

export const useCalendarStore = create<CalendarStore>()(
  devtools(
    persist(
      (set, get) => ({
        events: [],
        currentView: {
          type: 'month',
          date: new Date(),
        },
        selectedEvent: null,
        isLoading: false,
        error: null,

        loadEvents: async () => {
          set({ isLoading: true, error: null });
          try {
            const backendEvents = await calendarService.getAll();
            const frontendEvents = backendEvents.map(backendToFrontend);
            set({ events: frontendEvents, isLoading: false });
          } catch (error: any) {
            const errorMessage = error.message || 'Failed to load calendar events';
            set({ error: errorMessage, isLoading: false });
            toast.error(errorMessage);
          }
        },

        addEvent: async (eventData) => {
          set({ isLoading: true, error: null });
          try {
            const createDto: CreateCalendarEventDTO = {
              title: eventData.title,
              description: eventData.description,
              startTime: eventData.start,
              endTime: eventData.end,
              location: eventData.location,
              attendees: eventData.attendees,
              metadata: {
                is_all_day: eventData.allDay,
                reminder_minutes: eventData.reminders?.[0]?.minutes,
                type: eventData.type,
              },
            };

            const backendEvent = await calendarService.create(createDto);
            const frontendEvent = backendToFrontend(backendEvent);

            set((state) => ({
              events: [...state.events, frontendEvent],
              isLoading: false,
            }));

            toast.success('Event created successfully');
          } catch (error: any) {
            const errorMessage = error.message || 'Failed to create event';
            set({ error: errorMessage, isLoading: false });
            toast.error(errorMessage);
            throw error;
          }
        },

        updateEvent: async (id, eventData) => {
          set({ isLoading: true, error: null });
          try {
            const updateDto: UpdateCalendarEventDTO = {};

            if (eventData.title !== undefined) updateDto.title = eventData.title;
            if (eventData.description !== undefined) updateDto.description = eventData.description;
            if (eventData.start !== undefined) updateDto.startTime = eventData.start;
            if (eventData.end !== undefined) updateDto.endTime = eventData.end;
            if (eventData.location !== undefined) updateDto.location = eventData.location;
            if (eventData.attendees !== undefined) updateDto.attendees = eventData.attendees;

            // Update metadata with allDay and reminder info
            if (eventData.allDay !== undefined || eventData.reminders !== undefined || eventData.type !== undefined) {
              updateDto.metadata = {
                is_all_day: eventData.allDay,
                reminder_minutes: eventData.reminders?.[0]?.minutes,
                type: eventData.type,
              };
            }

            const backendEvent = await calendarService.update(parseInt(id), updateDto);
            const frontendEvent = backendToFrontend(backendEvent);

            set((state) => ({
              events: state.events.map((event) =>
                event.id === id ? frontendEvent : event
              ),
              isLoading: false,
            }));

            toast.success('Event updated successfully');
          } catch (error: any) {
            const errorMessage = error.message || 'Failed to update event';
            set({ error: errorMessage, isLoading: false });
            toast.error(errorMessage);
            throw error;
          }
        },

        deleteEvent: async (id) => {
          set({ isLoading: true, error: null });
          try {
            await calendarService.delete(parseInt(id));

            set((state) => ({
              events: state.events.filter((event) => event.id !== id),
              selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
              isLoading: false,
            }));

            toast.success('Event deleted successfully');
          } catch (error: any) {
            const errorMessage = error.message || 'Failed to delete event';
            set({ error: errorMessage, isLoading: false });
            toast.error(errorMessage);
            throw error;
          }
        },

        selectEvent: (event) => {
          set({ selectedEvent: event });
        },

        setView: (view) => {
          set((state) => ({
            currentView: { ...state.currentView, ...view },
          }));
        },

        loadMockEvents: () => {
          const mockEvents = generateMockEvents();
          set({ events: mockEvents });
        },

        getEventsByDate: (date) => {
          const { events } = get();
          return events.filter((event) => {
            const eventStart = new Date(event.start);
            return (
              eventStart.getFullYear() === date.getFullYear() &&
              eventStart.getMonth() === date.getMonth() &&
              eventStart.getDate() === date.getDate()
            );
          });
        },

        getEventsByRange: (start, end) => {
          const { events } = get();
          return events.filter((event) => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            return (
              (eventStart >= start && eventStart <= end) ||
              (eventEnd >= start && eventEnd <= end) ||
              (eventStart <= start && eventEnd >= end)
            );
          });
        },

        getUpcomingEvents: (limit = 5) => {
          const { events } = get();
          const now = new Date();
          return events
            .filter((event) => new Date(event.start) >= now)
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
            .slice(0, limit);
        },
      }),
      {
        name: 'calendar-storage',
        partialize: (state) => ({
          events: state.events,
          currentView: state.currentView,
        }),
      }
    ),
    {
      name: 'calendar-store',
    }
  )
);
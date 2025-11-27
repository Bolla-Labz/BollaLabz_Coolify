// Last Modified: 2025-11-23 17:30
import { apiClient } from '@/lib/api/client';

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarEventDTO {
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  location?: string;
  attendees?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateCalendarEventDTO {
  title?: string;
  description?: string;
  startTime?: Date | string;
  endTime?: Date | string;
  location?: string;
  attendees?: string[];
  metadata?: Record<string, any>;
}

export interface CalendarEventsResponse {
  success: boolean;
  data: CalendarEvent[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SingleCalendarEventResponse {
  success: boolean;
  data: CalendarEvent;
}

class CalendarService {
  private baseUrl = '/calendar/events';

  // Helper to format dates to ISO string
  private formatDate(date: Date | string): string {
    if (typeof date === 'string') return date;
    return date.toISOString();
  }

  async getAll(): Promise<CalendarEvent[]> {
    const response = await apiClient.get<CalendarEventsResponse>(this.baseUrl);
    return response.data.data;
  }

  async getById(id: number): Promise<CalendarEvent> {
    const response = await apiClient.get<SingleCalendarEventResponse>(
      `${this.baseUrl}/${id}`
    );
    return response.data.data;
  }

  async create(data: CreateCalendarEventDTO): Promise<CalendarEvent> {
    const response = await apiClient.post<SingleCalendarEventResponse>(
      this.baseUrl,
      {
        title: data.title,
        description: data.description,
        start_time: this.formatDate(data.startTime),
        end_time: this.formatDate(data.endTime),
        location: data.location,
        attendees: data.attendees || [],
        metadata: data.metadata || {},
      }
    );
    return response.data.data;
  }

  async update(id: number, data: UpdateCalendarEventDTO): Promise<CalendarEvent> {
    const updatePayload: any = {};

    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.startTime !== undefined) updatePayload.start_time = this.formatDate(data.startTime);
    if (data.endTime !== undefined) updatePayload.end_time = this.formatDate(data.endTime);
    if (data.location !== undefined) updatePayload.location = data.location;
    if (data.attendees !== undefined) updatePayload.attendees = data.attendees;
    if (data.metadata !== undefined) updatePayload.metadata = data.metadata;

    const response = await apiClient.put<SingleCalendarEventResponse>(
      `${this.baseUrl}/${id}`,
      updatePayload
    );
    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const response = await apiClient.get<CalendarEventsResponse>(this.baseUrl, {
      params: {
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
      },
    });
    return response.data.data;
  }
}

export const calendarService = new CalendarService();
export default calendarService;

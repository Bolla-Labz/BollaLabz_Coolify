// Last Modified: 2025-11-24 00:00
import React, { useState, useEffect } from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { EventForm } from '@/components/calendar/EventForm';
import { CalendarMonthSkeleton } from '@/components/skeletons';
import { NoCalendarEvents } from '@/components/empty-states';
import { useCalendarStore } from '@/stores/calendarStore';

export default function Calendar() {
  const { events, loadEvents, selectEvent, isLoading } = useCalendarStore();
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadEvents().catch((error) => {
      console.error('Failed to load calendar events:', error);
      // Error is already handled by the store (toast shown)
    });
  }, [loadEvents]);

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setIsEventFormOpen(true);
  };

  const handleDateSelect = (start: Date, end: Date) => {
    setSelectedDate(start);
    setSelectedEvent(null);
    setIsEventFormOpen(true);
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setSelectedDate(new Date());
    setIsEventFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsEventFormOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground mt-1">
          Schedule and manage your events
        </p>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <CalendarMonthSkeleton />
        ) : events.length === 0 ? (
          <NoCalendarEvents onCreateEvent={handleCreateEvent} />
        ) : (
          <CalendarView
            onEventClick={handleEventClick}
            onDateSelect={handleDateSelect}
            onCreateEvent={handleCreateEvent}
          />
        )}
      </div>

      <EventForm
        isOpen={isEventFormOpen}
        onClose={handleCloseForm}
        event={selectedEvent}
        initialDate={selectedDate || undefined}
      />
    </div>
  );
}
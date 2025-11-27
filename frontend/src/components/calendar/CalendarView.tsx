// Last Modified: 2025-11-23 17:30
import React, { useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  CalendarClock,
  List,
  Plus,
  Settings,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCalendarStore } from '@/stores/calendarStore';

interface CalendarViewProps {
  onEventClick?: (event: any) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  onEventDrop?: (event: any) => void;
  onCreateEvent?: () => void;
}

export function CalendarView({
  onEventClick,
  onDateSelect,
  onEventDrop,
  onCreateEvent,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const { events, currentView, setView } = useCalendarStore();

  const handleEventClick = (arg: EventClickArg) => {
    const event = events.find((e) => e.id === arg.event.id);
    if (event) {
      onEventClick?.(event);
    }
  };

  const handleDateSelect = (arg: DateSelectArg) => {
    onDateSelect?.(arg.start, arg.end);
  };

  const handleEventDrop = (arg: EventDropArg) => {
    const event = {
      id: arg.event.id,
      start: arg.event.start,
      end: arg.event.end,
    };
    onEventDrop?.(event);
  };

  const handlePrev = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.prev();
  };

  const handleNext = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.next();
  };

  const handleToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.today();
  };

  const handleViewChange = (view: 'month' | 'week' | 'day' | 'list') => {
    const calendarApi = calendarRef.current?.getApi();

    switch (view) {
      case 'month':
        calendarApi?.changeView('dayGridMonth');
        break;
      case 'week':
        calendarApi?.changeView('timeGridWeek');
        break;
      case 'day':
        calendarApi?.changeView('timeGridDay');
        break;
      case 'list':
        calendarApi?.changeView('listWeek');
        break;
    }

    setView({ type: view });
  };

  // Convert events to FullCalendar format
  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    backgroundColor: event.color,
    borderColor: event.color,
    extendedProps: {
      description: event.description,
      location: event.location,
      type: event.type,
      attendees: event.attendees,
    },
  }));

  return (
    <Card className="p-6 h-full flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="px-3"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Current Date Display */}
          <h2 className="text-lg font-semibold">
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="flex items-center rounded-lg border p-1">
            <Button
              variant={currentView.type === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('month')}
              className="h-7 px-2"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Month
            </Button>
            <Button
              variant={currentView.type === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('week')}
              className="h-7 px-2"
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Week
            </Button>
            <Button
              variant={currentView.type === 'day' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('day')}
              className="h-7 px-2"
            >
              <CalendarClock className="h-4 w-4 mr-1" />
              Day
            </Button>
            <Button
              variant={currentView.type === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('list')}
              className="h-7 px-2"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>

          {/* Actions */}
          <Button onClick={onCreateEvent} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Event
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Calendar Settings</DropdownMenuItem>
              <DropdownMenuItem>Sync Calendars</DropdownMenuItem>
              <DropdownMenuItem>Export Calendar</DropdownMenuItem>
              <DropdownMenuItem>Import Events</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Calendar Component */}
      <div className="flex-1 calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={currentView.type === 'month' ? 'dayGridMonth' :
                       currentView.type === 'week' ? 'timeGridWeek' :
                       currentView.type === 'day' ? 'timeGridDay' : 'listWeek'}
          events={calendarEvents}
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          headerToolbar={false} // We're using our custom header
          height="100%"
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short',
          }}
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short',
          }}
          eventClassNames={(arg) => {
            const type = arg.event.extendedProps.type;
            return [`event-type-${type}`];
          }}
        />
      </div>

      <style>{`
        .calendar-wrapper {
          min-height: 0;
        }

        .fc {
          height: 100%;
        }

        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: hsl(var(--border));
        }

        .fc-theme-standard .fc-scrollgrid {
          border-color: hsl(var(--border));
        }

        .fc-button-primary {
          background-color: hsl(var(--primary));
          border-color: hsl(var(--primary));
        }

        .fc-button-primary:hover {
          background-color: hsl(var(--primary) / 0.9);
          border-color: hsl(var(--primary) / 0.9);
        }

        .fc-button-primary:disabled {
          background-color: hsl(var(--muted));
          border-color: hsl(var(--muted));
        }

        .fc-button-active {
          background-color: hsl(var(--primary)) !important;
          border-color: hsl(var(--primary)) !important;
        }

        .fc-daygrid-day-number,
        .fc-col-header-cell-cushion {
          color: hsl(var(--foreground));
          text-decoration: none;
        }

        .fc-daygrid-day.fc-day-today {
          background-color: hsl(var(--accent));
        }

        .fc-event {
          border: none;
          padding: 2px 4px;
          font-size: 12px;
          border-radius: 4px;
        }

        .fc-event-title {
          font-weight: 500;
        }

        .fc-daygrid-event-dot {
          border-color: currentColor;
        }

        .fc-list-event:hover td {
          background-color: hsl(var(--muted));
        }

        /* Event type styles */
        .event-type-meeting {
          background-color: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }

        .event-type-call {
          background-color: #10b981 !important;
          border-color: #10b981 !important;
        }

        .event-type-task {
          background-color: #f59e0b !important;
          border-color: #f59e0b !important;
        }

        .event-type-reminder {
          background-color: #8b5cf6 !important;
          border-color: #8b5cf6 !important;
        }

        .event-type-other {
          background-color: #6b7280 !important;
          border-color: #6b7280 !important;
        }

        /* Dark mode support */
        .dark .fc-theme-standard td,
        .dark .fc-theme-standard th {
          border-color: hsl(var(--border));
        }

        .dark .fc-col-header-cell-cushion,
        .dark .fc-daygrid-day-number {
          color: hsl(var(--foreground));
        }

        .dark .fc-list-day-cushion,
        .dark .fc-list-event-title {
          color: hsl(var(--foreground));
        }

        .dark .fc-list-event-time {
          color: hsl(var(--muted-foreground));
        }

        .dark .fc-daygrid-day.fc-day-today {
          background-color: hsl(var(--accent));
        }

        .dark .fc-scrollgrid-section-body > td {
          background-color: hsl(var(--background));
        }

        .dark .fc-popover {
          background-color: hsl(var(--popover));
          border-color: hsl(var(--border));
        }

        .dark .fc-popover-header {
          background-color: hsl(var(--muted));
        }

        .dark .fc-more-link {
          color: hsl(var(--primary));
        }
      `}</style>
    </Card>
  );
}
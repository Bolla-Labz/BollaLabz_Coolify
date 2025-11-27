// Last Modified: 2025-11-24 00:00
import { Calendar } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface NoCalendarEventsProps {
  onCreateEvent: () => void;
}

export function NoCalendarEvents({ onCreateEvent }: NoCalendarEventsProps) {
  return (
    <EmptyState
      icon={Calendar}
      title="No upcoming events"
      description="Your calendar is clear. Schedule a meeting, set a reminder, or add an event to stay organized."
      action={{
        label: 'Create Event',
        onClick: onCreateEvent,
      }}
    />
  );
}

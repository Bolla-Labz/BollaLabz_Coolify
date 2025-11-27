// Last Modified: 2025-11-24 16:30
/**
 * Availability Checker Component
 * Visual time slot grid showing busy/free times with conflict detection
 * Features:
 * - Visual representation of calendar availability
 * - Conflict detection with existing events
 * - Suggested optimal meeting times
 * - Integration with calendar store
 */
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCalendarStore } from '@/stores/calendarStore';
import { Clock, AlertCircle, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';
import { formatInTimezone } from '@/lib/utils/TimeZoneManager';
import { cn } from '@/lib/utils';

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  conflicts: string[]; // Event IDs that conflict
}

interface AvailabilityCheckerProps {
  proposedStart: Date;
  proposedEnd: Date;
  timezone?: string;
  onSuggestTime?: (start: Date, end: Date) => void;
  showSuggestions?: boolean;
}

export function AvailabilityChecker({
  proposedStart,
  proposedEnd,
  timezone = 'UTC',
  onSuggestTime,
  showSuggestions = true,
}: AvailabilityCheckerProps) {
  const { events, getEventsByRange } = useCalendarStore();

  // Check for conflicts with existing events
  const conflicts = useMemo(() => {
    const conflictingEvents = events.filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // Check if events overlap
      return (
        (proposedStart >= eventStart && proposedStart < eventEnd) ||
        (proposedEnd > eventStart && proposedEnd <= eventEnd) ||
        (proposedStart <= eventStart && proposedEnd >= eventEnd)
      );
    });

    return conflictingEvents;
  }, [events, proposedStart, proposedEnd]);

  // Generate time slots for the day
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    const dayStart = new Date(proposedStart);
    dayStart.setHours(8, 0, 0, 0); // Business hours start at 8 AM

    const dayEnd = new Date(proposedStart);
    dayEnd.setHours(18, 0, 0, 0); // Business hours end at 6 PM

    // Create 30-minute slots
    let currentTime = new Date(dayStart);
    while (currentTime < dayEnd) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + 30);

      const conflictingEvents = events.filter((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return (
          (currentTime >= eventStart && currentTime < eventEnd) ||
          (slotEnd > eventStart && slotEnd <= eventEnd) ||
          (currentTime <= eventStart && slotEnd >= eventEnd)
        );
      });

      slots.push({
        start: new Date(currentTime),
        end: new Date(slotEnd),
        available: conflictingEvents.length === 0,
        conflicts: conflictingEvents.map((e) => e.id),
      });

      currentTime = slotEnd;
    }

    return slots;
  }, [proposedStart, events]);

  // Find suggested alternative times
  const suggestedTimes = useMemo(() => {
    if (!showSuggestions || conflicts.length === 0) return [];

    const duration = proposedEnd.getTime() - proposedStart.getTime();
    const suggestions: Array<{ start: Date; end: Date; score: number }> = [];

    // Look for available slots of the required duration
    for (let i = 0; i < timeSlots.length; i++) {
      const slot = timeSlots[i];
      if (!slot.available) continue;

      // Check if we can fit the full duration starting from this slot
      let consecutiveSlots = 1;
      let j = i + 1;
      while (j < timeSlots.length && timeSlots[j].available) {
        consecutiveSlots++;
        const totalDuration =
          timeSlots[j].end.getTime() - slot.start.getTime();
        if (totalDuration >= duration) {
          // Found a suitable slot
          const suggestedEnd = new Date(slot.start.getTime() + duration);

          // Calculate score (prefer earlier times)
          const hourOfDay = slot.start.getHours();
          const score = hourOfDay >= 9 && hourOfDay <= 15 ? 10 - Math.abs(hourOfDay - 10) : 5;

          suggestions.push({
            start: new Date(slot.start),
            end: suggestedEnd,
            score,
          });
          break;
        }
        j++;
      }
    }

    // Sort by score and return top 3
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [timeSlots, proposedStart, proposedEnd, conflicts, showSuggestions]);

  const hasConflicts = conflicts.length > 0;
  const duration = (proposedEnd.getTime() - proposedStart.getTime()) / (1000 * 60); // minutes

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Availability Check
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Proposed Time Summary */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Proposed Time:</span>
            {hasConflicts ? (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}
              </Badge>
            ) : (
              <Badge variant="default" className="gap-1 bg-green-600">
                <CheckCircle className="h-3 w-3" />
                Available
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            <div>{formatInTimezone(proposedStart, timezone, 'MMM D, YYYY')}</div>
            <div className="flex items-center gap-1">
              {formatInTimezone(proposedStart, timezone, 'h:mm A')}
              {' '}-{' '}
              {formatInTimezone(proposedEnd, timezone, 'h:mm A')}
              <span className="text-xs">({duration} min)</span>
            </div>
          </div>
        </div>

        {/* Conflict Details */}
        {hasConflicts && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Scheduling Conflicts:</div>
              <ul className="space-y-1">
                {conflicts.map((event) => (
                  <li key={event.id} className="text-sm flex items-center gap-2">
                    <CalendarIcon className="h-3 w-3" />
                    {event.title}
                    <span className="text-xs opacity-75">
                      ({formatInTimezone(event.start, timezone, 'h:mm A')} -
                      {formatInTimezone(event.end, timezone, 'h:mm A')})
                    </span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Visual Timeline */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Today's Schedule:</div>
          <div className="space-y-1">
            {timeSlots.map((slot, idx) => {
              const isProposed =
                proposedStart < slot.end && proposedEnd > slot.start;

              return (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded text-xs',
                    slot.available
                      ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300',
                    isProposed && 'ring-2 ring-primary'
                  )}
                >
                  <span className="font-mono w-24">
                    {formatInTimezone(slot.start, timezone, 'h:mm A')}
                  </span>
                  <div className="flex-1 h-1 rounded-full bg-current opacity-30" />
                  {isProposed && (
                    <Badge variant="outline" className="text-xs">
                      Proposed
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Suggested Alternative Times */}
        {showSuggestions && suggestedTimes.length > 0 && hasConflicts && (
          <div className="space-y-2 pt-4 border-t">
            <div className="text-sm font-medium">Suggested Alternative Times:</div>
            <div className="space-y-2">
              {suggestedTimes.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => onSuggestTime?.(suggestion.start, suggestion.end)}
                >
                  <span>
                    {formatInTimezone(suggestion.start, timezone, 'h:mm A')} -
                    {formatInTimezone(suggestion.end, timezone, 'h:mm A')}
                  </span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AvailabilityChecker;

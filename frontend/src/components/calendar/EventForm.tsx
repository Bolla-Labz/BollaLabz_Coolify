// Last Modified: 2025-11-24 16:35
/**
 * Enhanced Event Form Component
 * Features Ant Design date/time pickers, timezone support, recurring events, and availability checking
 * Zero Cognitive Load: Remembers preferences, suggests times, prevents conflicts
 */
import React, { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AntDatePicker } from '@/components/ui/ant-date-picker';
import { AntTimePicker } from '@/components/ui/ant-time-picker';
import { AntRangePicker } from '@/components/ui/ant-range-picker';
import { TimeZoneSelector, useTimezone } from '@/lib/utils/TimeZoneManager';
import { RecurringEventForm, RecurrenceRule } from './RecurringEventForm';
import { AvailabilityChecker } from './AvailabilityChecker';
import { useCalendarStore } from '@/stores/calendarStore';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Bell,
  Repeat,
  Tag,
  Globe,
} from 'lucide-react';

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  event?: any;
  initialDate?: Date;
}

export function EventForm({ isOpen, onClose, event, initialDate }: EventFormProps) {
  const { addEvent, updateEvent } = useCalendarStore();
  const { timezone } = useTimezone();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [eventType, setEventType] = useState(event?.type || 'meeting');
  const [allDay, setAllDay] = useState(event?.allDay || false);

  // Date/Time state
  const [startDate, setStartDate] = useState<Date | null>(
    event?.start ? new Date(event.start) : initialDate || new Date()
  );
  const [startTime, setStartTime] = useState<Date | null>(
    event?.start ? new Date(event.start) : initialDate || new Date()
  );
  const [endDate, setEndDate] = useState<Date | null>(
    event?.end ? new Date(event.end) : initialDate || new Date()
  );
  const [endTime, setEndTime] = useState<Date | null>(
    event?.end ? new Date(event.end) : initialDate || new Date()
  );

  // Other details
  const [location, setLocation] = useState(event?.location || '');
  const [attendees, setAttendees] = useState<string[]>(event?.attendees || []);
  const [attendeeInput, setAttendeeInput] = useState('');
  const [eventTimezone, setEventTimezone] = useState(event?.metadata?.timezone || timezone);

  // Recurrence
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(
    event?.recurrence || null
  );

  // Combine date and time into single Date objects
  const getStart = (): Date => {
    if (allDay || !startDate) return startDate || new Date();

    const combined = new Date(startDate);
    if (startTime) {
      const time = new Date(startTime);
      combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    }
    return combined;
  };

  const getEnd = (): Date => {
    if (allDay || !endDate) return endDate || new Date();

    const combined = new Date(endDate);
    if (endTime) {
      const time = new Date(endTime);
      combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    }
    return combined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    startTransition(async () => {
      try {
        const eventData = {
          title,
          description,
          start: getStart(),
          end: getEnd(),
          allDay,
          location,
          attendees,
          type: eventType,
          recurrence: recurrenceRule,
          metadata: {
            timezone: eventTimezone,
          },
        };

        if (event) {
          await updateEvent(event.id, eventData);
        } else {
          await addEvent(eventData as any);
        }
        onClose();
      } catch (error) {
        console.error('Failed to save event:', error);
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  const handleSuggestedTime = (start: Date, end: Date) => {
    setStartDate(start);
    setStartTime(start);
    setEndDate(end);
    setEndTime(end);
  };

  const addAttendee = () => {
    if (attendeeInput.trim() && !attendees.includes(attendeeInput.trim())) {
      setAttendees([...attendees, attendeeInput.trim()]);
      setAttendeeInput('');
    }
  };

  const removeAttendee = (email: string) => {
    setAttendees(attendees.filter((a) => a !== email));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Edit Event' : 'New Event'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="recurrence">Recurrence</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Team meeting, Client call, etc."
                  required
                />
              </div>

              {/* Event Type */}
              <div className="space-y-2">
                <Label>Event Type</Label>
                <div className="flex gap-2 flex-wrap">
                  {['meeting', 'call', 'task', 'reminder', 'other'].map((type) => (
                    <Badge
                      key={type}
                      variant={eventType === type ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => setEventType(type)}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <Label htmlFor="allDay" className="cursor-pointer">All Day Event</Label>
                </div>
                <Switch
                  id="allDay"
                  checked={allDay}
                  onCheckedChange={setAllDay}
                />
              </div>

              {/* Date & Time Selection */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Start Date/Time */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Start Date
                    </Label>
                    <AntDatePicker
                      value={startDate}
                      onChange={(date) => setStartDate(date)}
                      timezone={eventTimezone}
                    />
                  </div>

                  {!allDay && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Start Time
                      </Label>
                      <AntTimePicker
                        value={startTime}
                        onChange={(time) => setStartTime(time)}
                        timezone={eventTimezone}
                        use12Hours
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* End Date/Time */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      End Date
                    </Label>
                    <AntDatePicker
                      value={endDate}
                      onChange={(date) => setEndDate(date)}
                      timezone={eventTimezone}
                    />
                  </div>

                  {!allDay && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        End Time
                      </Label>
                      <AntTimePicker
                        value={endTime}
                        onChange={(time) => setEndTime(time)}
                        timezone={eventTimezone}
                        use12Hours
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Timezone Selector */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Timezone
                </Label>
                <TimeZoneSelector
                  value={eventTimezone}
                  onChange={setEventTimezone}
                  showCommonOnly={false}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Conference Room A, Zoom link, etc."
                />
              </div>

              {/* Attendees */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Attendees
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={attendeeInput}
                    onChange={(e) => setAttendeeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                    placeholder="Add email address"
                  />
                  <Button type="button" onClick={addAttendee} variant="outline">
                    Add
                  </Button>
                </div>
                {attendees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attendees.map((email) => (
                      <Badge key={email} variant="secondary">
                        {email}
                        <button
                          type="button"
                          onClick={() => removeAttendee(email)}
                          className="ml-2 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[100px] p-3 rounded-md border bg-background resize-none"
                  placeholder="Add notes, agenda, or details about this event..."
                />
              </div>
            </TabsContent>

            {/* Recurrence Tab */}
            <TabsContent value="recurrence" className="mt-4">
              <RecurringEventForm
                value={recurrenceRule}
                onChange={setRecurrenceRule}
                startDate={getStart()}
              />
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability" className="mt-4">
              {startDate && endDate && (
                <AvailabilityChecker
                  proposedStart={getStart()}
                  proposedEnd={getEnd()}
                  timezone={eventTimezone}
                  onSuggestTime={handleSuggestedTime}
                  showSuggestions={true}
                />
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending || isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || isSubmitting || !title.trim()}
              className={isPending || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isPending || isSubmitting
                ? 'Saving...'
                : event
                ? 'Update Event'
                : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EventForm;

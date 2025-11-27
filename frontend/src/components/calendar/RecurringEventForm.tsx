// Last Modified: 2025-11-24 16:25
/**
 * Recurring Event Form Component
 * Handles creation and editing of recurring calendar events with RRULE support
 * Features:
 * - Daily/Weekly/Monthly/Yearly recurrence patterns
 * - Custom intervals (every 2 weeks, first Monday, etc.)
 * - End date or occurrence count
 * - Exception dates for skipping specific instances
 */
import React, { useState } from 'react';
import { RRule, Frequency } from 'rrule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AntDatePicker } from '@/components/ui/ant-date-picker';
import { Repeat, Calendar, X } from 'lucide-react';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
  dayOfMonth?: number;
  monthOfYear?: number;
  until?: Date;
  count?: number;
  exceptions?: Date[];
}

interface RecurringEventFormProps {
  value?: RecurrenceRule | null;
  onChange?: (rule: RecurrenceRule | null) => void;
  startDate?: Date;
}

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const WEEKDAYS = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
];

export function RecurringEventForm({
  value,
  onChange,
  startDate = new Date(),
}: RecurringEventFormProps) {
  const [enabled, setEnabled] = useState(!!value);
  const [frequency, setFrequency] = useState<RecurrenceRule['frequency']>(
    value?.frequency || 'weekly'
  );
  const [interval, setInterval] = useState(value?.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    value?.daysOfWeek || [new Date(startDate).getDay()]
  );
  const [endType, setEndType] = useState<'never' | 'until' | 'count'>(
    value?.until ? 'until' : value?.count ? 'count' : 'never'
  );
  const [endDate, setEndDate] = useState<Date | null>(value?.until || null);
  const [occurrenceCount, setOccurrenceCount] = useState(value?.count || 10);
  const [exceptions, setExceptions] = useState<Date[]>(value?.exceptions || []);

  // Generate recurrence rule and notify parent
  const updateRule = () => {
    if (!enabled) {
      onChange?.(null);
      return;
    }

    const rule: RecurrenceRule = {
      frequency,
      interval,
    };

    if (frequency === 'weekly' && daysOfWeek.length > 0) {
      rule.daysOfWeek = daysOfWeek;
    }

    if (endType === 'until' && endDate) {
      rule.until = endDate;
    } else if (endType === 'count') {
      rule.count = occurrenceCount;
    }

    if (exceptions.length > 0) {
      rule.exceptions = exceptions;
    }

    onChange?.(rule);
  };

  React.useEffect(() => {
    updateRule();
  }, [enabled, frequency, interval, daysOfWeek, endType, endDate, occurrenceCount, exceptions]);

  // Convert to RRULE string for display
  const getRRuleString = (): string => {
    if (!enabled) return 'Does not repeat';

    try {
      const freqMap = {
        daily: RRule.DAILY,
        weekly: RRule.WEEKLY,
        monthly: RRule.MONTHLY,
        yearly: RRule.YEARLY,
      };

      const options: any = {
        freq: freqMap[frequency],
        interval,
        dtstart: startDate,
      };

      if (frequency === 'weekly' && daysOfWeek.length > 0) {
        // RRULE uses MO=0, TU=1, etc. but we use Sunday=0
        // Convert: Sunday=0 -> SU=6, Monday=1 -> MO=0, etc.
        options.byweekday = daysOfWeek.map((day) => (day + 6) % 7);
      }

      if (endType === 'until' && endDate) {
        options.until = endDate;
      } else if (endType === 'count') {
        options.count = occurrenceCount;
      }

      const rule = new RRule(options);
      return rule.toText();
    } catch (error) {
      return 'Invalid recurrence rule';
    }
  };

  const toggleWeekday = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  const addException = (date: Date | null) => {
    if (!date) return;
    if (!exceptions.find((e) => e.getTime() === date.getTime())) {
      setExceptions([...exceptions, date]);
    }
  };

  const removeException = (date: Date) => {
    setExceptions(exceptions.filter((e) => e.getTime() !== date.getTime()));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Recurring Event
          </CardTitle>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-4">
          {/* Frequency Selection */}
          <div className="space-y-2">
            <Label>Repeat</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">Every</Label>
                <Input
                  type="number"
                  min="1"
                  value={interval}
                  onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  {frequency === 'daily' && interval > 1 ? 'days' :
                   frequency === 'weekly' && interval > 1 ? 'weeks' :
                   frequency === 'monthly' && interval > 1 ? 'months' :
                   frequency === 'yearly' && interval > 1 ? 'years' :
                   frequency.slice(0, -2)}
                </span>
              </div>
            </div>
          </div>

          {/* Weekly - Day Selection */}
          {frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>Repeat on</Label>
              <div className="flex gap-2">
                {WEEKDAYS.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={daysOfWeek.includes(day.value) ? 'default' : 'outline'}
                    size="sm"
                    className="w-10"
                    onClick={() => toggleWeekday(day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* End Condition */}
          <div className="space-y-2">
            <Label>Ends</Label>
            <Select value={endType} onValueChange={(v: any) => setEndType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="until">On Date</SelectItem>
                <SelectItem value="count">After Occurrences</SelectItem>
              </SelectContent>
            </Select>

            {endType === 'until' && (
              <AntDatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="Select end date"
                disabledDate={(current) => current && current.toDate() < startDate}
              />
            )}

            {endType === 'count' && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={occurrenceCount}
                  onChange={(e) => setOccurrenceCount(parseInt(e.target.value) || 1)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">occurrences</span>
              </div>
            )}
          </div>

          {/* Exception Dates */}
          <div className="space-y-2">
            <Label>Skip Dates (Exceptions)</Label>
            <div className="flex gap-2">
              <AntDatePicker
                onChange={addException}
                placeholder="Add exception date"
                className="flex-1"
              />
            </div>
            {exceptions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {exceptions.map((date, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {date.toLocaleDateString()}
                    <button
                      type="button"
                      onClick={() => removeException(date)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Rule Summary */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Recurrence Summary:</p>
            <p className="text-sm text-muted-foreground">{getRRuleString()}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default RecurringEventForm;

// Last Modified: 2025-11-24 16:20
/**
 * TimeZone Manager Utility
 * Handles timezone detection, conversion, and display
 * Stores user timezone preferences in localStorage
 * Provides timezone selector component
 */
import React from 'react';
import moment from 'moment-timezone';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Common timezones for quick access
export const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
] as const;

// All available timezones
export const getAllTimezones = (): string[] => {
  return moment.tz.names();
};

// Get user's current timezone
export const detectUserTimezone = (): string => {
  return moment.tz.guess();
};

// Get timezone from localStorage or detect
export const getUserTimezone = (): string => {
  if (typeof window === 'undefined') return 'UTC';

  const stored = localStorage.getItem('user_timezone');
  if (stored && moment.tz.names().includes(stored)) {
    return stored;
  }

  const detected = detectUserTimezone();
  localStorage.setItem('user_timezone', detected);
  return detected;
};

// Set user timezone preference
export const setUserTimezone = (timezone: string): void => {
  if (typeof window === 'undefined') return;

  if (moment.tz.names().includes(timezone)) {
    localStorage.setItem('user_timezone', timezone);
  }
};

// Convert date between timezones
export const convertTimezone = (
  date: Date | string,
  fromTz: string,
  toTz: string
): Date => {
  return moment.tz(date, fromTz).tz(toTz).toDate();
};

// Get timezone offset string (e.g., "GMT-5")
export const getTimezoneOffset = (timezone: string): string => {
  const offset = moment.tz(timezone).format('Z');
  return `GMT${offset}`;
};

// Get timezone display name with offset
export const getTimezoneDisplay = (timezone: string): string => {
  const offset = getTimezoneOffset(timezone);
  const location = timezone.replace(/_/g, ' ');
  return `${location} (${offset})`;
};

// Group timezones by region
export const getTimezonesByRegion = (): Record<string, string[]> => {
  const timezones = moment.tz.names();
  const grouped: Record<string, string[]> = {};

  timezones.forEach((tz) => {
    const [region] = tz.split('/');
    if (!grouped[region]) {
      grouped[region] = [];
    }
    grouped[region].push(tz);
  });

  return grouped;
};

// Check if two dates are in the same day across timezones
export const isSameDayInTimezone = (
  date1: Date,
  date2: Date,
  timezone: string
): boolean => {
  const m1 = moment.tz(date1, timezone);
  const m2 = moment.tz(date2, timezone);
  return m1.isSame(m2, 'day');
};

// Format date for display in specific timezone
export const formatInTimezone = (
  date: Date | string,
  timezone: string,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string => {
  return moment.tz(date, timezone).format(format);
};

/**
 * TimeZoneSelector Component
 * Dropdown for selecting timezone with search and common timezones
 */
interface TimeZoneSelectorProps {
  value?: string;
  onChange?: (timezone: string) => void;
  showCommonOnly?: boolean;
  className?: string;
}

export function TimeZoneSelector({
  value,
  onChange,
  showCommonOnly = false,
  className,
}: TimeZoneSelectorProps) {
  const currentTimezone = value || getUserTimezone();

  const timezones = showCommonOnly
    ? COMMON_TIMEZONES
    : getAllTimezones();

  const handleChange = (newTimezone: string) => {
    setUserTimezone(newTimezone);
    onChange?.(newTimezone);
  };

  return (
    <div className={className}>
      <Select value={currentTimezone} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <SelectValue>
              {getTimezoneDisplay(currentTimezone)}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {!showCommonOnly && (
            <>
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                Common Timezones
              </div>
              {COMMON_TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {getTimezoneDisplay(tz)}
                </SelectItem>
              ))}
              <div className="my-1 h-px bg-border" />
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                All Timezones
              </div>
            </>
          )}
          {timezones.map((tz) => {
            if (!showCommonOnly || !COMMON_TIMEZONES.includes(tz as any)) {
              return (
                <SelectItem key={tz} value={tz}>
                  {getTimezoneDisplay(tz)}
                </SelectItem>
              );
            }
            return null;
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Hook for timezone management
 */
export function useTimezone() {
  const [timezone, setTimezone] = React.useState<string>(getUserTimezone());

  React.useEffect(() => {
    const stored = getUserTimezone();
    if (stored !== timezone) {
      setTimezone(stored);
    }
  }, []);

  const updateTimezone = (newTimezone: string) => {
    setUserTimezone(newTimezone);
    setTimezone(newTimezone);
  };

  return {
    timezone,
    setTimezone: updateTimezone,
    convertDate: (date: Date | string, toTz: string) =>
      convertTimezone(date, timezone, toTz),
    formatDate: (date: Date | string, format?: string) =>
      formatInTimezone(date, timezone, format),
    getOffset: () => getTimezoneOffset(timezone),
    getDisplay: () => getTimezoneDisplay(timezone),
  };
}

export default {
  getUserTimezone,
  setUserTimezone,
  detectUserTimezone,
  convertTimezone,
  getTimezoneOffset,
  getTimezoneDisplay,
  formatInTimezone,
  isSameDayInTimezone,
  TimeZoneSelector,
  useTimezone,
};

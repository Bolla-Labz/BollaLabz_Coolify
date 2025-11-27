// Last Modified: 2025-11-23 17:30
/**
 * Calendar Utilities
 * Helper functions for calendar and date operations
 */

import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  startOfDay
} from 'date-fns';

/**
 * Generate calendar grid for a given month
 * Returns 35 or 42 days (5 or 6 weeks) to fill the grid
 */
export function generateCalendarGrid(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

/**
 * Get week days (Sun-Sat)
 */
export function getWeekDays(short: boolean = false): string[] {
  if (short) {
    return ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  }
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

/**
 * Get month names
 */
export function getMonthNames(short: boolean = false): string[] {
  if (short) {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  }
  return [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
}

/**
 * Check if date is in current month
 */
export function isInMonth(date: Date, referenceDate: Date): boolean {
  return isSameMonth(date, referenceDate);
}

/**
 * Format date for display
 */
export function formatEventDate(date: Date): string {
  return format(date, 'MMM dd, yyyy');
}

/**
 * Format time for display
 */
export function formatEventTime(date: Date): string {
  return format(date, 'h:mm a');
}

/**
 * Format time range
 */
export function formatTimeRange(start: Date, end: Date): string {
  return `${formatEventTime(start)} - ${formatEventTime(end)}`;
}

/**
 * Get week range (Monday to Sunday)
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(date, { weekStartsOn: 1 })
  };
}

/**
 * Get time slots for day view (30-minute increments)
 */
export function getDayTimeSlots(startHour: number = 0, endHour: number = 24): Date[] {
  const today = startOfDay(new Date());
  const slots: Date[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute of [0, 30]) {
      const slot = new Date(today);
      slot.setHours(hour, minute, 0, 0);
      slots.push(slot);
    }
  }

  return slots;
}

/**
 * Calculate duration in minutes between two dates
 */
export function calculateDuration(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Check if time slot is in business hours
 */
export function isBusinessHours(date: Date): boolean {
  const hour = date.getHours();
  const day = date.getDay();

  // Monday-Friday, 9 AM - 5 PM
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
}

/**
 * Get relative date string (Today, Tomorrow, Yesterday, etc.)
 */
export function getRelativeDateString(date: Date): string {
  const today = startOfDay(new Date());
  const targetDate = startOfDay(date);
  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return format(date, 'EEEE'); // Day name

  return formatEventDate(date);
}

/**
 * Group events by date
 */
export function groupEventsByDate<T extends { startTime: Date }>(events: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  events.forEach(event => {
    const dateKey = format(startOfDay(event.startTime), 'yyyy-MM-dd');
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, event]);
  });

  return grouped;
}

/**
 * Sort events by start time
 */
export function sortEventsByTime<T extends { startTime: Date }>(events: T[]): T[] {
  return [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * Check if two events overlap
 */
export function eventsOverlap(
  event1: { startTime: Date; endTime: Date },
  event2: { startTime: Date; endTime: Date }
): boolean {
  return event1.startTime < event2.endTime && event2.startTime < event1.endTime;
}

/**
 * Find free time slots in a day
 */
export function findFreeSlots(
  date: Date,
  events: { startTime: Date; endTime: Date }[],
  minDurationMinutes: number = 30
): { start: Date; end: Date }[] {
  const dayStart = new Date(date);
  dayStart.setHours(9, 0, 0, 0); // 9 AM

  const dayEnd = new Date(date);
  dayEnd.setHours(17, 0, 0, 0); // 5 PM

  // Sort events by start time
  const sortedEvents = events
    .filter(e => isSameDay(e.startTime, date))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const freeSlots: { start: Date; end: Date }[] = [];
  let currentTime = dayStart;

  for (const event of sortedEvents) {
    if (event.startTime > currentTime) {
      const duration = calculateDuration(currentTime, event.startTime);
      if (duration >= minDurationMinutes) {
        freeSlots.push({ start: currentTime, end: event.startTime });
      }
    }
    currentTime = event.endTime > currentTime ? event.endTime : currentTime;
  }

  // Check for free time after last event
  if (currentTime < dayEnd) {
    const duration = calculateDuration(currentTime, dayEnd);
    if (duration >= minDurationMinutes) {
      freeSlots.push({ start: currentTime, end: dayEnd });
    }
  }

  return freeSlots;
}

/**
 * Get color for event type
 */
export function getEventColor(type: string): string {
  const colors: Record<string, string> = {
    call: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    meeting: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    task: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    reminder: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    personal: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    workout: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    meal: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400'
  };

  return colors[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
}

/**
 * Get icon for event type
 */
export function getEventIcon(type: string): string {
  const icons: Record<string, string> = {
    call: '📞',
    meeting: '👥',
    task: '✓',
    reminder: '🔔',
    personal: '🏠',
    workout: '💪',
    meal: '🍽️'
  };

  return icons[type] || '📅';
}

// Last Modified: 2025-11-24 00:00
import { Skeleton } from '@/components/ui/skeleton';

export function CalendarEventSkeleton() {
  return (
    <div className="border rounded-md p-2 space-y-1">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function CalendarMonthSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Weekday headers */}
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={`header-${i}`} className="h-8 w-full" />
      ))}

      {/* Calendar days */}
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="border rounded-md p-2 h-24 space-y-1">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

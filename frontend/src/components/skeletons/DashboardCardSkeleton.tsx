// Last Modified: 2025-11-24 00:00
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function DashboardCardSkeleton() {
  return (
    <Card className="p-6">
      {/* Header with icon */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Title */}
      <Skeleton className="h-3 w-24 mb-2" />

      {/* Value */}
      <Skeleton className="h-8 w-20 mb-2" />

      {/* Description */}
      <Skeleton className="h-3 w-32" />
    </Card>
  );
}

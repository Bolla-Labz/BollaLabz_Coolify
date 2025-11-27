// Last Modified: 2025-11-24 00:00
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function TaskCardSkeleton() {
  return (
    <Card className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Description */}
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />

      {/* Footer */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </Card>
  );
}

// Last Modified: 2025-11-24 00:00
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function ContactCardSkeleton() {
  return (
    <Card className="p-4 flex items-center gap-3">
      {/* Avatar */}
      <Skeleton className="h-12 w-12 rounded-full" />

      {/* Content */}
      <div className="flex-1 space-y-2">
        {/* Name */}
        <Skeleton className="h-4 w-32" />
        {/* Company */}
        <Skeleton className="h-3 w-24" />
        {/* Phone */}
        <Skeleton className="h-3 w-28" />
      </div>

      {/* Actions */}
      <Skeleton className="h-8 w-8 rounded-md" />
    </Card>
  );
}

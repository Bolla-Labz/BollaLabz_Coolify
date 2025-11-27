// Last Modified: 2025-11-24 00:00
import { Skeleton } from '@/components/ui/skeleton';

interface MessageSkeletonProps {
  isOutbound?: boolean;
}

export function MessageSkeleton({ isOutbound = false }: MessageSkeletonProps) {
  return (
    <div className={`flex gap-3 ${isOutbound ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {!isOutbound && <Skeleton className="h-8 w-8 rounded-full" />}

      {/* Message bubble */}
      <div className={`max-w-[70%] space-y-2 ${isOutbound ? 'items-end' : ''}`}>
        <Skeleton className="h-20 w-64 rounded-lg" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function ConversationListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex gap-3 p-3 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

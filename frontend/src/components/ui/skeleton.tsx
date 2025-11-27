// Last Modified: 2025-11-24 00:00
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Show a pulsing animation
   * @default true
   */
  pulse?: boolean;
}

export function Skeleton({
  className,
  pulse = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        pulse && "animate-pulse",
        className
      )}
      {...props}
    />
  );
}

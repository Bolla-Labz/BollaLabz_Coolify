import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

const skeletonVariants = cva(
  "animate-pulse bg-gray-200 dark:bg-gray-700",
  {
    variants: {
      variant: {
        default: "rounded-md",
        circular: "rounded-full",
        rectangular: "rounded-none",
        text: "rounded h-4 w-full",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number;
  height?: string | number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, width, height, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, className }))}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
          ...style,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

// Pre-built skeleton patterns for common use cases
export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  lastLineWidth?: string;
}

const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ className, lines = 3, lastLineWidth = "60%", ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            variant="text"
            style={{
              width: index === lines - 1 ? lastLineWidth : "100%",
            }}
          />
        ))}
      </div>
    );
  }
);

SkeletonText.displayName = "SkeletonText";

export interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hasImage?: boolean;
  hasTitle?: boolean;
  hasDescription?: boolean;
  hasAction?: boolean;
}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  (
    {
      className,
      hasImage = true,
      hasTitle = true,
      hasDescription = true,
      hasAction = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-gray-200 p-4 dark:border-gray-800",
          className
        )}
        {...props}
      >
        {hasImage && <Skeleton className="mb-4 h-40 w-full" />}
        {hasTitle && <Skeleton className="mb-2 h-6 w-3/4" />}
        {hasDescription && <SkeletonText lines={2} />}
        {hasAction && <Skeleton className="mt-4 h-10 w-24" />}
      </div>
    );
  }
);

SkeletonCard.displayName = "SkeletonCard";

export interface SkeletonAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
}

const SkeletonAvatar = React.forwardRef<HTMLDivElement, SkeletonAvatarProps>(
  ({ className, size = "md", withText = false, ...props }, ref) => {
    const sizeClasses = {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
    };

    return (
      <div ref={ref} className={cn("flex items-center gap-3", className)} {...props}>
        <Skeleton variant="circular" className={sizeClasses[size]} />
        {withText && (
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        )}
      </div>
    );
  }
);

SkeletonAvatar.displayName = "SkeletonAvatar";

export interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
}

const SkeletonTable = React.forwardRef<HTMLDivElement, SkeletonTableProps>(
  ({ className, rows = 5, columns = 4, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("w-full space-y-3", className)} {...props}>
        {/* Header */}
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={`header-${index}`} className="h-8 flex-1" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-10 flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }
);

SkeletonTable.displayName = "SkeletonTable";

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonTable,
  skeletonVariants,
};

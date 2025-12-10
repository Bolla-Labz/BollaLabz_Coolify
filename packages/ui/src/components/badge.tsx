import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#007DFF]/10 text-[#007DFF] dark:bg-[#007DFF]/20",
        secondary: "bg-[#00D4FF]/10 text-[#00D4FF] dark:bg-[#00D4FF]/20",
        accent: "bg-[#FF6B00]/10 text-[#FF6B00] dark:bg-[#FF6B00]/20",
        success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        outline: "border border-current bg-transparent",
        muted: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-sm",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  removable?: boolean;
  onRemove?: () => void;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, removable, onRemove, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), removable && "pr-1", className)}
        {...props}
      >
        {children}
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Remove"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };

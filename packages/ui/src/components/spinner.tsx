import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      variant: {
        default: "text-[#007DFF]",
        secondary: "text-[#00D4FF]",
        accent: "text-[#FF6B00]",
        white: "text-white",
        muted: "text-gray-400",
      },
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface SpinnerProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, variant, size, label = "Loading...", ...props }, ref) => {
    return (
      <svg
        ref={ref}
        className={cn(spinnerVariants({ variant, size, className }))}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="status"
        aria-label={label}
        {...props}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );
  }
);

Spinner.displayName = "Spinner";

export interface SpinnerOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  spinnerProps?: SpinnerProps;
  text?: string;
}

const SpinnerOverlay = React.forwardRef<HTMLDivElement, SpinnerOverlayProps>(
  ({ className, spinnerProps, text, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-[#0A0E27]/80",
          className
        )}
        {...props}
      >
        <Spinner size="lg" {...spinnerProps} />
        {text && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{text}</p>
        )}
      </div>
    );
  }
);

SpinnerOverlay.displayName = "SpinnerOverlay";

export { Spinner, SpinnerOverlay, spinnerVariants };

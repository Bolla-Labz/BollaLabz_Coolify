import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-[#007DFF] text-white hover:bg-[#007DFF]/90 focus:ring-[#007DFF]",
        secondary: "bg-[#00D4FF] text-white hover:bg-[#00D4FF]/90 focus:ring-[#00D4FF]",
        accent: "bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90 focus:ring-[#FF6B00]",
        outline: "border border-[#007DFF] text-[#007DFF] hover:bg-[#007DFF]/10 focus:ring-[#007DFF]",
        ghost: "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
        destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
        link: "text-[#007DFF] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };

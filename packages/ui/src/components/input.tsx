import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

const inputVariants = cva(
  "flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-gray-500",
  {
    variants: {
      variant: {
        default:
          "border-gray-300 focus:border-[#007DFF] focus:ring-[#007DFF] dark:border-gray-700 dark:focus:border-[#007DFF]",
        error:
          "border-red-500 focus:border-red-500 focus:ring-red-500 text-red-600 dark:border-red-500",
        success:
          "border-green-500 focus:border-green-500 focus:ring-green-500 dark:border-green-500",
      },
      inputSize: {
        sm: "h-8 text-xs",
        md: "h-10",
        lg: "h-12 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  error?: string;
  label?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, error, label, helperText, type, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            inputVariants({ variant: error ? "error" : variant, inputSize, className })
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };

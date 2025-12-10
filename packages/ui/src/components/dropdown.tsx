import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

const dropdownContentVariants = cva(
  "absolute z-50 min-w-[8rem] overflow-hidden rounded-lg border bg-white p-1 shadow-lg dark:bg-[#0A0E27] dark:border-gray-800",
  {
    variants: {
      align: {
        start: "left-0",
        center: "left-1/2 -translate-x-1/2",
        end: "right-0",
      },
      side: {
        top: "bottom-full mb-1",
        bottom: "top-full mt-1",
      },
    },
    defaultVariants: {
      align: "start",
      side: "bottom",
    },
  }
);

const dropdownItemVariants = cva(
  "relative flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors",
  {
    variants: {
      variant: {
        default: "text-gray-700 hover:bg-gray-100 focus:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:bg-gray-800",
        destructive: "text-red-600 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 dark:focus:bg-red-900/20",
      },
      disabled: {
        true: "opacity-50 pointer-events-none",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      disabled: false,
    },
  }
);

interface DropdownContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const DropdownContext = React.createContext<DropdownContextValue | undefined>(undefined);

function useDropdownContext() {
  const context = React.useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown components must be used within a Dropdown provider");
  }
  return context;
}

export interface DropdownProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Dropdown({ open: controlledOpen, onOpenChange, defaultOpen = false, children }: DropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange]
  );

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        handleOpenChange(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open, handleOpenChange]);

  // Close on escape
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleOpenChange(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleOpenChange]);

  return (
    <DropdownContext.Provider value={{ open, onOpenChange: handleOpenChange, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  );
}

export interface DropdownTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const DropdownTrigger = React.forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ onClick, children, ...props }, ref) => {
    const { open, onOpenChange, triggerRef } = useDropdownContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onClick?.(e);
      onOpenChange(!open);
    };

    // Combine refs
    const combinedRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref, triggerRef]
    );

    return (
      <button
        ref={combinedRef}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);

DropdownTrigger.displayName = "DropdownTrigger";

export interface DropdownContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dropdownContentVariants> {}

const DropdownContent = React.forwardRef<HTMLDivElement, DropdownContentProps>(
  ({ className, align, side, children, ...props }, ref) => {
    const { open } = useDropdownContext();

    if (!open) return null;

    return (
      <div
        ref={ref}
        role="menu"
        className={cn(dropdownContentVariants({ align, side, className }))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DropdownContent.displayName = "DropdownContent";

export interface DropdownItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dropdownItemVariants> {
  onSelect?: () => void;
}

const DropdownItem = React.forwardRef<HTMLDivElement, DropdownItemProps>(
  ({ className, variant, disabled, onSelect, onClick, children, ...props }, ref) => {
    const { onOpenChange } = useDropdownContext();

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      onClick?.(e);
      onSelect?.();
      onOpenChange(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect?.();
        onOpenChange(false);
      }
    };

    return (
      <div
        ref={ref}
        role="menuitem"
        tabIndex={disabled ? -1 : 0}
        className={cn(dropdownItemVariants({ variant, disabled: !!disabled, className }))}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DropdownItem.displayName = "DropdownItem";

const DropdownSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      className={cn("-mx-1 my-1 h-px bg-gray-200 dark:bg-gray-700", className)}
      {...props}
    />
  )
);

DropdownSeparator.displayName = "DropdownSeparator";

const DropdownLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400", className)}
      {...props}
    />
  )
);

DropdownLabel.displayName = "DropdownLabel";

export interface DropdownCheckboxItemProps extends DropdownItemProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const DropdownCheckboxItem = React.forwardRef<HTMLDivElement, DropdownCheckboxItemProps>(
  ({ className, checked, onCheckedChange, onSelect, children, ...props }, ref) => {
    const handleSelect = () => {
      onCheckedChange?.(!checked);
      onSelect?.();
    };

    return (
      <DropdownItem
        ref={ref}
        className={cn("pl-8", className)}
        onSelect={handleSelect}
        {...props}
      >
        <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
          {checked && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        {children}
      </DropdownItem>
    );
  }
);

DropdownCheckboxItem.displayName = "DropdownCheckboxItem";

export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
  DropdownCheckboxItem,
  dropdownContentVariants,
  dropdownItemVariants,
};

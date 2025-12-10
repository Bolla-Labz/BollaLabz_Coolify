import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

const dialogOverlayVariants = cva(
  "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity",
  {
    variants: {
      animation: {
        fade: "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        none: "",
      },
    },
    defaultVariants: {
      animation: "fade",
    },
  }
);

const dialogContentVariants = cva(
  "fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl dark:bg-[#0A0E27] dark:border dark:border-gray-800",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        full: "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]",
      },
      animation: {
        zoom: "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        none: "",
      },
    },
    defaultVariants: {
      size: "md",
      animation: "zoom",
    },
  }
);

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within a Dialog provider");
  }
  return context;
}

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Dialog({ open: controlledOpen, onOpenChange, defaultOpen = false, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

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

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ onClick, children, ...props }, ref) => {
    const { onOpenChange } = useDialogContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      onOpenChange(true);
    };

    return (
      <button ref={ref} onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);

DialogTrigger.displayName = "DialogTrigger";

export interface DialogOverlayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dialogOverlayVariants> {}

const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className, animation, onClick, ...props }, ref) => {
    const { open, onOpenChange } = useDialogContext();

    if (!open) return null;

    return (
      <div
        ref={ref}
        data-state={open ? "open" : "closed"}
        className={cn(dialogOverlayVariants({ animation, className }))}
        onClick={() => onOpenChange(false)}
        {...props}
      />
    );
  }
);

DialogOverlay.displayName = "DialogOverlay";

export interface DialogContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dialogContentVariants> {}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, size, animation, children, ...props }, ref) => {
    const { open, onOpenChange } = useDialogContext();

    // Handle escape key
    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && open) {
          onOpenChange(false);
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onOpenChange]);

    // Prevent body scroll when dialog is open
    React.useEffect(() => {
      if (open) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [open]);

    if (!open) return null;

    return (
      <>
        <DialogOverlay />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          data-state={open ? "open" : "closed"}
          className={cn(dialogContentVariants({ size, animation, className }))}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);

DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
  )
);

DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white", className)}
      {...props}
    />
  )
);

DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
      {...props}
    />
  )
);

DialogDescription.displayName = "DialogDescription";

const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
);

DialogFooter.displayName = "DialogFooter";

const DialogClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, onClick, ...props }, ref) => {
    const { onOpenChange } = useDialogContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      onOpenChange(false);
    };

    return (
      <button
        ref={ref}
        className={cn(
          "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-[#0A0E27]",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="sr-only">Close</span>
      </button>
    );
  }
);

DialogClose.displayName = "DialogClose";

export {
  Dialog,
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  dialogOverlayVariants,
  dialogContentVariants,
};

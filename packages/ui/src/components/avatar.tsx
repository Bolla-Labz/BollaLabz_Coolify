import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

const avatarVariants = cva(
  "relative inline-flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-xs",
        sm: "h-8 w-8 text-sm",
        md: "h-10 w-10 text-base",
        lg: "h-12 w-12 text-lg",
        xl: "h-16 w-16 text-xl",
        "2xl": "h-20 w-20 text-2xl",
      },
      status: {
        none: "",
        online: "",
        offline: "",
        busy: "",
        away: "",
      },
    },
    defaultVariants: {
      size: "md",
      status: "none",
    },
  }
);

const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  busy: "bg-red-500",
  away: "bg-yellow-500",
};

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, status, src, alt, fallback, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    const initials = React.useMemo(() => {
      if (fallback) return fallback;
      if (!alt) return "?";
      return alt
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }, [alt, fallback]);

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, status, className }))}
        {...props}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={alt}
            className="aspect-square h-full w-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#007DFF] to-[#00D4FF] font-medium text-white">
            {initials}
          </div>
        )}
        {status && status !== "none" && (
          <span
            className={cn(
              "absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-[#0A0E27]",
              statusColors[status],
              size === "xs" && "h-1.5 w-1.5",
              size === "sm" && "h-2 w-2",
              size === "md" && "h-2.5 w-2.5",
              size === "lg" && "h-3 w-3",
              size === "xl" && "h-3.5 w-3.5",
              size === "2xl" && "h-4 w-4"
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: VariantProps<typeof avatarVariants>["size"];
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, max = 5, size = "md", children, ...props }, ref) => {
    const childArray = React.Children.toArray(children);
    const visibleAvatars = childArray.slice(0, max);
    const remainingCount = childArray.length - max;

    return (
      <div
        ref={ref}
        className={cn("flex -space-x-2", className)}
        {...props}
      >
        {visibleAvatars.map((child, index) => (
          <div key={index} className="ring-2 ring-white dark:ring-[#0A0E27] rounded-full">
            {React.isValidElement(child)
              ? React.cloneElement(child, { size } as React.Attributes)
              : child}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className={cn(
              avatarVariants({ size }),
              "flex items-center justify-center bg-gray-200 font-medium text-gray-600 ring-2 ring-white dark:bg-gray-700 dark:text-gray-300 dark:ring-[#0A0E27]"
            )}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = "AvatarGroup";

export { Avatar, AvatarGroup, avatarVariants };

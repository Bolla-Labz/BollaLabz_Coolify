// Last Modified: 2025-11-23 17:30
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RippleProps {
  x: number;
  y: number;
  size: number;
}

interface InteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Visual variants
  variant?: 'primary' | 'secondary' | 'ghost' | 'gradient' | 'glow' | 'glass';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  // States
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  active?: boolean;

  // Effects
  ripple?: boolean;
  haptic?: boolean;
  sound?: boolean;

  // Animations
  animation?: {
    hover?: 'pulse' | 'bounce' | 'glow' | 'morph' | 'shake';
    click?: 'ripple' | 'splash' | 'expand' | 'shrink';
    success?: 'check' | 'confetti' | 'flash';
    error?: 'shake' | 'pulse-red' | 'x-mark';
  };

  // Content
  children?: React.ReactNode;
  icon?: React.ElementType;
  iconPosition?: 'left' | 'right';
  badge?: string | number;

  // Behavior
  onClick?: () => void | Promise<void>;
  onDoubleClick?: () => void;
  onLongPress?: () => void;
  confirmDialog?: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  };

  // Accessibility
  ariaLabel?: string;
  shortcut?: string;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

// Animation variants
const hoverVariants: Record<string, any> = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: { repeat: Infinity, duration: 1.5 }
  },
  bounce: {
    y: [0, -5, 0],
    transition: { repeat: Infinity, duration: 1, ease: 'easeInOut' }
  },
  glow: {
    boxShadow: [
      '0 0 0 rgba(var(--primary-rgb), 0)',
      '0 0 20px rgba(var(--primary-rgb), 0.5)',
      '0 0 0 rgba(var(--primary-rgb), 0)'
    ],
    transition: { repeat: Infinity, duration: 2 }
  },
  morph: {
    borderRadius: ['8px', '20px', '8px'],
    transition: { repeat: Infinity, duration: 3 }
  },
  shake: {
    x: [0, -2, 2, -2, 2, 0],
    transition: { duration: 0.5 }
  }
};

const clickVariants: Record<string, any> = {
  expand: {
    scale: [1, 1.1, 1],
    transition: { duration: 0.3 }
  },
  shrink: {
    scale: [1, 0.95, 1],
    transition: { duration: 0.2 }
  },
  ripple: {
    scale: [1, 1.02, 1],
    transition: { duration: 0.4 }
  },
  splash: {
    scale: [1, 1.05, 0.98, 1],
    transition: { duration: 0.5 }
  }
};

export const InteractiveButton = React.forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    success = false,
    error = false,
    active = false,
    ripple = true,
    haptic = false,
    sound = false,
    animation = {
      hover: 'pulse',
      click: 'ripple',
      success: 'check',
      error: 'shake'
    },
    children,
    icon: Icon,
    iconPosition = 'left',
    badge,
    onClick,
    onDoubleClick,
    onLongPress,
    confirmDialog,
    ariaLabel,
    shortcut,
    tooltip,
    tooltipPosition = 'top',
    className,
    disabled,
    ...rest
  }, ref) => {
    // Extract and exclude native drag and animation events that conflict with Framer Motion
    const {
      onDrag,
      onDragEnd,
      onDragStart,
      onDragEnter,
      onDragExit,
      onDragLeave,
      onDragOver,
      onDrop,
      onAnimationStart,
      onAnimationEnd,
      onAnimationIteration,
      ...restWithoutConflicts
    } = rest;
    const [ripples, setRipples] = useState<RippleProps[]>([]);
    const [isPressed, setIsPressed] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const longPressTimer = useRef<NodeJS.Timeout>();

    // Merge refs
    React.useImperativeHandle(ref, () => buttonRef.current!);

    // Size classes
    const sizeClasses = {
      xs: 'h-6 px-2 text-xs',
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-6 text-lg',
      xl: 'h-14 px-8 text-xl'
    };

    // Variant classes
    const variantClasses = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600',
      glow: 'bg-primary text-primary-foreground shadow-glow hover:shadow-glow-lg',
      glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20'
    };

    // Handle ripple effect
    const handleRipple = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (!ripple || disabled) return;

      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      const newRipple = { x, y, size };
      setRipples(prev => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.slice(1));
      }, 600);
    }, [ripple, disabled]);

    // Handle click with confirmation
    const handleClick = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (disabled || loading) return;

      // Add ripple effect
      handleRipple(event);

      // Haptic feedback (if supported)
      if (haptic && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }

      // Sound feedback
      if (sound) {
        // Play click sound (would need audio file)
        const audio = new Audio('/sounds/click.mp3');
        audio.play().catch(() => {});
      }

      // Handle confirmation dialog
      if (confirmDialog && !showConfirm) {
        setShowConfirm(true);
        return;
      }

      // Execute onClick
      if (onClick) {
        setIsPressed(true);
        try {
          await onClick();
        } finally {
          setIsPressed(false);
        }
      }
    }, [disabled, loading, handleRipple, haptic, sound, confirmDialog, showConfirm, onClick]);

    // Handle long press
    const handleMouseDown = useCallback(() => {
      if (!onLongPress || disabled || loading) return;

      longPressTimer.current = setTimeout(() => {
        if (onLongPress) {
          onLongPress();
          // Haptic feedback for long press
          if (haptic && 'vibrate' in navigator) {
            navigator.vibrate(50);
          }
        }
      }, 800);
    }, [onLongPress, disabled, loading, haptic]);

    const handleMouseUp = useCallback(() => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
      if (!shortcut || disabled) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        const keys = shortcut.toLowerCase().split('+');
        const hasCtrl = keys.includes('ctrl') || keys.includes('cmd');
        const hasShift = keys.includes('shift');
        const hasAlt = keys.includes('alt');
        const key = keys[keys.length - 1];

        if (
          (hasCtrl === (event.ctrlKey || event.metaKey)) &&
          (hasShift === event.shiftKey) &&
          (hasAlt === event.altKey) &&
          event.key.toLowerCase() === key
        ) {
          event.preventDefault();
          buttonRef.current?.click();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [shortcut, disabled]);

    // Determine current animation
    const currentAnimation = error && animation.error
      ? hoverVariants[animation.error === 'shake' ? 'shake' : 'pulse']
      : success && animation.success
      ? clickVariants.expand
      : isPressed && animation.click
      ? clickVariants[animation.click]
      : undefined;

    return (
      <>
        <motion.button
          ref={buttonRef}
          className={cn(
            'relative inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden',
            sizeClasses[size],
            variantClasses[variant],
            {
              'cursor-wait': loading,
              'ring-2 ring-primary': active,
              'animate-pulse': loading && !animation.hover
            },
            className
          )}
          disabled={disabled || loading}
          aria-label={ariaLabel}
          aria-pressed={active}
          aria-busy={loading}
          onClick={handleClick}
          onDoubleClick={onDoubleClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseEnter={() => tooltip && setShowTooltip(true)}
          onMouseLeave={() => {
            handleMouseUp();
            tooltip && setShowTooltip(false);
          }}
          animate={currentAnimation}
          whileHover={!disabled && !loading && animation.hover ? hoverVariants[animation.hover] : undefined}
          whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
          {...restWithoutConflicts}
        >
          {/* Ripple effects */}
          <AnimatePresence>
            {ripples.map((ripple, index) => (
              <motion.span
                key={index}
                className="absolute bg-white/30 rounded-full pointer-events-none"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  width: ripple.size,
                  height: ripple.size
                }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            ))}
          </AnimatePresence>

          {/* Button content */}
          <span className="relative z-10 flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : success ? (
              <Check className="h-4 w-4" />
            ) : error ? (
              <X className="h-4 w-4" />
            ) : Icon && iconPosition === 'left' ? (
              <Icon className="h-4 w-4" />
            ) : null}

            {children}

            {!loading && !success && !error && Icon && iconPosition === 'right' && (
              <Icon className="h-4 w-4" />
            )}

            {badge && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {badge}
              </span>
            )}
          </span>

          {/* Shortcut hint */}
          {shortcut && !disabled && (
            <span className="absolute bottom-0 right-0 text-xs opacity-50 p-1">
              {shortcut}
            </span>
          )}
        </motion.button>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && tooltip && (
            <motion.div
              className={cn(
                'absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg pointer-events-none',
                {
                  'bottom-full mb-2': tooltipPosition === 'top',
                  'top-full mt-2': tooltipPosition === 'bottom',
                  'right-full mr-2': tooltipPosition === 'left',
                  'left-full ml-2': tooltipPosition === 'right'
                }
              )}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {tooltip}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation dialog (simplified) */}
        {showConfirm && confirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold mb-2">{confirmDialog.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{confirmDialog.message}</p>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => setShowConfirm(false)}
                >
                  {confirmDialog.cancelText || 'Cancel'}
                </button>
                <button
                  className={cn(
                    "px-4 py-2 text-sm text-white rounded",
                    confirmDialog.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
                  )}
                  onClick={() => {
                    setShowConfirm(false);
                    onClick?.();
                  }}
                >
                  {confirmDialog.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </>
    );
  }
);

InteractiveButton.displayName = 'InteractiveButton';
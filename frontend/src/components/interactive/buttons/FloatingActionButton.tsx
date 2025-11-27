// Last Modified: 2025-11-23 17:30
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Action {
  id: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

interface FloatingActionButtonProps {
  actions: Action[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  trigger?: 'click' | 'hover';
  animation?: 'fan' | 'grid' | 'spiral' | 'linear';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  backdrop?: boolean;
  closeOnAction?: boolean;
  className?: string;
}

// Animation configurations for different layouts
const animationVariants: Record<string, (index: number, total: number) => Variants> = {
  fan: (index, total) => ({
    hidden: { scale: 0, opacity: 0, rotate: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: (index * 90) / (total - 1) - 45,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: index * 0.05
      }
    },
    exit: {
      scale: 0,
      opacity: 0,
      transition: { duration: 0.2, delay: (total - index) * 0.02 }
    }
  }),
  grid: (index, total) => {
    const cols = Math.ceil(Math.sqrt(total));
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      hidden: { scale: 0, opacity: 0, x: 0, y: 0 },
      visible: {
        scale: 1,
        opacity: 1,
        x: col * 60 - (cols - 1) * 30,
        y: -(row + 1) * 60,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 20,
          delay: index * 0.03
        }
      },
      exit: {
        scale: 0,
        opacity: 0,
        x: 0,
        y: 0,
        transition: { duration: 0.2 }
      }
    };
  },
  spiral: (index, total) => {
    const angle = (index * 360) / total;
    const radius = 80 + index * 20;
    return {
      hidden: { scale: 0, opacity: 0, x: 0, y: 0 },
      visible: {
        scale: 1,
        opacity: 1,
        x: Math.cos((angle * Math.PI) / 180) * radius,
        y: -Math.sin((angle * Math.PI) / 180) * radius,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 20,
          delay: index * 0.04
        }
      },
      exit: {
        scale: 0,
        opacity: 0,
        x: 0,
        y: 0,
        transition: { duration: 0.2 }
      }
    };
  },
  linear: (index, total) => ({
    hidden: { scale: 0, opacity: 0, y: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      y: -(index + 1) * 60,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: index * 0.03
      }
    },
    exit: {
      scale: 0,
      opacity: 0,
      y: 0,
      transition: { duration: 0.2, delay: (total - index) * 0.02 }
    }
  })
};

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  actions,
  position = 'bottom-right',
  trigger = 'click',
  animation = 'fan',
  size = 'md',
  showLabels = true,
  backdrop = true,
  closeOnAction = true,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerTimerRef = useRef<NodeJS.Timeout>();

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-16 w-16'
  };

  const actionSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  // Handle trigger interactions
  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      clearTimeout(triggerTimerRef.current);
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      triggerTimerRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 300);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsOpen(!isOpen);
    }
  };

  const handleActionClick = (action: Action) => {
    if (action.disabled) return;

    action.onClick();

    if (closeOnAction) {
      setIsOpen(false);
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        isOpen &&
        trigger === 'click'
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, trigger]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {backdrop && isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/20 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div
        ref={containerRef}
        className={cn('fixed z-50', positionClasses[position], className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Action buttons */}
        <AnimatePresence>
          {isOpen && (
            <div className="absolute bottom-0 right-0">
              {actions.map((action, index) => {
                const ActionIcon = action.icon;
                const variants = animationVariants[animation]?.(index, actions.length);

                return (
                  <motion.div
                    key={action.id}
                    className="absolute bottom-0 right-0 flex items-center"
                    variants={variants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ zIndex: -index }}
                  >
                    {/* Label */}
                    {showLabels && (
                      <AnimatePresence>
                        {(hoveredAction === action.id || trigger === 'click') && (
                          <motion.span
                            className="absolute right-full mr-3 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded whitespace-nowrap"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                          >
                            {action.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    )}

                    {/* Action button */}
                    <motion.button
                      className={cn(
                        'rounded-full shadow-lg flex items-center justify-center transition-all',
                        actionSizeClasses[size],
                        action.disabled
                          ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50'
                          : action.color || 'bg-white dark:bg-gray-800 hover:shadow-xl'
                      )}
                      style={!action.disabled && action.color ? { backgroundColor: action.color } : {}}
                      onClick={() => handleActionClick(action)}
                      onMouseEnter={() => setHoveredAction(action.id)}
                      onMouseLeave={() => setHoveredAction(null)}
                      disabled={action.disabled}
                      whileHover={action.disabled ? {} : { scale: 1.1 }}
                      whileTap={action.disabled ? {} : { scale: 0.95 }}
                      aria-label={action.label}
                    >
                      <ActionIcon className={cn(
                        'h-5 w-5',
                        action.color ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                      )} />
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          className={cn(
            'rounded-full shadow-lg bg-primary text-primary-foreground flex items-center justify-center transition-all hover:shadow-xl relative',
            sizeClasses[size]
          )}
          onClick={handleClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          aria-label="Open actions menu"
          aria-expanded={isOpen}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -45, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Plus className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
};

FloatingActionButton.displayName = 'FloatingActionButton';
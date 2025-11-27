// Last Modified: 2025-11-23 17:30
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  users?: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  variant?: 'dots' | 'pulse' | 'wave' | 'text';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  showAvatars?: boolean;
  showText?: boolean;
  className?: string;
}

// Animation variants for different typing indicators
const dotVariants: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-3, 0, -3],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

const pulseVariants: Variants = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

const waveVariants: Variants = {
  initial: { scaleY: 1 },
  animate: {
    scaleY: [1, 1.5, 1],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  users = [],
  variant = 'dots',
  size = 'md',
  color,
  showAvatars = true,
  showText = true,
  className
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Size classes
  const sizeClasses = {
    sm: {
      dot: 'w-1.5 h-1.5',
      pulse: 'w-2 h-2',
      wave: 'w-1 h-3',
      text: 'text-xs',
      avatar: 'w-5 h-5',
      container: 'p-2'
    },
    md: {
      dot: 'w-2 h-2',
      pulse: 'w-3 h-3',
      wave: 'w-1.5 h-4',
      text: 'text-sm',
      avatar: 'w-6 h-6',
      container: 'p-2.5'
    },
    lg: {
      dot: 'w-2.5 h-2.5',
      pulse: 'w-4 h-4',
      wave: 'w-2 h-5',
      text: 'text-base',
      avatar: 'w-8 h-8',
      container: 'p-3'
    }
  };

  const currentSize = sizeClasses[size];

  // Periodically hide/show for more realistic effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(prev => {
        // 90% of the time visible, 10% hidden
        return Math.random() > 0.1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Get typing text
  const getTypingText = () => {
    if (!users || users.length === 0) return 'Someone is typing';
    if (users.length === 1) return `${users[0].name} is typing`;
    if (users.length === 2) return `${users[0].name} and ${users[1].name} are typing`;
    return `${users[0].name} and ${users.length - 1} others are typing`;
  };

  // Render dots variant
  const renderDots = () => (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={cn(
            'rounded-full',
            currentSize.dot,
            color || 'bg-gray-400 dark:bg-gray-600'
          )}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{
            delay: index * 0.2
          }}
        />
      ))}
    </div>
  );

  // Render pulse variant
  const renderPulse = () => (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={cn(
            'rounded-full',
            currentSize.pulse,
            color || 'bg-primary'
          )}
          variants={pulseVariants}
          initial="initial"
          animate="animate"
          transition={{
            delay: index * 0.15
          }}
        />
      ))}
    </div>
  );

  // Render wave variant
  const renderWave = () => (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((index) => (
        <motion.div
          key={index}
          className={cn(
            'rounded-full',
            currentSize.wave,
            color || 'bg-blue-500'
          )}
          variants={waveVariants}
          initial="initial"
          animate="animate"
          transition={{
            delay: index * 0.1
          }}
        />
      ))}
    </div>
  );

  // Render text variant
  const renderText = () => {
    const text = getTypingText();
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
      let index = 0;
      const interval = setInterval(() => {
        if (index <= text.length) {
          setDisplayText(text.slice(0, index));
          index++;
        } else {
          clearInterval(interval);
          // Restart after a pause
          setTimeout(() => {
            setDisplayText('');
            index = 0;
          }, 1000);
        }
      }, 50);

      return () => clearInterval(interval);
    }, [text]);

    return (
      <div className={cn(currentSize.text, 'text-gray-600 dark:text-gray-400')}>
        {displayText}
        <motion.span
          className="inline-block ml-0.5"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          |
        </motion.span>
      </div>
    );
  };

  // Render indicator based on variant
  const renderIndicator = () => {
    switch (variant) {
      case 'pulse':
        return renderPulse();
      case 'wave':
        return renderWave();
      case 'text':
        return renderText();
      case 'dots':
      default:
        return renderDots();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full',
            currentSize.container,
            className
          )}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          {/* User avatars */}
          {showAvatars && users.length > 0 && (
            <div className="flex -space-x-2">
              {users.slice(0, 3).map((user, index) => (
                <motion.div
                  key={user.id}
                  className={cn(
                    'rounded-full border-2 border-white dark:border-gray-800 overflow-hidden',
                    currentSize.avatar
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                      {user.name[0]}
                    </div>
                  )}
                </motion.div>
              ))}
              {users.length > 3 && (
                <div
                  className={cn(
                    'rounded-full border-2 border-white dark:border-gray-800 bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-bold',
                    currentSize.avatar
                  )}
                >
                  +{users.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Indicator */}
          {renderIndicator()}

          {/* Text label */}
          {showText && variant !== 'text' && users.length > 0 && (
            <span className={cn(
              'text-gray-600 dark:text-gray-400 ml-1',
              currentSize.text
            )}>
              typing
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Compound component for integration with chat interfaces
export const TypingIndicatorContainer: React.FC<{
  children: React.ReactNode;
  isTyping?: boolean;
  typingUsers?: Array<{ id: string; name: string; avatar?: string }>;
  position?: 'inline' | 'overlay' | 'bubble';
}> = ({
  children,
  isTyping = false,
  typingUsers = [],
  position = 'inline'
}) => {
  if (position === 'overlay') {
    return (
      <div className="relative">
        {children}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              className="absolute bottom-2 left-2 z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <TypingIndicator users={typingUsers} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (position === 'bubble') {
    return (
      <>
        {children}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              className="flex items-start gap-2 px-4 py-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
              <TypingIndicator users={typingUsers} variant="dots" />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Inline (default)
  return (
    <>
      {children}
      {isTyping && <TypingIndicator users={typingUsers} />}
    </>
  );
};

TypingIndicator.displayName = 'TypingIndicator';
TypingIndicatorContainer.displayName = 'TypingIndicatorContainer';
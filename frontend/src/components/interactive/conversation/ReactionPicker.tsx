// Last Modified: 2025-11-23 17:30
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Smile, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reaction {
  emoji: string;
  count: number;
  users: Array<{ id: string; name: string }>;
  hasReacted: boolean;
}

interface ReactionPickerProps {
  reactions?: Reaction[];
  onReact?: (emoji: string) => void;
  onRemoveReaction?: (emoji: string) => void;
  quickReactions?: string[];
  showPicker?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  variant?: 'inline' | 'floating' | 'bubble';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Animation variants
const reactionVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25
    }
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.2 }
  },
  hover: {
    scale: 1.2,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.9,
    transition: { duration: 0.1 }
  }
};

const pickerVariants: Variants = {
  initial: { scale: 0.9, opacity: 0, y: 10 },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    y: 10,
    transition: { duration: 0.2 }
  }
};

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  reactions = [],
  onReact,
  onRemoveReaction,
  quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🔥'],
  showPicker: initialShowPicker = false,
  position = 'top',
  align = 'start',
  variant = 'inline',
  size = 'md',
  className
}) => {
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [showQuickPicker, setShowQuickPicker] = useState(initialShowPicker);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Size classes
  const sizeClasses = {
    sm: {
      reaction: 'text-sm p-1',
      button: 'p-1',
      icon: 'h-3 w-3'
    },
    md: {
      reaction: 'text-base p-1.5',
      button: 'p-1.5',
      icon: 'h-4 w-4'
    },
    lg: {
      reaction: 'text-lg p-2',
      button: 'p-2',
      icon: 'h-5 w-5'
    }
  };

  const currentSize = sizeClasses[size];

  // Position classes for picker
  const getPickerPosition = () => {
    const positions = {
      top: 'bottom-full mb-2',
      bottom: 'top-full mt-2',
      left: 'right-full mr-2',
      right: 'left-full ml-2'
    };

    const alignments = {
      start: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
      end: 'right-0'
    };

    return cn(positions[position], alignments[align]);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowFullPicker(false);
        setShowQuickPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle reaction click
  const handleReactionClick = (emoji: string) => {
    const existingReaction = reactions.find(r => r.emoji === emoji);

    if (existingReaction?.hasReacted) {
      onRemoveReaction?.(emoji);
    } else {
      onReact?.(emoji);
    }

    // Add animation effect
    const element = document.getElementById(`reaction-${emoji}`);
    if (element) {
      element.classList.add('reaction-bounce');
      setTimeout(() => {
        element.classList.remove('reaction-bounce');
      }, 500);
    }
  };

  // Handle emoji select from picker
  const handleEmojiSelect = (emoji: any) => {
    onReact?.(emoji.native);
    setShowFullPicker(false);
    setShowQuickPicker(false);
  };

  // Render existing reactions
  const renderReactions = () => (
    <div className="flex flex-wrap items-center gap-1">
      {reactions.map((reaction, index) => (
        <motion.button
          key={`${reaction.emoji}-${index}`}
          id={`reaction-${reaction.emoji}`}
          className={cn(
            'inline-flex items-center gap-1 rounded-full transition-all',
            reaction.hasReacted
              ? 'bg-primary/20 border border-primary'
              : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            'hover:scale-110',
            currentSize.reaction
          )}
          variants={reactionVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          onClick={() => handleReactionClick(reaction.emoji)}
          onMouseEnter={() => setHoveredReaction(reaction.emoji)}
          onMouseLeave={() => setHoveredReaction(null)}
        >
          <span className="emoji">{reaction.emoji}</span>
          {reaction.count > 1 && (
            <span className={cn(
              'font-medium',
              reaction.hasReacted ? 'text-primary' : 'text-gray-600 dark:text-gray-400',
              size === 'sm' ? 'text-xs' : 'text-sm'
            )}>
              {reaction.count}
            </span>
          )}
        </motion.button>
      ))}

      {/* Add reaction button */}
      <motion.button
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
          'border border-gray-200 dark:border-gray-700',
          currentSize.button
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowQuickPicker(!showQuickPicker)}
      >
        {showQuickPicker ? (
          <Plus className={cn(currentSize.icon, 'rotate-45')} />
        ) : (
          <Smile className={currentSize.icon} />
        )}
      </motion.button>

      {/* Reaction tooltip */}
      <AnimatePresence>
        {hoveredReaction && (
          <motion.div
            className="absolute z-50 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded shadow-lg pointer-events-none"
            style={{ bottom: '100%', marginBottom: '8px' }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            {(() => {
              const reaction = reactions.find(r => r.emoji === hoveredReaction);
              if (!reaction) return null;

              const names = reaction.users.map(u => u.name);
              if (names.length === 1) return names[0];
              if (names.length === 2) return `${names[0]} and ${names[1]}`;
              if (names.length === 3) return `${names[0]}, ${names[1]}, and ${names[2]}`;
              return `${names[0]}, ${names[1]}, and ${names.length - 2} others`;
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Render quick reaction picker
  const renderQuickPicker = () => (
    <motion.div
      ref={pickerRef}
      className={cn(
        'absolute z-40 flex items-center gap-1 p-2',
        'bg-white dark:bg-gray-900 rounded-lg shadow-lg',
        'border border-gray-200 dark:border-gray-700',
        getPickerPosition()
      )}
      variants={pickerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {quickReactions.map((emoji, index) => (
        <motion.button
          key={emoji}
          className={cn(
            'p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
            currentSize.reaction
          )}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            transition: { delay: index * 0.05 }
          }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            onReact?.(emoji);
            setShowQuickPicker(false);
          }}
        >
          {emoji}
        </motion.button>
      ))}

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

      <motion.button
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setShowFullPicker(true);
          setShowQuickPicker(false);
        }}
      >
        <Plus className={currentSize.icon} />
      </motion.button>
    </motion.div>
  );

  // Render full emoji picker
  const renderFullPicker = () => (
    <motion.div
      ref={pickerRef}
      className={cn(
        'absolute z-50',
        getPickerPosition()
      )}
      variants={pickerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Picker
        data={data}
        onEmojiSelect={handleEmojiSelect}
        theme="auto"
        previewPosition="none"
        skinTonePosition="none"
      />
    </motion.div>
  );

  if (variant === 'floating') {
    return (
      <div className={cn('fixed bottom-4 right-4 z-50', className)}>
        <AnimatePresence>
          {showQuickPicker && renderQuickPicker()}
          {showFullPicker && renderFullPicker()}
        </AnimatePresence>

        <motion.button
          className={cn(
            'p-3 rounded-full bg-primary text-primary-foreground shadow-lg',
            'hover:shadow-xl transition-shadow'
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowQuickPicker(!showQuickPicker)}
        >
          <Smile className="h-5 w-5" />
        </motion.button>
      </div>
    );
  }

  if (variant === 'bubble') {
    return (
      <motion.div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2',
          'bg-gray-100 dark:bg-gray-800 rounded-full',
          className
        )}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {renderReactions()}
      </motion.div>
    );
  }

  // Inline variant (default)
  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center', className)}>
      {renderReactions()}

      <AnimatePresence>
        {showQuickPicker && renderQuickPicker()}
        {showFullPicker && renderFullPicker()}
      </AnimatePresence>
    </div>
  );
};

// CSS for bounce animation
const style = document.createElement('style');
style.textContent = `
  @keyframes reaction-bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.3); }
  }

  .reaction-bounce {
    animation: reaction-bounce 0.5s ease-in-out;
  }
`;
document.head.appendChild(style);

ReactionPicker.displayName = 'ReactionPicker';
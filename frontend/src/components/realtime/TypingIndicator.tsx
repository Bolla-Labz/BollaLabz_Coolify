// Last Modified: 2025-11-24 00:15
/**
 * TypingIndicator Component
 * Animated typing indicator that shows when users are typing
 * Auto-hides after timeout or when typing stops
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface TypingUser {
  userId: string;
  userEmail: string;
  name?: string;
  avatar?: string;
}

interface TypingIndicatorProps {
  /** Users currently typing */
  typingUsers: TypingUser[];
  /** Show avatar for the typing user */
  showAvatar?: boolean;
  /** Custom className */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    avatar: 'h-5 w-5',
    bubble: 'px-3 py-1.5',
    dot: 'w-1.5 h-1.5',
    text: 'text-xs',
  },
  md: {
    avatar: 'h-6 w-6',
    bubble: 'px-4 py-2',
    dot: 'w-2 h-2',
    text: 'text-sm',
  },
  lg: {
    avatar: 'h-8 w-8',
    bubble: 'px-5 py-2.5',
    dot: 'w-2.5 h-2.5',
    text: 'text-base',
  },
};

export function TypingIndicator({
  typingUsers,
  showAvatar = true,
  size = 'md',
  className,
}: TypingIndicatorProps) {
  if (typingUsers.length === 0) {
    return null;
  }

  const firstUser = typingUsers[0];
  const sizeConfig = sizeClasses[size];

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      const name = firstUser.name || firstUser.userEmail.split('@')[0];
      return `${name} is typing`;
    } else if (typingUsers.length === 2) {
      const name1 = typingUsers[0].name || typingUsers[0].userEmail.split('@')[0];
      const name2 = typingUsers[1].name || typingUsers[1].userEmail.split('@')[0];
      return `${name1} and ${name2} are typing`;
    } else {
      const name = firstUser.name || firstUser.userEmail.split('@')[0];
      return `${name} and ${typingUsers.length - 1} others are typing`;
    }
  };

  const getInitials = (user: TypingUser): string => {
    if (user.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.userEmail.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300',
        className
      )}
    >
      {showAvatar && (
        <Avatar className={cn(sizeConfig.avatar, 'shrink-0')}>
          <AvatarImage src={firstUser.avatar} alt={firstUser.name || firstUser.userEmail} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-[10px]">
            {getInitials(firstUser)}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          'bg-muted rounded-2xl flex items-center gap-2',
          sizeConfig.bubble
        )}
      >
        {/* Animated typing dots */}
        <div className="flex items-center gap-1">
          <div
            className={cn(
              sizeConfig.dot,
              'bg-muted-foreground/60 rounded-full animate-bounce'
            )}
            style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
          />
          <div
            className={cn(
              sizeConfig.dot,
              'bg-muted-foreground/60 rounded-full animate-bounce'
            )}
            style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
          />
          <div
            className={cn(
              sizeConfig.dot,
              'bg-muted-foreground/60 rounded-full animate-bounce'
            )}
            style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
          />
        </div>

        {/* Typing text (optional) */}
        <span className={cn(sizeConfig.text, 'text-muted-foreground italic')}>
          {getTypingText()}...
        </span>
      </div>
    </div>
  );
}

export default TypingIndicator;

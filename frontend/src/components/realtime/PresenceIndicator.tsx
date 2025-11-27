// Last Modified: 2025-11-24 00:15
/**
 * PresenceIndicator Component
 * Shows online users in a room with real-time WebSocket updates
 * Displays as avatars with tooltips showing user names
 */

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OnlineUser {
  userId: string;
  userEmail: string;
  name?: string;
  avatar?: string;
}

interface PresenceIndicatorProps {
  /** Array of online users */
  onlineUsers: OnlineUser[];
  /** Maximum number of avatars to show before grouping */
  maxAvatars?: number;
  /** Size variant for avatars */
  size?: 'sm' | 'md' | 'lg';
  /** Show online count badge */
  showCount?: boolean;
  /** Custom className */
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

export function PresenceIndicator({
  onlineUsers,
  maxAvatars = 5,
  size = 'md',
  showCount = true,
  className,
}: PresenceIndicatorProps) {
  const [visibleUsers, setVisibleUsers] = useState<OnlineUser[]>([]);
  const [hiddenCount, setHiddenCount] = useState(0);

  useEffect(() => {
    if (onlineUsers.length <= maxAvatars) {
      setVisibleUsers(onlineUsers);
      setHiddenCount(0);
    } else {
      setVisibleUsers(onlineUsers.slice(0, maxAvatars - 1));
      setHiddenCount(onlineUsers.length - (maxAvatars - 1));
    }
  }, [onlineUsers, maxAvatars]);

  const getInitials = (user: OnlineUser): string => {
    if (user.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    // Use email initials if no name
    return user.userEmail.slice(0, 2).toUpperCase();
  };

  if (onlineUsers.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <TooltipProvider>
        {/* Online users avatars */}
        <div className="flex items-center -space-x-2">
          {visibleUsers.map((user, index) => (
            <Tooltip key={user.userId}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar
                    className={cn(
                      sizeClasses[size],
                      'border-2 border-background ring-2 ring-green-500 transition-all hover:z-10 hover:scale-110'
                    )}
                  >
                    <AvatarImage src={user.avatar} alt={user.name || user.userEmail} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator dot */}
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">{user.name || user.userEmail}</p>
                <p className="text-xs text-muted-foreground">Online now</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Hidden users count */}
          {hiddenCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    sizeClasses[size],
                    'flex items-center justify-center rounded-full bg-muted border-2 border-background cursor-pointer hover:bg-muted/80 transition-all hover:z-10 hover:scale-110'
                  )}
                >
                  <span className="text-xs font-medium">+{hiddenCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">{hiddenCount} more online</p>
                <div className="mt-1 max-h-32 overflow-y-auto">
                  {onlineUsers.slice(maxAvatars - 1).map(user => (
                    <p key={user.userId} className="text-xs text-muted-foreground">
                      {user.name || user.userEmail}
                    </p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Total count badge */}
        {showCount && (
          <Badge variant="secondary" className="ml-2 gap-1">
            <Users className="h-3 w-3" />
            <span className="text-xs">{onlineUsers.length}</span>
          </Badge>
        )}
      </TooltipProvider>
    </div>
  );
}

export default PresenceIndicator;

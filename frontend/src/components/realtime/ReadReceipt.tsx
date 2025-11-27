// Last Modified: 2025-11-24 00:15
/**
 * ReadReceipt Component
 * Shows message delivery and read status with visual indicators
 * Updates in real-time via WebSocket events
 */

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Check, CheckCheck, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

interface ReadReceiptProps {
  /** Current message status */
  status: MessageStatus;
  /** Array of user IDs who have read the message */
  readBy?: string[];
  /** Timestamp of the message */
  timestamp?: Date | string;
  /** Custom className */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const statusConfig = {
  sending: {
    icon: Clock,
    color: 'text-muted-foreground',
    label: 'Sending',
  },
  sent: {
    icon: Check,
    color: 'text-muted-foreground',
    label: 'Sent',
  },
  delivered: {
    icon: CheckCheck,
    color: 'text-muted-foreground',
    label: 'Delivered',
  },
  read: {
    icon: CheckCheck,
    color: 'text-blue-500',
    label: 'Read',
  },
  failed: {
    icon: XCircle,
    color: 'text-destructive',
    label: 'Failed to send',
  },
};

export function ReadReceipt({
  status,
  readBy = [],
  timestamp,
  size = 'sm',
  className,
}: ReadReceiptProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const iconSize = sizeClasses[size];

  const getTooltipContent = () => {
    if (status === 'failed') {
      return 'Failed to send. Tap to retry.';
    }

    if (status === 'sending') {
      return 'Sending message...';
    }

    const parts: string[] = [];

    // Add status
    parts.push(config.label);

    // Add timestamp if available
    if (timestamp) {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      parts.push(`at ${format(date, 'h:mm a')}`);
    }

    // Add read count
    if (status === 'read' && readBy.length > 0) {
      parts.push(`by ${readBy.length} ${readBy.length === 1 ? 'person' : 'people'}`);
    }

    return parts.join(' ');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('inline-flex items-center', className)}>
            <Icon
              className={cn(
                iconSize,
                config.color,
                status === 'sending' && 'animate-pulse',
                'transition-colors duration-200'
              )}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="text-xs">{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Inline read receipts showing who read the message
 */
interface ReadReceiptListProps {
  /** Array of users who read the message */
  readBy: Array<{
    userId: string;
    name?: string;
    email: string;
    readAt?: Date | string;
  }>;
  /** Maximum names to show before grouping */
  maxNames?: number;
  /** Custom className */
  className?: string;
}

export function ReadReceiptList({
  readBy,
  maxNames = 3,
  className,
}: ReadReceiptListProps) {
  if (readBy.length === 0) {
    return null;
  }

  const visibleUsers = readBy.slice(0, maxNames);
  const hiddenCount = Math.max(0, readBy.length - maxNames);

  const getDisplayNames = () => {
    const names = visibleUsers.map(user => user.name || user.email.split('@')[0]);

    if (hiddenCount > 0) {
      names.push(`${hiddenCount} other${hiddenCount > 1 ? 's' : ''}`);
    }

    if (names.length === 1) {
      return `Read by ${names[0]}`;
    } else if (names.length === 2) {
      return `Read by ${names[0]} and ${names[1]}`;
    } else {
      const last = names.pop();
      return `Read by ${names.join(', ')}, and ${last}`;
    }
  };

  return (
    <div className={cn('flex items-center gap-1 text-xs text-muted-foreground', className)}>
      <CheckCheck className="h-3 w-3 text-blue-500" />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">{getDisplayNames()}</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              {readBy.map(user => (
                <div key={user.userId} className="flex justify-between gap-4">
                  <span className="font-medium">{user.name || user.email}</span>
                  {user.readAt && (
                    <span className="text-xs text-muted-foreground">
                      {format(
                        typeof user.readAt === 'string' ? new Date(user.readAt) : user.readAt,
                        'MMM d, h:mm a'
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export default ReadReceipt;

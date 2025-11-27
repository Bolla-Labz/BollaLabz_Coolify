// Last Modified: 2025-11-24 00:15
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Check,
  CheckCheck,
  Circle,
  AlertCircle,
  File,
  Image,
  Play,
  Mic,
  RotateCcw,
  Reply,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ReadReceipt } from '@/components/realtime';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'contact';
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: {
    type: 'image' | 'file' | 'audio' | 'video';
    url: string;
    name: string;
    size?: number;
  }[];
  replyTo?: {
    id: string;
    content: string;
    sender: 'user' | 'contact';
  };
}

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  isFirstInGroup?: boolean;
  contactAvatar?: string;
  contactName?: string;
  onReply?: (message: Message) => void;
  onRetry?: (message: Message) => void;
  /** Array of user IDs who have read this message */
  readBy?: string[];
  /** Use real-time read receipts component */
  useRealtimeReceipts?: boolean;
}

export function MessageBubble({
  message,
  showAvatar = true,
  isFirstInGroup = true,
  contactAvatar,
  contactName = 'Contact',
  onReply,
  onRetry,
  readBy = [],
  useRealtimeReceipts = false,
}: MessageBubbleProps) {
  const isUser = message.sender === 'user';

  const getStatusIcon = () => {
    if (!isUser || !message.status) return null;

    // Use real-time ReadReceipt component if enabled
    if (useRealtimeReceipts) {
      return (
        <ReadReceipt
          status={message.status}
          readBy={readBy}
          timestamp={message.timestamp}
          size="sm"
        />
      );
    }

    // Legacy status icons
    switch (message.status) {
      case 'sending':
        return <Circle className="w-3 h-3 text-muted-foreground" />;
      case 'sent':
        return <Check className="w-3 h-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-destructive" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderAttachment = (attachment: any) => {
    switch (attachment.type) {
      case 'image':
        return (
          <div className="relative group cursor-pointer">
            <img
              src={attachment.url}
              alt={attachment.name}
              className="rounded-lg max-w-[300px] max-h-[300px] object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Button size="sm" variant="secondary">
                View
              </Button>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="relative group cursor-pointer">
            <video
              src={attachment.url}
              className="rounded-lg max-w-[300px] max-h-[300px]"
              controls={false}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/60 rounded-full p-3">
                <Play className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
            <Mic className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">{attachment.name}</div>
              <div className="text-xs text-muted-foreground">
                {formatFileSize(attachment.size)}
              </div>
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Play className="w-4 h-4" />
            </Button>
          </div>
        );

      case 'file':
      default:
        return (
          <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
            <File className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">{attachment.name}</div>
              <div className="text-xs text-muted-foreground">
                {formatFileSize(attachment.size)}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "flex gap-2 group",
        isUser ? "justify-end" : "justify-start",
        !isFirstInGroup && "mt-0.5"
      )}
    >
      {/* Avatar for contact messages */}
      {!isUser && (
        <div className="w-6">
          {showAvatar && (
            <Avatar className="h-6 w-6">
              <AvatarImage src={contactAvatar} />
              <AvatarFallback>
                {(contactName[0] || 'C').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      {/* Message Content */}
      <div
        className={cn(
          "max-w-[70%] space-y-1",
          isUser && "items-end"
        )}
      >
        {/* Reply To */}
        {message.replyTo && (
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border-l-2",
              message.replyTo.sender === 'user'
                ? "border-primary"
                : "border-muted-foreground"
            )}
          >
            <Reply className="w-3 h-3 text-muted-foreground" />
            <div className="text-xs">
              <div className="font-medium">
                {message.replyTo.sender === 'user' ? 'You' : contactName}
              </div>
              <div className="text-muted-foreground line-clamp-1">
                {message.replyTo.content}
              </div>
            </div>
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2">
            {message.attachments.map((attachment, idx) => (
              <div key={idx}>{renderAttachment(attachment)}</div>
            ))}
          </div>
        )}

        {/* Text Message */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2 inline-block",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md",
            isFirstInGroup && isUser && "rounded-br-2xl",
            isFirstInGroup && !isUser && "rounded-bl-2xl"
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] opacity-70">
              {format(message.timestamp, 'h:mm a')}
            </span>
            {getStatusIcon()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {message.status === 'failed' && onRetry && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => onRetry(message)}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
          {onReply && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => onReply(message)}
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
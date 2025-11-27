// Last Modified: 2025-11-24 00:15
import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Phone,
  Video,
  MoreVertical,
  Search,
  Info,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageBubble } from './MessageBubble';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { PresenceIndicator, TypingIndicator } from '@/components/realtime';
import { usePresence } from '@/hooks/usePresence';

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

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  phone: string;
  isOnline?: boolean;
  lastSeen?: Date;
  isTyping?: boolean;
}

interface MessageThreadProps {
  messages: Message[];
  contact: Contact;
  onCall?: () => void;
  onVideoCall?: () => void;
  onShowInfo?: () => void;
  onSearch?: () => void;
  /** Room ID for WebSocket presence (defaults to contact.id) */
  roomId?: string;
  /** Enable real-time features */
  enableRealtime?: boolean;
}

export function MessageThread({
  messages,
  contact,
  onCall,
  onVideoCall,
  onShowInfo,
  onSearch,
  roomId,
  enableRealtime = true,
}: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Use room ID (defaults to contact ID for 1:1 conversations)
  const conversationRoomId = roomId || `conversation:${contact.id}`;

  // Real-time presence and collaboration features
  const {
    onlineUsers,
    typingUsers,
    readReceipts,
    startTyping,
    stopTyping,
    markAsRead,
    isInRoom,
  } = usePresence({
    roomId: conversationRoomId,
    autoJoin: enableRealtime,
  });

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Mark messages as read when they come into view
    if (enableRealtime && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'contact') {
        markAsRead(lastMessage.id);
      }
    }
  }, [messages, enableRealtime, markAsRead]);

  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const getStatusText = () => {
    if (contact.isTyping) return 'typing...';
    if (contact.isOnline) return 'online';
    if (contact.lastSeen) {
      return `last seen ${format(contact.lastSeen, 'h:mm a')}`;
    }
    return 'offline';
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: any, message) => {
    const date = format(message.timestamp, 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={contact.avatar} />
              <AvatarFallback>
                {contact.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{contact.name}</h3>
                {enableRealtime && isInRoom && onlineUsers.length > 0 && (
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                )}
              </div>
              <p className={cn(
                "text-xs",
                contact.isOnline || (enableRealtime && onlineUsers.length > 0) ? "text-green-600" : "text-muted-foreground"
              )}>
                {getStatusText()}
              </p>
            </div>

            {/* Real-time presence indicator */}
            {enableRealtime && onlineUsers.length > 1 && (
              <PresenceIndicator
                onlineUsers={onlineUsers}
                size="sm"
                maxAvatars={3}
                showCount={true}
              />
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onCall}>
              <Phone className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onVideoCall}>
              <Video className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onSearch}>
              <Search className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onShowInfo}>
              <Info className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                <DropdownMenuItem>Clear Chat</DropdownMenuItem>
                <DropdownMenuItem>Block Contact</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  Delete Conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {Object.entries(groupedMessages).map(([date, dateMessages]: [string, any]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-muted px-3 py-1 rounded-full">
                  <span className="text-xs text-muted-foreground">
                    {formatDateSeparator(new Date(date))}
                  </span>
                </div>
              </div>

              {/* Messages for this date */}
              <div className="space-y-2">
                {dateMessages.map((message: Message, index: number) => {
                  const prevMessage = index > 0 ? dateMessages[index - 1] : null;
                  const nextMessage = index < dateMessages.length - 1 ? dateMessages[index + 1] : null;
                  const showAvatar = !nextMessage || nextMessage.sender !== message.sender;
                  const isFirstInGroup = !prevMessage || prevMessage.sender !== message.sender;

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      showAvatar={showAvatar}
                      isFirstInGroup={isFirstInGroup}
                      contactAvatar={contact.avatar}
                      contactName={contact.name}
                      readBy={enableRealtime ? Array.from(readReceipts.get(message.id) || []) : undefined}
                      useRealtimeReceipts={enableRealtime}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Typing Indicator - Real-time or legacy */}
          {enableRealtime && typingUsers.length > 0 ? (
            <TypingIndicator
              typingUsers={typingUsers.map(user => ({
                ...user,
                name: user.userEmail === contact.phone ? contact.name : user.userEmail,
                avatar: user.userEmail === contact.phone ? contact.avatar : undefined,
              }))}
              showAvatar={true}
              size="md"
            />
          ) : contact.isTyping && !enableRealtime ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={contact.avatar} />
                <AvatarFallback>
                  {(contact.name[0] || 'C').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl px-4 py-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Scroll to Bottom Button */}
      <Button
        size="sm"
        variant="secondary"
        className="absolute bottom-20 right-6 rounded-full h-8 w-8 p-0 opacity-0 hover:opacity-100 transition-opacity"
        onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
// Last Modified: 2025-11-24 00:00
import React, { useDeferredValue, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Plus,
  Phone,
  Video,
  MoreVertical,
  Circle,
  Check,
  CheckCheck
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  contact: {
    id: string;
    name: string;
    avatar?: string;
    phone: string;
    isOnline?: boolean;
  };
  lastMessage: {
    id: string;
    content: string;
    timestamp: Date;
    isRead: boolean;
    isDelivered: boolean;
    sender: 'user' | 'contact';
  };
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isTyping?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  onNewConversation?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNewConversation,
  searchQuery,
  onSearchChange,
}: ConversationListProps) {
  // Defer search query to keep input responsive
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isPendingSearch = searchQuery !== deferredSearchQuery;

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const getMessagePreview = (message: string, maxLength = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  // Filter and sort using deferred search query
  const sortedConversations = useMemo(() => {
    // Filter based on deferred search query
    const filtered = deferredSearchQuery.trim()
      ? conversations.filter(conv =>
          conv.contact.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
          conv.contact.phone.includes(deferredSearchQuery) ||
          conv.lastMessage.content.toLowerCase().includes(deferredSearchQuery.toLowerCase())
        )
      : conversations;

    // Sort filtered results
    return [...filtered].sort((a, b) => {
      // Pinned conversations first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then by last message time
      return b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime();
    });
  }, [conversations, deferredSearchQuery]);

  return (
    <div className="w-80 border-r bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Messages</h2>
            {isPendingSearch && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                Searching...
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={onNewConversation}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
          {isPendingSearch && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {sortedConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">
              {deferredSearchQuery ? 'No conversations match your search' : 'No conversations found'}
            </p>
            {deferredSearchQuery && (
              <p className="text-xs mt-1">Try searching for a different name or message</p>
            )}
          </div>
        ) : (
          <div className="p-2">
            {sortedConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation)}
                className={cn(
                  "w-full p-3 rounded-lg hover:bg-muted/50 transition-colors flex items-start gap-3 mb-1",
                  selectedId === conversation.id && "bg-muted"
                )}
              >
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.contact.avatar} />
                    <AvatarFallback>
                      {conversation.contact.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.contact.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm truncate">
                      {conversation.contact.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatMessageTime(conversation.lastMessage.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      {conversation.lastMessage.sender === 'user' && (
                        <div className="text-muted-foreground">
                          {conversation.lastMessage.isRead ? (
                            <CheckCheck className="w-3 h-3" />
                          ) : conversation.lastMessage.isDelivered ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Circle className="w-3 h-3" />
                          )}
                        </div>
                      )}
                      {conversation.isTyping ? (
                        <span className="text-xs text-primary italic">typing...</span>
                      ) : (
                        <span className="text-xs text-muted-foreground truncate">
                          {getMessagePreview(conversation.lastMessage.content)}
                        </span>
                      )}
                    </div>

                    {conversation.unreadCount > 0 && (
                      <Badge
                        variant="default"
                        className="h-5 min-w-[20px] px-1.5 text-[10px]"
                      >
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
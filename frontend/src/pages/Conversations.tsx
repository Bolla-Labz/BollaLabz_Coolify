// Last Modified: 2025-11-24 00:00
import React, { useState, useEffect, Suspense } from 'react';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { ConversationList } from '@/components/conversations/ConversationList';
import { MessageThread } from '@/components/conversations/MessageThread';
import { MessageInput } from '@/components/conversations/MessageInput';
import { ConversationListSkeleton } from '@/components/skeletons';
import { ListLoader } from '@/components/ui/loaders/TableLoader';
import { DataLoader } from '@/components/ui/loaders/DataLoader';
import { NoConversations } from '@/components/empty-states';
import { DataSuspenseWrapper } from '@/components/ui/SuspenseWrapper';
import { useConversationsStore } from '@/stores/conversationsStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

export default function Conversations() {
  const navigate = useNavigate();
  const {
    conversations,
    isLoading,
    isSending,
    error,
    fetchConversations,
    sendMessage,
    markAsRead,
    getConversationMessages,
  } = useConversationsStore();

  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [showCallDialog, setShowCallDialog] = useState(false);

  useEffect(() => {
    // Fetch conversations on mount
    fetchConversations().catch((error) => {
      console.error('Failed to load conversations:', error);
      // Error is already handled by the store (toast shown)
    });
  }, [fetchConversations]);

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation);
    if (conversation.unreadCount > 0) {
      markAsRead(conversation.id);
    }
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (selectedConversation) {
      try {
        await sendMessage(
          selectedConversation.id,
          content,
          parseInt(selectedConversation.contactId)
        );
        setReplyTo(null);
      } catch (error) {
        console.error('Failed to send message:', error);
        // Error is already handled by the store (toast shown)
      }
    }
  };

  const handleReply = (message: any) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handleNewConversation = () => {
    // TODO: Implement new conversation dialog
    console.log('New conversation');
  };

  // Get messages for selected conversation
  const selectedMessages = selectedConversation
    ? getConversationMessages(selectedConversation.id)
    : [];

  // Show empty state if no conversations
  if (!isLoading && conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <NoConversations
          onStartConversation={() => navigate('/contacts')}
          onMakeCall={() => setShowCallDialog(true)}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations Sidebar */}
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id}
          onSelect={handleSelectConversation}
          onNewConversation={handleNewConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Main Chat Area */}
        {isLoading && !selectedConversation ? (
          <div className="flex-1 p-6 overflow-auto">
            <ConversationListSkeleton />
          </div>
        ) : selectedConversation ? (
          <div className="flex-1 flex flex-col">
            <MessageThread
              messages={selectedMessages}
              contact={{
                name: selectedConversation.contactName,
                phone: selectedConversation.contactPhone,
                avatar: selectedConversation.contactAvatar,
              }}
              onCall={() => console.log('Call')}
              onVideoCall={() => console.log('Video call')}
              onShowInfo={() => console.log('Show info')}
              onSearch={() => console.log('Search')}
            />
            <MessageInput
              onSendMessage={handleSendMessage}
              onStartRecording={() => console.log('Start recording')}
              onStopRecording={() => console.log('Stop recording')}
              replyTo={replyTo}
              onCancelReply={handleCancelReply}
              disabled={isSending}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
              <p className="text-muted-foreground">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
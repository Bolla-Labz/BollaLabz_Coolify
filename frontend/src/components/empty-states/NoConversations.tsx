// Last Modified: 2025-11-24 00:00
import { MessageSquare, Phone } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface NoConversationsProps {
  onStartConversation: () => void;
  onMakeCall?: () => void;
}

export function NoConversations({ onStartConversation, onMakeCall }: NoConversationsProps) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No conversations yet"
      description="Start connecting with your contacts through messages or voice calls. Every interaction is automatically tracked and summarized by AI."
      action={{
        label: 'Send First Message',
        onClick: onStartConversation,
      }}
      secondaryAction={onMakeCall ? {
        label: 'Make a Call',
        onClick: onMakeCall,
        variant: 'outline',
      } : undefined}
    />
  );
}

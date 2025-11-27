// Last Modified: 2025-11-24 00:00
import { Users, Upload } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useNavigate } from 'react-router-dom';

export function NoContacts() {
  const navigate = useNavigate();

  return (
    <EmptyState
      icon={Users}
      title="No contacts yet"
      description="Start building your network by adding your first contact. You can add contacts manually or import them from your phone."
      action={{
        label: 'Add Your First Contact',
        onClick: () => {
          // Trigger the new contact form (handled by parent component)
          const event = new CustomEvent('openContactForm');
          window.dispatchEvent(event);
        },
      }}
      secondaryAction={{
        label: 'Import Contacts',
        onClick: () => {
          // TODO: Open import dialog
          console.log('Import contacts');
        },
        variant: 'outline',
      }}
    />
  );
}

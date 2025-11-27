// Last Modified: 2025-11-24 00:00
import React, { useState, useEffect, Suspense } from 'react';
import { Plus, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { ContactDetail } from '@/components/contacts/ContactDetail';
import { ContactForm } from '@/components/contacts/ContactForm';
import { TableLoader } from '@/components/ui/loaders/TableLoader';
import { TableSkeleton } from '@/components/skeletons';
import { NoContacts } from '@/components/empty-states';
import { DataSuspenseWrapper } from '@/components/ui/SuspenseWrapper';
import { useContactsStore } from '@/stores/contactsStore';

export default function Contacts() {
  const { contacts, fetchContacts, isLoading, error } = useContactsStore();
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);

  useEffect(() => {
    // Fetch contacts from API on mount
    fetchContacts().catch((error) => {
      console.error('Failed to load contacts:', error);
      // Error is already handled by the store (toast shown)
    });

    // Listen for custom event from NoContacts component
    const handleOpenContactForm = () => {
      handleNewContact();
    };
    window.addEventListener('openContactForm', handleOpenContactForm);

    return () => {
      window.removeEventListener('openContactForm', handleOpenContactForm);
    };
  }, [fetchContacts]);

  const handleViewContact = (contact: any) => {
    setSelectedContact(contact);
    setIsDetailOpen(true);
  };

  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setIsFormOpen(true);
    setIsDetailOpen(false);
  };

  const handleNewContact = () => {
    setEditingContact(null);
    setIsFormOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedContact(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingContact(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your relationships and contact information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={handleNewContact} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State with Suspense wrapper */}
      {isLoading ? (
        <TableLoader rows={15} columns={7} />
      ) : contacts.length === 0 ? (
        <NoContacts />
      ) : (
        <DataSuspenseWrapper loadingMessage="Loading contacts..." variant="skeleton">
          <ContactsTable
            onViewContact={handleViewContact}
            onEditContact={handleEditContact}
          />
        </DataSuspenseWrapper>
      )}

      {/* Contact Detail Dialog */}
      <ContactDetail
        contact={selectedContact}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onEdit={handleEditContact}
      />

      {/* Contact Form Dialog */}
      <ContactForm
        contact={editingContact}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
      />
    </div>
  );
}
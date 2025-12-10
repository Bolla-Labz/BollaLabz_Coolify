"use client";

import { ContactList } from "@/components/contacts/contact-list";
import type { Contact } from "@repo/types";

export default function ContactsPage() {
  const handleCall = (contact: Partial<Contact>) => {
    if (contact.phone) {
      console.log(`Calling ${contact.firstName ?? ""} ${contact.lastName ?? ""} at ${contact.phone}`);
      // In production, this would trigger the voice pipeline
    }
  };

  const handleEmail = (contact: Partial<Contact>) => {
    if (contact.email) {
      window.location.href = `mailto:${contact.email}`;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal and professional contacts.
        </p>
      </div>

      {/* Contact list */}
      <ContactList onCall={handleCall} onEmail={handleEmail} />
    </div>
  );
}

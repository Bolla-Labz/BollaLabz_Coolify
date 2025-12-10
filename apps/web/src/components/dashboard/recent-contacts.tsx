"use client";

import Link from "next/link";
import type { Contact } from "@repo/types";

// Icons
const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </svg>
);

const MailIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

interface RecentContactsProps {
  contacts?: Contact[];
  loading?: boolean;
  limit?: number;
}

// Mock data for demonstration (using Date objects per Contact type)
const mockContacts: Partial<Contact>[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    company: "Tech Corp",
    lastInteraction: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
  {
    id: "2",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.j@example.com",
    phone: "+1 (555) 234-5678",
    company: "Design Studio",
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: "3",
    firstName: "Michael",
    lastName: "Brown",
    email: "m.brown@example.com",
    phone: "+1 (555) 345-6789",
    company: "Consulting LLC",
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
  },
  {
    id: "4",
    firstName: "Emily",
    lastName: "Davis",
    email: "emily.d@example.com",
    phone: "+1 (555) 456-7890",
    company: "Marketing Pro",
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
];

function getInitials(firstName: string | null | undefined, lastName: string | null | undefined): string {
  const first = firstName?.charAt(0) ?? "";
  const last = lastName?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

function getTimeAgo(date: Date | string | undefined): string {
  if (!date) return "Unknown";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

export function RecentContacts({
  contacts,
  loading = false,
  limit = 4,
}: RecentContactsProps) {
  const displayContacts = contacts || mockContacts.slice(0, limit);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-card-foreground">Recent Contacts</h2>
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-muted rounded mb-2" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-card-foreground">Recent Contacts</h2>
        <Link
          href="/dashboard/contacts"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View all
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {displayContacts.map((contact) => (
          <Link
            key={contact.id}
            href={`/dashboard/contacts/${contact.id}`}
            className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
          >
            {/* Avatar */}
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {getInitials(contact.firstName || "", contact.lastName || "")}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">
                {contact.firstName} {contact.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {contact.company || contact.email}
              </p>
            </div>

            {/* Last interaction */}
            {contact.lastInteraction && (
              <span className="text-xs text-muted-foreground">
                {getTimeAgo(contact.lastInteraction)}
              </span>
            )}

            {/* Quick actions */}
            <div className="flex items-center gap-1">
              {contact.phone && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // Handle call action
                  }}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                  title="Call"
                >
                  <PhoneIcon className="h-4 w-4" />
                </button>
              )}
              {contact.email && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // Handle email action
                  }}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                  title="Email"
                >
                  <MailIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </Link>
        ))}
      </div>

      {displayContacts.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <p>No recent contacts</p>
          <Link
            href="/dashboard/contacts/new"
            className="text-primary hover:underline text-sm mt-2 inline-block"
          >
            Add your first contact
          </Link>
        </div>
      )}
    </div>
  );
}

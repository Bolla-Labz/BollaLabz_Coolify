"use client";

import { use } from "react";
import Link from "next/link";
import type { Contact, ContactInteraction, Address } from "@repo/types";

// Extended contact type for UI with additional display fields
interface UIContact extends Contact {
  alternatePhone?: string;
  address?: Address;
}

// Icons
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
);

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

const BuildingIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const StarIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
  </svg>
);

// Mock contact data - aligned with UIContact type (extends Contact)
const mockContact: UIContact = {
  id: "1",
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@techcorp.com",
  phone: "+1 (555) 123-4567",
  alternatePhone: "+1 (555) 987-6543",
  company: "Tech Corp",
  jobTitle: "Chief Executive Officer",
  notes: "VIP client - handle with priority",
  tags: ["tech", "enterprise", "vip"],
  avatarUrl: null,
  relationshipScore: "hot",
  lastContactedAt: new Date(Date.now() - 1000 * 60 * 30),
  embedding: null,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  updatedAt: new Date(Date.now() - 1000 * 60 * 60),
  deletedAt: null,
  // Computed/derived fields
  displayName: "John Smith",
  lastInteraction: new Date(Date.now() - 1000 * 60 * 30),
  interactionCount: 47,
  category: "client",
  importance: "high",
  // Extended UI fields
  address: {
    street1: "123 Business Ave",
    street2: "Suite 100",
    city: "San Francisco",
    state: "CA",
    postalCode: "94102",
    country: "USA",
    type: "work",
  },
};

// Mock interaction history
const mockInteractions: Partial<ContactInteraction>[] = [
  {
    id: "1",
    contactId: "1",
    type: "call",
    direction: "outbound",
    duration: 342,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    notes: "Discussed Q4 projections",
  },
  {
    id: "2",
    contactId: "1",
    type: "email",
    direction: "inbound",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    notes: "Follow-up on proposal",
  },
  {
    id: "3",
    contactId: "1",
    type: "meeting",
    duration: 3600,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    notes: "Quarterly review meeting",
  },
  {
    id: "4",
    contactId: "1",
    type: "call",
    direction: "inbound",
    duration: 180,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
];

function getInitials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.charAt(0) ?? "";
  const last = lastName?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Use params for future API calls
  use(params);

  // In production, this would fetch from TanStack Query
  const contact = mockContact;
  const interactions = mockInteractions;
  const loading = false;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="flex gap-6">
          <div className="h-24 w-24 rounded-full bg-muted" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-4 w-40 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <Link
        href="/dashboard/contacts"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Contacts
      </Link>

      {/* Contact header */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mx-auto md:mx-0">
            <span className="text-3xl font-bold text-primary">
              {getInitials(contact.firstName, contact.lastName)}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                {contact.firstName} {contact.lastName}
              </h1>
              {(contact.importance === "high" || contact.importance === "critical") && (
                <StarIcon className="h-5 w-5 text-warning" filled />
              )}
            </div>

            {contact.jobTitle && (
              <p className="text-muted-foreground mt-1">{contact.jobTitle}</p>
            )}

            {contact.company && (
              <div className="flex items-center justify-center md:justify-start gap-1 text-muted-foreground mt-1">
                <BuildingIcon className="h-4 w-4" />
                <span>{contact.company}</span>
              </div>
            )}

            {/* Tags */}
            {contact.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                {contact.category && (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {contact.category}
                  </span>
                )}
                {contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-start gap-2 justify-center md:justify-start">
            <button className="p-2 rounded-lg border border-input hover:bg-muted transition-colors">
              <PencilIcon className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors">
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border justify-center md:justify-start">
          {contact.phone && (
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <PhoneIcon className="h-4 w-4" />
              Call
            </button>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
            >
              <MailIcon className="h-4 w-4" />
              Email
            </a>
          )}
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Contact details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact info card */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h2 className="font-semibold text-foreground mb-4">Contact Information</h2>
            <div className="space-y-4">
              {contact.email && (
                <div className="flex items-start gap-3">
                  <MailIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-foreground hover:text-primary"
                    >
                      {contact.email}
                    </a>
                  </div>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-start gap-3">
                  <PhoneIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-foreground hover:text-primary"
                    >
                      {contact.phone}
                    </a>
                  </div>
                </div>
              )}
              {contact.alternatePhone && (
                <div className="flex items-start gap-3">
                  <PhoneIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Alternate Phone</p>
                    <a
                      href={`tel:${contact.alternatePhone}`}
                      className="text-foreground hover:text-primary"
                    >
                      {contact.alternatePhone}
                    </a>
                  </div>
                </div>
              )}
              {contact.address && (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="text-foreground">
                      {contact.address.street1}
                      {contact.address.street2 && <>, {contact.address.street2}</>}
                      <br />
                      {contact.address.city}, {contact.address.state}{" "}
                      {contact.address.postalCode}
                      <br />
                      {contact.address.country}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats card */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h2 className="font-semibold text-foreground mb-4">Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {contact.interactionCount || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Interactions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {formatDate(contact.lastInteraction || contact.createdAt)}
                </p>
                <p className="text-sm text-muted-foreground">Last Contact</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Interaction history */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Interaction History</h2>
            </div>
            <div className="divide-y divide-border">
              {interactions.map((interaction) => (
                <div key={interaction.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        interaction.type === "call"
                          ? "bg-primary/10 text-primary"
                          : interaction.type === "email"
                          ? "bg-warning/10 text-warning"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      {interaction.type === "call" && <PhoneIcon className="h-5 w-5" />}
                      {interaction.type === "email" && <MailIcon className="h-5 w-5" />}
                      {interaction.type === "meeting" && (
                        <BuildingIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground capitalize">
                          {interaction.type}
                        </span>
                        {interaction.direction && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                            {interaction.direction}
                          </span>
                        )}
                        {interaction.duration && (
                          <span className="text-sm text-muted-foreground">
                            {formatDuration(interaction.duration)}
                          </span>
                        )}
                      </div>
                      {interaction.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {interaction.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(interaction.timestamp || "")} at{" "}
                        {formatTime(interaction.timestamp || "")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {interactions.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No interactions yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

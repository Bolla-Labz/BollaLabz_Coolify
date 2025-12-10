"use client";

import Link from "next/link";
import type { Contact, ContactCategory } from "@repo/types";

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

const BuildingIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
  </svg>
);

const StarIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
  </svg>
);

interface ContactCardProps {
  contact: Partial<Contact>;
  variant?: "default" | "compact";
  onCall?: (contact: Partial<Contact>) => void;
  onEmail?: (contact: Partial<Contact>) => void;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getCategoryColor(category?: ContactCategory): string {
  switch (category) {
    case "client":
      return "bg-success/10 text-success";
    case "vendor":
      return "bg-warning/10 text-warning";
    case "partner":
      return "bg-primary/10 text-primary";
    case "family":
      return "bg-destructive/10 text-destructive";
    case "friend":
      return "bg-accent text-accent-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getImportanceColor(importance?: "low" | "medium" | "high" | "critical"): string {
  switch (importance) {
    case "critical":
      return "text-destructive";
    case "high":
      return "text-warning";
    case "medium":
      return "text-primary";
    default:
      return "text-muted-foreground";
  }
}

export function ContactCard({
  contact,
  variant = "default",
  onCall,
  onEmail,
}: ContactCardProps) {
  const isCompact = variant === "compact";

  if (isCompact) {
    return (
      <Link
        href={`/dashboard/contacts/${contact.id}`}
        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/20 transition-all"
      >
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          {contact.avatar ? (
            <img
              src={contact.avatar}
              alt={`${contact.firstName} ${contact.lastName}`}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-primary">
              {getInitials(contact.firstName || "", contact.lastName || "")}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {contact.firstName} {contact.lastName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {contact.company || contact.email}
          </p>
        </div>

        {/* Importance star */}
        {contact.importance === "high" || contact.importance === "critical" ? (
          <StarIcon
            className={`h-4 w-4 flex-shrink-0 ${getImportanceColor(contact.importance)}`}
            filled
          />
        ) : null}
      </Link>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Link
          href={`/dashboard/contacts/${contact.id}`}
          className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"
        >
          {contact.avatar ? (
            <img
              src={contact.avatar}
              alt={`${contact.firstName} ${contact.lastName}`}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <span className="text-lg font-medium text-primary">
              {getInitials(contact.firstName || "", contact.lastName || "")}
            </span>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/contacts/${contact.id}`}
              className="text-base font-semibold text-card-foreground hover:text-primary truncate"
            >
              {contact.firstName} {contact.lastName}
            </Link>
            {(contact.importance === "high" || contact.importance === "critical") && (
              <StarIcon
                className={`h-4 w-4 flex-shrink-0 ${getImportanceColor(contact.importance)}`}
                filled
              />
            )}
          </div>

          {contact.jobTitle && (
            <p className="text-sm text-muted-foreground truncate">{contact.jobTitle}</p>
          )}

          {contact.company && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <BuildingIcon className="h-4 w-4" />
              <span className="truncate">{contact.company}</span>
            </div>
          )}

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {contact.category && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(
                    contact.category
                  )}`}
                >
                  {contact.category}
                </span>
              )}
              {contact.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {contact.tags.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{contact.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
        {contact.phone && (
          <button
            onClick={() => onCall?.(contact)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <PhoneIcon className="h-4 w-4" />
            Call
          </button>
        )}
        {contact.email && (
          <button
            onClick={() => onEmail?.(contact)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <MailIcon className="h-4 w-4" />
            Email
          </button>
        )}
        <Link
          href={`/dashboard/contacts/${contact.id}`}
          className="ml-auto text-sm text-primary hover:underline"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

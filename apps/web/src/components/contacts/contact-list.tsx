"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Contact, ContactCategory } from "@repo/types";
import { ContactCard } from "./contact-card";

// Icons
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
  </svg>
);

const GridIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
  </svg>
);

const ListIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

interface ContactListProps {
  contacts?: Contact[];
  loading?: boolean;
  onCall?: (contact: Partial<Contact>) => void;
  onEmail?: (contact: Partial<Contact>) => void;
}

type SortField = "name" | "company" | "lastInteraction" | "createdAt";
type SortOrder = "asc" | "desc";
type ViewMode = "grid" | "list";

const categories: { value: ContactCategory | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "client", label: "Client" },
  { value: "vendor", label: "Vendor" },
  { value: "partner", label: "Partner" },
  { value: "family", label: "Family" },
  { value: "friend", label: "Friend" },
  { value: "professional", label: "Professional" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" },
];

// Mock data for demonstration (using Date objects per Contact type)
const mockContacts: Partial<Contact>[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@techcorp.com",
    phone: "+1 (555) 123-4567",
    company: "Tech Corp",
    jobTitle: "CEO",
    category: "client",
    importance: "high",
    tags: ["tech", "enterprise"],
    lastInteraction: new Date(Date.now() - 1000 * 60 * 30),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "2",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.j@designstudio.com",
    phone: "+1 (555) 234-5678",
    company: "Design Studio",
    jobTitle: "Creative Director",
    category: "partner",
    importance: "medium",
    tags: ["design", "creative"],
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 2),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "3",
    firstName: "Michael",
    lastName: "Brown",
    email: "m.brown@consulting.com",
    phone: "+1 (555) 345-6789",
    company: "Consulting LLC",
    jobTitle: "Senior Consultant",
    category: "vendor",
    importance: "medium",
    tags: ["consulting", "finance"],
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 5),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: "4",
    firstName: "Emily",
    lastName: "Davis",
    email: "emily.d@marketing.com",
    phone: "+1 (555) 456-7890",
    company: "Marketing Pro",
    jobTitle: "Marketing Manager",
    category: "client",
    importance: "high",
    tags: ["marketing", "growth"],
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 24),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "5",
    firstName: "David",
    lastName: "Wilson",
    email: "d.wilson@family.com",
    phone: "+1 (555) 567-8901",
    category: "family",
    importance: "critical",
    tags: ["family"],
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 48),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
  {
    id: "6",
    firstName: "Lisa",
    lastName: "Anderson",
    email: "lisa.a@startup.io",
    phone: "+1 (555) 678-9012",
    company: "Startup.io",
    jobTitle: "Founder",
    category: "partner",
    importance: "high",
    tags: ["startup", "tech", "innovation"],
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 72),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
  },
];

export function ContactList({
  contacts,
  loading = false,
  onCall,
  onEmail,
}: ContactListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ContactCategory | "all">("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);

  const displayContacts = contacts || mockContacts;

  const filteredAndSortedContacts = useMemo(() => {
    let result = [...displayContacts];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (contact) =>
          contact.firstName?.toLowerCase().includes(query) ||
          contact.lastName?.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.company?.toLowerCase().includes(query) ||
          contact.phone?.includes(query) ||
          contact.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((contact) => contact.category === selectedCategory);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      switch (sortField) {
        case "name":
          aVal = `${a.firstName ?? ""} ${a.lastName ?? ""}`.toLowerCase();
          bVal = `${b.firstName ?? ""} ${b.lastName ?? ""}`.toLowerCase();
          break;
        case "company":
          aVal = a.company?.toLowerCase() ?? "";
          bVal = b.company?.toLowerCase() ?? "";
          break;
        case "lastInteraction":
          aVal = a.lastInteraction?.getTime() ?? 0;
          bVal = b.lastInteraction?.getTime() ?? 0;
          break;
        case "createdAt":
          aVal = a.createdAt?.getTime() ?? 0;
          bVal = b.createdAt?.getTime() ?? 0;
          break;
      }

      if (sortOrder === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return result;
  }, [displayContacts, searchQuery, selectedCategory, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Search bar skeleton */}
        <div className="h-12 bg-muted rounded-lg animate-pulse" />

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-muted rounded mb-2" />
                  <div className="h-3 w-24 bg-muted rounded mb-2" />
                  <div className="h-3 w-28 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-lg border border-input hover:bg-muted transition-colors ${
              showFilters || selectedCategory !== "all" ? "bg-primary/10 border-primary/20 text-primary" : ""
            }`}
            title="Filters"
          >
            <FilterIcon className="h-4 w-4" />
          </button>

          {/* Sort button */}
          <select
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-") as [SortField, SortOrder];
              setSortField(field);
              setSortOrder(order);
            }}
            className="px-3 py-2.5 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="company-asc">Company (A-Z)</option>
            <option value="company-desc">Company (Z-A)</option>
            <option value="lastInteraction-desc">Recent First</option>
            <option value="lastInteraction-asc">Oldest First</option>
            <option value="createdAt-desc">Newest Added</option>
            <option value="createdAt-asc">Oldest Added</option>
          </select>

          {/* View toggle */}
          <div className="flex items-center border border-input rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 ${viewMode === "grid" ? "bg-muted" : "hover:bg-muted/50"}`}
              title="Grid view"
            >
              <GridIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 ${viewMode === "list" ? "bg-muted" : "hover:bg-muted/50"}`}
              title="List view"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Add contact button */}
          <Link
            href="/dashboard/contacts/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Add Contact</span>
          </Link>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="p-4 bg-card rounded-lg border border-border animate-fade-in">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ContactCategory | "all")}
                className="px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredAndSortedContacts.length} contact{filteredAndSortedContacts.length !== 1 ? "s" : ""}
        {searchQuery && ` matching "${searchQuery}"`}
        {selectedCategory !== "all" && ` in ${selectedCategory}`}
      </p>

      {/* Contact grid/list */}
      {filteredAndSortedContacts.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">No contacts found</p>
          {searchQuery || selectedCategory !== "all" ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="text-primary hover:underline text-sm mt-2"
            >
              Clear filters
            </button>
          ) : (
            <Link
              href="/dashboard/contacts/new"
              className="text-primary hover:underline text-sm mt-2 inline-block"
            >
              Add your first contact
            </Link>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onCall={onCall}
              onEmail={onEmail}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAndSortedContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              variant="compact"
              onCall={onCall}
              onEmail={onEmail}
            />
          ))}
        </div>
      )}
    </div>
  );
}

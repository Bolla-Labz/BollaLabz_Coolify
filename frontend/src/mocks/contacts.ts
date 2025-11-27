// Last Modified: 2025-11-23 17:30
import { Contact } from '../stores/contactsStore';

const firstNames = ['Sarah', 'John', 'Emma', 'Mike', 'Lisa', 'David', 'Amy', 'Chris', 'Jessica', 'Tom'];
const lastNames = ['Chen', 'Doe', 'Wilson', 'Brown', 'Johnson', 'Smith', 'Davis', 'Miller', 'Taylor', 'Anderson'];
const companies = ['Tech Corp', 'Marketing Inc', 'Design Studio', 'Sales Pro', 'Consulting Group'];
const tags = ['VIP', 'Client', 'Vendor', 'Partner', 'Friend', 'Family', 'Prospect', 'Lead'];

export function generateMockContact(index: number): Contact {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  const name = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

  const createdDays = Math.floor(Math.random() * 365);
  const lastContactDays = Math.floor(Math.random() * 30);
  const importance: Contact['importance'] = ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as Contact['importance'];

  return {
    id: `contact-${index + 1}`,
    phone: `+1${String(Math.floor(Math.random() * 9000000000) + 1000000000)}`,
    email,
    name,
    firstName,
    lastName,
    company: Math.random() > 0.3 ? companies[Math.floor(Math.random() * companies.length)] : undefined,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    tags: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () =>
      tags[Math.floor(Math.random() * tags.length)]
    ).filter((v, i, a) => a.indexOf(v) === i),
    notes: Math.random() > 0.5 ? `Important notes about ${name}` : undefined,
    importance,
    relationshipScore: Math.floor(Math.random() * 100),
    lastContactDate: new Date(Date.now() - lastContactDays * 24 * 60 * 60 * 1000).toISOString(),
    nextFollowUp: Math.random() > 0.6
      ? new Date(Date.now() + Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
    conversationCount: Math.floor(Math.random() * 500),
    metadata: {
      source: ['web', 'referral', 'event', 'cold'][Math.floor(Math.random() * 4)],
      industry: ['Technology', 'Healthcare', 'Finance', 'Education'][Math.floor(Math.random() * 4)],
    },
    createdAt: new Date(Date.now() - createdDays * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - lastContactDays * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export const mockContacts: Contact[] = Array.from({ length: 50 }, (_, i) => generateMockContact(i));

// Helper to get contacts with filters
export function getMockContacts(filters?: {
  search?: string;
  tags?: string[];
  importance?: Contact['importance'][];
  limit?: number;
  offset?: number;
}) {
  let filtered = [...mockContacts];

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.phone.includes(searchLower) ||
        contact.company?.toLowerCase().includes(searchLower)
    );
  }

  if (filters?.tags?.length) {
    filtered = filtered.filter((contact) =>
      filters.tags!.some((tag) => contact.tags.includes(tag))
    );
  }

  if (filters?.importance?.length) {
    filtered = filtered.filter((contact) =>
      filters.importance!.includes(contact.importance)
    );
  }

  const offset = filters?.offset || 0;
  const limit = filters?.limit || filtered.length;

  return {
    contacts: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
}
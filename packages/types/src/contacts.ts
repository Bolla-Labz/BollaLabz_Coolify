/**
 * Contact Management Types
 *
 * Updated: 08 December 2025 14 32 45
 *
 * NOTE: This type definition is aligned with the database schema at
 * packages/db/src/schema/contacts.ts
 */

// Core contact entity - matches database schema
export interface Contact {
  // Primary key
  id: string;

  // Personal information
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;

  // Professional information
  company: string | null;
  jobTitle: string | null;

  // Additional details
  notes: string | null;
  tags: string[];
  avatarUrl: string | null;

  // Relationship tracking
  relationshipScore: RelationshipScore;
  lastContactedAt: Date | null;

  // Vector embedding for semantic search (stored as text in DB)
  embedding: string | null;

  // System timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  // Computed/derived fields (not in database, computed at runtime)
  // These can be added by the API layer when needed
  displayName?: string; // Computed from firstName + lastName
  avatar?: string; // Alias for avatarUrl for backwards compatibility
  lastInteraction?: Date; // Alias for lastContactedAt for backwards compatibility
  interactionCount?: number; // Computed from related interactions table
  category?: ContactCategory; // Can be derived from tags or relationship score
  importance?: 'low' | 'medium' | 'high' | 'critical'; // Can be derived from relationshipScore
}

// Relationship score type - matches database enum
export type RelationshipScore = 'cold' | 'warm' | 'hot' | 'neutral' | 'vip';

// Address type
export interface Address {
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  type?: 'home' | 'work' | 'other';
}

// Contact category
export type ContactCategory =
  | 'personal'
  | 'professional'
  | 'family'
  | 'friend'
  | 'client'
  | 'vendor'
  | 'partner'
  | 'other';

// Contact source
export type ContactSource =
  | 'manual'
  | 'import'
  | 'google'
  | 'outlook'
  | 'icloud'
  | 'linkedin'
  | 'facebook'
  | 'api'
  | 'database'
  | 'other';

// Relationship between contacts
export interface Relationship {
  contactId: string;
  type: RelationshipType;
  notes?: string;
}

export type RelationshipType =
  | 'spouse'
  | 'parent'
  | 'child'
  | 'sibling'
  | 'relative'
  | 'friend'
  | 'colleague'
  | 'manager'
  | 'report'
  | 'partner'
  | 'other';

// Sync status for external integrations
export interface SyncStatus {
  provider: string;
  lastSync?: string;
  status: 'synced' | 'pending' | 'error';
  error?: string;
}

// Create contact input - aligned with database schema
export interface CreateContactInput {
  // Personal information
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;

  // Professional information
  company?: string;
  jobTitle?: string;

  // Additional details
  notes?: string;
  tags?: string[];
  avatarUrl?: string;

  // Relationship tracking
  relationshipScore?: RelationshipScore;
  lastContactedAt?: Date;

  // Vector embedding
  embedding?: string;

  // Legacy/convenience fields (will be mapped to actual DB fields)
  avatar?: string; // Maps to avatarUrl
  lastInteraction?: Date; // Maps to lastContactedAt

  // Extended fields (not in DB, used for API layer enrichment)
  category?: ContactCategory;
  importance?: 'low' | 'medium' | 'high' | 'critical';
  source?: ContactSource;
}

// Update contact input - aligned with database schema
export interface UpdateContactInput {
  id: string;

  // Personal information
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;

  // Professional information
  company?: string;
  jobTitle?: string;

  // Additional details
  notes?: string;
  tags?: string[];
  avatarUrl?: string;

  // Relationship tracking
  relationshipScore?: RelationshipScore;
  lastContactedAt?: Date;

  // Vector embedding
  embedding?: string;

  // Legacy/convenience fields
  avatar?: string; // Maps to avatarUrl
  lastInteraction?: Date; // Maps to lastContactedAt

  // Extended fields
  category?: ContactCategory;
  importance?: 'low' | 'medium' | 'high' | 'critical';
}

// Contact group/list
export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  contactIds: string[];
  rules?: GroupRule[];
  isSmartGroup: boolean;
  createdAt: string;
  updatedAt: string;
}

// Rule for smart groups
export interface GroupRule {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
  value: unknown;
}

// Contact interaction
export interface ContactInteraction {
  id: string;
  contactId: string;
  type: InteractionType;
  direction?: 'inbound' | 'outbound';
  duration?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export type InteractionType =
  | 'call'
  | 'email'
  | 'sms'
  | 'meeting'
  | 'note'
  | 'task'
  | 'other';

// Contact merge request
export interface ContactMergeRequest {
  primaryId: string;
  duplicateIds: string[];
  fieldOverrides?: Partial<Contact>;
}
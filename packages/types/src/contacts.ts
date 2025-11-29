/**
 * Contact Management Types
 */

// Core contact entity
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  company?: string;
  jobTitle?: string;
  avatar?: string;

  // Address information
  address?: Address;

  // Contact metadata
  tags: string[];
  category?: ContactCategory;
  source?: ContactSource;
  importance?: 'low' | 'medium' | 'high' | 'critical';

  // Relationship data
  relationships?: Relationship[];

  // Custom fields
  customFields?: Record<string, unknown>;

  // System fields
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastInteraction?: string;
  interactionCount?: number;

  // Sync status
  syncStatus?: SyncStatus;
  externalIds?: Record<string, string>;
}

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

// Create contact input
export interface CreateContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  company?: string;
  jobTitle?: string;
  avatar?: string;
  address?: Address;
  tags?: string[];
  category?: ContactCategory;
  source?: ContactSource;
  importance?: 'low' | 'medium' | 'high' | 'critical';
  relationships?: Relationship[];
  customFields?: Record<string, unknown>;
}

// Update contact input
export interface UpdateContactInput extends Partial<CreateContactInput> {
  id: string;
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
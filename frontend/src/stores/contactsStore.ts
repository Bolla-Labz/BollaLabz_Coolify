// Last Modified: 2025-11-24 12:25
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import contactsService, {
  type Contact as APIContact,
  type CreateContactDTO,
  type UpdateContactDTO,
  type SingleContactResponse,
} from '@/services/contactsService';
import { safePost, isSuccess } from '@/lib/api/client';
import { toast } from 'react-hot-toast';
import { websocketClient } from '@/lib/websocket/client';

// Frontend interface (used in UI)
export interface Contact {
  id: string;
  phone: string;
  email?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  avatar?: string;
  tags: string[];
  notes?: string;
  importance: 'high' | 'medium' | 'low';
  relationshipScore: number;
  lastContactDate: string;
  nextFollowUp?: string;
  conversationCount: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface ContactsFilter {
  search?: string;
  tags?: string[];
  importance?: Contact['importance'][];
  hasUpcomingFollowUp?: boolean;
  sortBy?: 'name' | 'lastContact' | 'score' | 'created';
  sortOrder?: 'asc' | 'desc';
}

interface ContactsState {
  // Data
  contacts: Contact[];
  selectedContact: Contact | null;
  isLoading: boolean;
  error: string | null;

  // Filters
  filters: ContactsFilter;

  // UI State
  isDetailOpen: boolean;
  selectedIds: Set<string>;

  // Actions
  fetchContacts: () => Promise<void>;
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Partial<Contact>) => Promise<void>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  deleteMultiple: (ids: string[]) => void;
  toggleFavorite: (id: string) => void;

  // Selection
  selectContact: (contact: Contact | null) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Filters
  setFilters: (filters: ContactsFilter) => void;
  clearFilters: () => void;

  // UI
  setDetailOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  getFilteredContacts: () => Contact[];
  getSelectedContacts: () => Contact[];

  // WebSocket
  initializeWebSocket: () => void;
}

// Helper function to convert API contact to frontend contact
function apiContactToFrontend(apiContact: APIContact): Contact {
  return {
    id: apiContact.id.toString(),
    phone: apiContact.phone_number,
    email: apiContact.contact_email,
    name: apiContact.contact_name,
    notes: apiContact.notes,
    conversationCount: apiContact.conversation_count,
    lastContactDate: apiContact.last_contact_date || new Date().toISOString(),
    createdAt: apiContact.created_at,
    updatedAt: apiContact.updated_at,
    // Default values for frontend-only fields
    tags: [],
    importance: 'medium',
    relationshipScore: 50,
    metadata: {},
  };
}

export const useContactsStore = create<ContactsState>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
      // Initial state
      contacts: [],
      selectedContact: null,
      isLoading: false,
      error: null,
      filters: {
        sortBy: 'name',
        sortOrder: 'asc',
      },
      isDetailOpen: false,
      selectedIds: new Set(),

      // Fetch contacts from API
      fetchContacts: async () => {
        set({ isLoading: true, error: null });
        try {
          const apiContacts = await contactsService.getAll();
          const frontendContacts = apiContacts.map(apiContactToFrontend);
          set({ contacts: frontendContacts, isLoading: false });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to fetch contacts';
          set({ error: message, isLoading: false });
          toast.error(message);
        }
      },

      // Actions
      setContacts: (contacts) => set({ contacts }),

      addContact: async (contact) => {
        set({ isLoading: true, error: null });

        // Use safe API call with Result pattern
        const result = await safePost<SingleContactResponse>('/v1/contacts', {
          phone_number: contact.phone || '',
          contact_name: contact.name || '',
          contact_email: contact.email,
          notes: contact.notes,
        });

        if (isSuccess(result)) {
          const apiContact = result.data.data;
          const frontendContact = apiContactToFrontend(apiContact);

          set((state) => ({
            contacts: [...state.contacts, frontendContact],
            isLoading: false,
          }));

          toast.success('Contact created successfully');
        } else {
          // Error already shown via toast in handleApiError
          set({
            isLoading: false,
            error: result.error.message
          });
          // Don't re-throw - let caller check state.error if needed
        }
      },

      updateContact: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const updateDTO: UpdateContactDTO = {
            contactName: updates.name,
            contactEmail: updates.email,
            notes: updates.notes,
          };

          const apiContact = await contactsService.update(
            parseInt(id),
            updateDTO
          );
          const frontendContact = apiContactToFrontend(apiContact);

          set((state) => ({
            contacts: state.contacts.map((c) =>
              c.id === id ? frontendContact : c
            ),
            selectedContact:
              state.selectedContact?.id === id
                ? frontendContact
                : state.selectedContact,
            isLoading: false,
          }));

          toast.success('Contact updated successfully');
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to update contact';
          set({ error: message, isLoading: false });
          toast.error(message);
          throw error;
        }
      },

      deleteContact: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await contactsService.delete(parseInt(id));

          set((state) => ({
            contacts: state.contacts.filter((c) => c.id !== id),
            selectedContact:
              state.selectedContact?.id === id ? null : state.selectedContact,
            selectedIds: new Set(
              [...state.selectedIds].filter((sid) => sid !== id)
            ),
            isLoading: false,
          }));

          toast.success('Contact deleted successfully');
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to delete contact';
          set({ error: message, isLoading: false });
          toast.error(message);
          throw error;
        }
      },

      deleteMultiple: (ids) =>
        set((state) => ({
          contacts: state.contacts.filter((c) => !ids.includes(c.id)),
          selectedContact:
            state.selectedContact && ids.includes(state.selectedContact.id)
              ? null
              : state.selectedContact,
          selectedIds: new Set(),
        })),

      toggleFavorite: (id) =>
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === id
              ? {
                  ...contact,
                  metadata: {
                    ...contact.metadata,
                    isFavorite: !contact.metadata?.isFavorite,
                  },
                }
              : contact
          ),
        })),

      // Selection
      selectContact: (contact) =>
        set({
          selectedContact: contact,
          isDetailOpen: !!contact,
        }),

      toggleSelection: (id) =>
        set((state) => {
          const newSet = new Set(state.selectedIds);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return { selectedIds: newSet };
        }),

      selectAll: () =>
        set((state) => ({
          selectedIds: new Set(state.contacts.map((c) => c.id)),
        })),

      clearSelection: () =>
        set({
          selectedIds: new Set(),
        }),

      // Filters
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      clearFilters: () =>
        set({
          filters: {
            sortBy: 'name',
            sortOrder: 'asc',
          },
        }),

      // UI
      setDetailOpen: (open) => set({ isDetailOpen: open }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Computed
      getFilteredContacts: () => {
        const { contacts, filters } = get();
        let filtered = [...contacts];

        // Apply search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(
            (contact) =>
              contact.name.toLowerCase().includes(searchLower) ||
              contact.phone.includes(searchLower) ||
              contact.email?.toLowerCase().includes(searchLower) ||
              contact.company?.toLowerCase().includes(searchLower) ||
              contact.tags.some((tag) => tag.toLowerCase().includes(searchLower))
          );
        }

        // Apply tag filter
        if (filters.tags?.length) {
          filtered = filtered.filter((contact) =>
            filters.tags!.some((tag) => contact.tags.includes(tag))
          );
        }

        // Apply importance filter
        if (filters.importance?.length) {
          filtered = filtered.filter((contact) =>
            filters.importance!.includes(contact.importance)
          );
        }

        // Apply upcoming follow-up filter
        if (filters.hasUpcomingFollowUp) {
          filtered = filtered.filter((contact) => contact.nextFollowUp);
        }

        // Apply sorting
        filtered.sort((a, b) => {
          let comparison = 0;

          switch (filters.sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'lastContact':
              comparison =
                new Date(b.lastContactDate).getTime() -
                new Date(a.lastContactDate).getTime();
              break;
            case 'score':
              comparison = b.relationshipScore - a.relationshipScore;
              break;
            case 'created':
              comparison =
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime();
              break;
          }

          return filters.sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
      },

      getSelectedContacts: () => {
        const { contacts, selectedIds } = get();
        return contacts.filter((c) => selectedIds.has(c.id));
      },

      // Initialize WebSocket listeners
      initializeWebSocket: () => {
        // Listen for contact created
        websocketClient.on('contact:created', (data) => {
          const { contact } = data;
          if (contact) {
            const frontendContact = apiContactToFrontend(contact);
            set((state) => ({
              contacts: [frontendContact, ...state.contacts],
            }));
            toast.success('New contact added');
          }
        });

        // Listen for contact updated
        websocketClient.on('contact:updated', (data) => {
          const { contact } = data;
          if (contact) {
            const frontendContact = apiContactToFrontend(contact);
            set((state) => ({
              contacts: state.contacts.map((c) =>
                c.id === frontendContact.id ? frontendContact : c
              ),
              selectedContact:
                state.selectedContact?.id === frontendContact.id
                  ? frontendContact
                  : state.selectedContact,
            }));
            toast.success('Contact updated');
          }
        });

        // Listen for contact deleted
        websocketClient.on('contact:deleted', (data) => {
          const { contactId } = data;
          if (contactId) {
            set((state) => ({
              contacts: state.contacts.filter((c) => c.id !== contactId.toString()),
              selectedContact:
                state.selectedContact?.id === contactId.toString()
                  ? null
                  : state.selectedContact,
            }));
            toast.success('Contact deleted');
          }
        });
      },
      }),
      {
        name: 'contacts-store',
      }
    )
  )
);

// Last Modified: 2025-11-23 17:30
/**
 * People Store
 *
 * Manages contacts, relationships, and interaction tracking including:
 * - Contact management (CRUD)
 * - Relationship scoring and tracking
 * - Interaction history
 * - Contact categorization and tagging
 * - Communication preferences
 * - Integration with phone/SMS contacts
 */

import { create } from 'zustand';
import { peopleService, type CreatePersonDTO, type UpdatePersonDTO } from '@/services/peopleService';
import type { PersonExtended, InteractionAnalytic } from '@/types/people-analytics';

// Re-export types from people-analytics for consistency
export type Person = PersonExtended;
export type Interaction = InteractionAnalytic;

export interface CreatePersonInput {
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  categories?: string[];
  tags?: string[];
  notes?: string;
}

export interface UpdatePersonInput {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  categories?: string[];
  tags?: string[];
  notes?: string;
  relationshipScore?: number;
  totalInteractions?: number;
  lastContactDate?: Date;
}

export interface PeopleFilters {
  categories?: string[];
  tags?: string[];
  minRelationshipScore?: number;
  maxRelationshipScore?: number;
  lastContactedWithin?: number; // days
  search?: string;
}

interface PeopleState {
  // Core Data
  people: Person[];
  interactions: Interaction[];
  selectedPerson: Person | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Filters
  filters: PeopleFilters;
  sortBy: 'fullName' | 'relationshipScore' | 'lastContactDate' | 'totalInteractions';
  sortOrder: 'asc' | 'desc';

  // Actions - Data Fetching
  fetchPeople: (filters?: PeopleFilters) => Promise<void>;
  fetchPersonById: (id: string) => Promise<void>;
  fetchInteractions: (personId: string) => Promise<void>;

  // Actions - Person CRUD
  createPerson: (input: CreatePersonInput) => Promise<Person | null>;
  updatePerson: (id: string, input: UpdatePersonInput) => Promise<Person | null>;
  deletePerson: (id: string) => Promise<boolean>;

  // Actions - Relationship Management
  updateRelationshipScore: (id: string, score: number) => Promise<boolean>;
  incrementInteractionCount: (id: string) => Promise<boolean>;
  updateLastContactDate: (id: string, date?: Date) => Promise<boolean>;

  // Actions - Categorization
  addCategory: (id: string, category: string) => Promise<boolean>;
  removeCategory: (id: string, category: string) => Promise<boolean>;
  addTag: (id: string, tag: string) => Promise<boolean>;
  removeTag: (id: string, tag: string) => Promise<boolean>;

  // Actions - Interactions
  addInteraction: (interaction: Omit<Interaction, 'id' | 'createdAt'>) => Promise<Interaction | null>;
  deleteInteraction: (id: string) => Promise<boolean>;

  // Actions - Bulk Operations
  bulkAddCategory: (ids: string[], category: string) => Promise<boolean>;
  bulkRemoveCategory: (ids: string[], category: string) => Promise<boolean>;
  bulkDelete: (ids: string[]) => Promise<boolean>;

  // Actions - Filters & Sorting
  setFilters: (filters: PeopleFilters) => void;
  setSorting: (sortBy: PeopleState['sortBy'], sortOrder: 'asc' | 'desc') => void;
  resetFilters: () => void;

  // Actions - Selection
  selectPerson: (person: Person | null) => void;

  // Actions - Utility
  clearError: () => void;
  reset: () => void;

  // Selectors (Derived State)
  getFilteredPeople: () => Person[];
  getSortedPeople: () => Person[];
  getPeopleByCategory: (category: string) => Person[];
  getPeopleByTag: (tag: string) => Person[];
  getTopContacts: (limit?: number) => Person[];
  getNeedingFollowUp: (days?: number) => Person[];
  getAllCategories: () => string[];
  getAllTags: () => string[];
  getInteractionsByPerson: (personId: string) => Interaction[];
}

// Default state
const defaultState = {
  people: [],
  interactions: [],
  selectedPerson: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  filters: {},
  sortBy: 'relationshipScore' as const,
  sortOrder: 'desc' as const,
};

export const usePeopleStore = create<PeopleState>((set, get) => ({
  ...defaultState,

  // ============================================================================
  // Data Fetching Actions
  // ============================================================================

  fetchPeople: async (filters?: PeopleFilters): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const apiFilters = filters ? {
        search: filters.search,
        tags: filters.tags,
        minRelationshipScore: filters.minRelationshipScore,
        maxRelationshipScore: filters.maxRelationshipScore,
      } : undefined;

      const peopleData = await peopleService.getPeople(apiFilters);

      // Person is now an alias for PersonExtended, no mapping needed
      set({ people: peopleData, isLoading: false, lastUpdated: new Date() });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch people';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchPersonById: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const person = get().people.find((p) => p.id === id);
      set({ selectedPerson: person || null, isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch person';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchInteractions: async (personId: string): Promise<void> => {
    try {
      const apiInteractions = await peopleService.getInteractions(personId);

      // Interaction is now an alias for InteractionAnalytic, no mapping needed
      set({ interactions: apiInteractions });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch interactions';
      set({ error: errorMessage });
    }
  },

  // ============================================================================
  // Person CRUD Actions
  // ============================================================================

  createPerson: async (input: CreatePersonInput): Promise<Person | null> => {
    set({ isLoading: true, error: null });
    try {
      const createDTO: CreatePersonDTO = {
        fullName: input.name,
        email: input.email,
        phone: input.phone,
        tags: input.tags || [],
        bio: input.notes,
      };

      const createdPerson = await peopleService.createPerson(createDTO);

      // Person is an alias for PersonExtended, so use the created object directly
      const newPerson: Person = createdPerson;

      set((state) => ({
        people: [...state.people, newPerson],
        isLoading: false,
      }));

      return newPerson;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create person';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  updatePerson: async (id: string, input: UpdatePersonInput): Promise<Person | null> => {
    set({ isLoading: true, error: null });
    try {
      const updateDTO: UpdatePersonDTO = {
        fullName: input.name,
        email: input.email,
        phone: input.phone,
        tags: input.tags,
        bio: input.notes,
        relationshipScore: input.relationshipScore,
      };

      const updatedPersonData = await peopleService.updatePerson(id, updateDTO);

      // Person is an alias for PersonExtended, so use the updated object directly
      const updatedPerson: Person = updatedPersonData;

      set((state) => ({
        people: state.people.map((p) => (p.id === id ? updatedPerson : p)),
        selectedPerson: state.selectedPerson?.id === id ? updatedPerson : state.selectedPerson,
        isLoading: false,
      }));

      return updatedPerson;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update person';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  deletePerson: async (id: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      await peopleService.deletePerson(id);

      set((state) => ({
        people: state.people.filter((p) => p.id !== id),
        interactions: state.interactions.filter((i) => i.personId !== id),
        selectedPerson: state.selectedPerson?.id === id ? null : state.selectedPerson,
        isLoading: false,
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete person';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // ============================================================================
  // Relationship Management Actions
  // ============================================================================

  updateRelationshipScore: async (id: string, score: number): Promise<boolean> => {
    const clampedScore = Math.max(0, Math.min(100, score));
    return (await get().updatePerson(id, { relationshipScore: clampedScore })) !== null;
  },

  incrementInteractionCount: async (id: string): Promise<boolean> => {
    const person = get().people.find((p) => p.id === id);
    if (!person) return false;

    return (
      (await get().updatePerson(id, {
        totalInteractions: person.totalInteractions + 1,
      })) !== null
    );
  },

  updateLastContactDate: async (id: string, date: Date = new Date()): Promise<boolean> => {
    return (await get().updatePerson(id, { lastContactDate: date })) !== null;
  },

  // ============================================================================
  // Categorization Actions
  // ============================================================================

  addCategory: async (id: string, category: string): Promise<boolean> => {
    // Categories are mapped to tags in PersonExtended
    const person = get().people.find((p) => p.id === id);
    if (!person) return false;

    const tags = [...(person.tags || []), category];
    return (await get().updatePerson(id, { tags })) !== null;
  },

  removeCategory: async (id: string, category: string): Promise<boolean> => {
    // Categories are mapped to tags in PersonExtended
    const person = get().people.find((p) => p.id === id);
    if (!person) return false;

    const tags = (person.tags || []).filter((c) => c !== category);
    return (await get().updatePerson(id, { tags })) !== null;
  },

  addTag: async (id: string, tag: string): Promise<boolean> => {
    const person = get().people.find((p) => p.id === id);
    if (!person) return false;

    const tags = [...(person.tags || []), tag];
    return (await get().updatePerson(id, { tags })) !== null;
  },

  removeTag: async (id: string, tag: string): Promise<boolean> => {
    const person = get().people.find((p) => p.id === id);
    if (!person) return false;

    const tags = (person.tags || []).filter((t) => t !== tag);
    return (await get().updatePerson(id, { tags })) !== null;
  },

  // ============================================================================
  // Interaction Actions
  // ============================================================================

  addInteraction: async (interaction: Omit<Interaction, 'id' | 'createdAt'>): Promise<Interaction | null> => {
    try {
      const newInteraction: Interaction = {
        ...interaction,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
      };

      set((state) => ({
        interactions: [newInteraction, ...state.interactions],
      }));

      // Update person's last contact date and interaction count
      await get().updateLastContactDate(interaction.personId, interaction.interactionDate);
      await get().incrementInteractionCount(interaction.personId);

      return newInteraction;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add interaction';
      set({ error: errorMessage });
      return null;
    }
  },

  deleteInteraction: async (id: string): Promise<boolean> => {
    try {
      set((state) => ({
        interactions: state.interactions.filter((i) => i.id !== id),
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete interaction';
      set({ error: errorMessage });
      return false;
    }
  },

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  bulkAddCategory: async (ids: string[], category: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        people: state.people.map((person) =>
          ids.includes(person.id)
            ? {
                ...person,
                tags: [...(person.tags || []), category],
                updatedAt: new Date(),
              }
            : person
        ),
        isLoading: false,
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk add category';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  bulkRemoveCategory: async (ids: string[], category: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        people: state.people.map((person) =>
          ids.includes(person.id)
            ? {
                ...person,
                tags: person.tags?.filter((c) => c !== category) || [],
                updatedAt: new Date(),
              }
            : person
        ),
        isLoading: false,
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk remove category';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  bulkDelete: async (ids: string[]): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        people: state.people.filter((person) => !ids.includes(person.id)),
        interactions: state.interactions.filter((i) => !ids.includes(i.personId)),
        selectedPerson: ids.includes(state.selectedPerson?.id || '') ? null : state.selectedPerson,
        isLoading: false,
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk delete';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // ============================================================================
  // Filter & Sorting Actions
  // ============================================================================

  setFilters: (filters: PeopleFilters): void => {
    set({ filters });
  },

  setSorting: (sortBy: PeopleState['sortBy'], sortOrder: 'asc' | 'desc'): void => {
    set({ sortBy, sortOrder });
  },

  resetFilters: (): void => {
    set({ filters: {} });
  },

  // ============================================================================
  // Selection Actions
  // ============================================================================

  selectPerson: (person: Person | null): void => {
    set({ selectedPerson: person });
  },

  // ============================================================================
  // Utility Actions
  // ============================================================================

  clearError: (): void => {
    set({ error: null });
  },

  reset: (): void => {
    set(defaultState);
  },

  // ============================================================================
  // Selectors (Derived State)
  // ============================================================================

  getFilteredPeople: (): Person[] => {
    const { people, filters } = get();

    return people.filter((person) => {
      // Categories filter (mapped to tags in PersonExtended)
      if (filters.categories?.length) {
        const hasCategory = filters.categories.some((cat) => person.tags?.includes(cat));
        if (!hasCategory) return false;
      }

      // Tags filter
      if (filters.tags?.length) {
        const hasTag = filters.tags.some((tag) => person.tags?.includes(tag));
        if (!hasTag) return false;
      }

      // Relationship score filter
      if (
        filters.minRelationshipScore !== undefined &&
        person.relationshipScore < filters.minRelationshipScore
      ) {
        return false;
      }
      if (
        filters.maxRelationshipScore !== undefined &&
        person.relationshipScore > filters.maxRelationshipScore
      ) {
        return false;
      }

      // Last contacted filter
      if (filters.lastContactedWithin !== undefined) {
        const daysSinceContact = Math.floor(
          (Date.now() - new Date(person.lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceContact > filters.lastContactedWithin) {
          return false;
        }
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = person.fullName.toLowerCase().includes(searchLower);
        const matchesEmail = person.email?.toLowerCase().includes(searchLower);
        const matchesPhone = person.phone?.includes(filters.search);
        const matchesCompany = person.company?.toLowerCase().includes(searchLower);

        if (!matchesName && !matchesEmail && !matchesPhone && !matchesCompany) {
          return false;
        }
      }

      return true;
    });
  },

  getSortedPeople: (): Person[] => {
    const { sortBy, sortOrder } = get();
    const filteredPeople = get().getFilteredPeople();

    return [...filteredPeople].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'fullName':
          comparison = a.fullName.localeCompare(b.fullName);
          break;
        case 'relationshipScore':
          comparison = a.relationshipScore - b.relationshipScore;
          break;
        case 'lastContactDate':
          comparison =
            new Date(a.lastContactDate || 0).getTime() - new Date(b.lastContactDate || 0).getTime();
          break;
        case 'totalInteractions':
          comparison = a.totalInteractions - b.totalInteractions;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  },

  getPeopleByCategory: (category: string): Person[] => {
    // Categories are mapped to tags in PersonExtended
    return get().getFilteredPeople().filter((person) => person.tags?.includes(category));
  },

  getPeopleByTag: (tag: string): Person[] => {
    return get().getFilteredPeople().filter((person) => person.tags?.includes(tag));
  },

  getTopContacts: (limit = 10): Person[] => {
    return [...get().getFilteredPeople()]
      .sort((a, b) => b.relationshipScore - a.relationshipScore)
      .slice(0, limit);
  },

  getNeedingFollowUp: (days = 30): Person[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return get()
      .getFilteredPeople()
      .filter((person) => person.lastContactDate && new Date(person.lastContactDate) < cutoffDate)
      .sort((a, b) => b.relationshipScore - a.relationshipScore);
  },

  getAllCategories: (): string[] => {
    // Categories are mapped to tags in PersonExtended
    const allCategories = get().people.flatMap((person) => person.tags || []);
    return Array.from(new Set(allCategories)).sort();
  },

  getAllTags: (): string[] => {
    const allTags = get().people.flatMap((person) => person.tags || []);
    return Array.from(new Set(allTags)).sort();
  },

  getInteractionsByPerson: (personId: string): Interaction[] => {
    return get()
      .interactions.filter((i) => i.personId === personId)
      .sort((a, b) => new Date(b.interactionDate).getTime() - new Date(a.interactionDate).getTime());
  },
}));

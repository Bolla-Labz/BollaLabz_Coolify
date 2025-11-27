// Last Modified: 2025-11-23 17:30
/**
 * Notes Store
 *
 * Manages note-taking functionality including:
 * - Note CRUD operations
 * - Note organization with folders
 * - Color coding and tagging
 * - Pinning and favoriting
 * - Search and filtering
 */

import { create } from 'zustand';
import { notesAPI } from '@/lib/api/store-adapter';
import {
  Note,
  NoteColor,
  CreateNoteInput,
  UpdateNoteInput,
  NoteFilters,
  NoteFolder,
} from '@/types/note';

interface NotesState {
  // Core Data
  notes: Note[];
  folders: NoteFolder[];
  selectedNote: Note | null;
  selectedFolder: NoteFolder | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Filters
  filters: NoteFilters;
  sortBy: 'createdAt' | 'updatedAt' | 'title';
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';

  // Actions - Data Fetching
  fetchNotes: (filters?: NoteFilters) => Promise<void>;
  fetchNoteById: (id: string) => Promise<void>;
  fetchFolders: () => Promise<void>;

  // Actions - Note CRUD
  createNote: (input: CreateNoteInput) => Promise<Note | null>;
  updateNote: (id: string, input: UpdateNoteInput) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<boolean>;
  duplicateNote: (id: string) => Promise<Note | null>;

  // Actions - Note Organization
  togglePin: (id: string) => Promise<boolean>;
  changeColor: (id: string, color: NoteColor) => Promise<boolean>;
  addTag: (id: string, tag: string) => Promise<boolean>;
  removeTag: (id: string, tag: string) => Promise<boolean>;
  moveToFolder: (id: string, folderId: string | null) => Promise<boolean>;

  // Actions - Folder Management
  createFolder: (name: string, color?: string, icon?: string) => Promise<NoteFolder | null>;
  updateFolder: (id: string, updates: Partial<NoteFolder>) => Promise<NoteFolder | null>;
  deleteFolder: (id: string) => Promise<boolean>;

  // Actions - Bulk Operations
  bulkDelete: (ids: string[]) => Promise<boolean>;
  bulkMoveToFolder: (ids: string[], folderId: string | null) => Promise<boolean>;
  bulkChangeColor: (ids: string[], color: NoteColor) => Promise<boolean>;

  // Actions - Filters & Sorting
  setFilters: (filters: NoteFilters) => void;
  setSorting: (sortBy: NotesState['sortBy'], sortOrder: 'asc' | 'desc') => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  resetFilters: () => void;

  // Actions - Selection
  selectNote: (note: Note | null) => void;
  selectFolder: (folder: NoteFolder | null) => void;

  // Actions - Utility
  clearError: () => void;
  reset: () => void;

  // Selectors (Derived State)
  getFilteredNotes: () => Note[];
  getSortedNotes: () => Note[];
  getPinnedNotes: () => Note[];
  getNotesByFolder: (folderId: string | null) => Note[];
  getNotesByColor: (color: NoteColor) => Note[];
  getNotesByTag: (tag: string) => Note[];
  getAllTags: () => string[];
}

// Default state
const defaultState = {
  notes: [],
  folders: [],
  selectedNote: null,
  selectedFolder: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  filters: {},
  sortBy: 'updatedAt' as const,
  sortOrder: 'desc' as const,
  viewMode: 'grid' as const,
};

export const useNotesStore = create<NotesState>((set, get) => ({
  ...defaultState,

  // ============================================================================
  // Data Fetching Actions
  // ============================================================================

  fetchNotes: async (filters?: NoteFilters): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // const response = await notesApi.getNotes(filters);
      // set({ notes: response.data, lastUpdated: new Date() });

      set({ notes: [], isLoading: false, lastUpdated: new Date() });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notes';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchNoteById: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const note = get().notes.find((n) => n.id === id);
      set({ selectedNote: note || null, isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch note';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchFolders: async (): Promise<void> => {
    try {
      // TODO: Replace with actual API call
      set({ folders: [] });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch folders';
      set({ error: errorMessage });
    }
  },

  // ============================================================================
  // Note CRUD Actions
  // ============================================================================

  createNote: async (input: CreateNoteInput): Promise<Note | null> => {
    set({ isLoading: true, error: null });
    try {
      const newNote: Note = {
        id: Math.random().toString(36).substr(2, 9),
        title: input.title,
        content: input.content || '',
        color: input.color || 'blue',
        isPinned: input.isPinned || false,
        isFavorite: input.isFavorite || false,
        isArchived: false,
        tags: input.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        folderId: input.folderId,
      };

      set((state) => ({
        notes: [newNote, ...state.notes],
        isLoading: false,
      }));

      return newNote;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create note';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  updateNote: async (id: string, input: UpdateNoteInput): Promise<Note | null> => {
    set({ isLoading: true, error: null });
    try {
      const note = get().notes.find((n) => n.id === id);
      if (!note) throw new Error('Note not found');

      const updatedNote: Note = {
        ...note,
        ...input,
        updatedAt: new Date(),
      };

      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
        selectedNote: state.selectedNote?.id === id ? updatedNote : state.selectedNote,
        isLoading: false,
      }));

      return updatedNote;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update note';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  deleteNote: async (id: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
        isLoading: false,
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete note';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  duplicateNote: async (id: string): Promise<Note | null> => {
    try {
      const note = get().notes.find((n) => n.id === id);
      if (!note) throw new Error('Note not found');

      return get().createNote({
        title: `${note.title} (Copy)`,
        content: note.content,
        color: note.color,
        isPinned: false,
        tags: note.tags,
        folderId: note.folderId,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate note';
      set({ error: errorMessage });
      return null;
    }
  },

  // ============================================================================
  // Note Organization Actions
  // ============================================================================

  togglePin: async (id: string): Promise<boolean> => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return false;

    return (await get().updateNote(id, { id, isPinned: !note.isPinned })) !== null;
  },

  changeColor: async (id: string, color: NoteColor): Promise<boolean> => {
    return (await get().updateNote(id, { id, color })) !== null;
  },

  addTag: async (id: string, tag: string): Promise<boolean> => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return false;

    const tags = [...(note.tags || []), tag];
    return (await get().updateNote(id, { id, tags })) !== null;
  },

  removeTag: async (id: string, tag: string): Promise<boolean> => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return false;

    const tags = (note.tags || []).filter((t) => t !== tag);
    return (await get().updateNote(id, { id, tags })) !== null;
  },

  moveToFolder: async (id: string, folderId: string | null): Promise<boolean> => {
    return (await get().updateNote(id, { id, folderId })) !== null;
  },

  // ============================================================================
  // Folder Management Actions
  // ============================================================================

  createFolder: async (name: string, color?: NoteColor, icon?: string): Promise<NoteFolder | null> => {
    set({ isLoading: true, error: null });
    try {
      const newFolder: NoteFolder = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        color,
        noteCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      set((state) => ({
        folders: [...state.folders, newFolder],
        isLoading: false,
      }));

      return newFolder;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create folder';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  updateFolder: async (id: string, updates: Partial<NoteFolder>): Promise<NoteFolder | null> => {
    set({ isLoading: true, error: null });
    try {
      const folder = get().folders.find((f) => f.id === id);
      if (!folder) throw new Error('Folder not found');

      const updatedFolder = { ...folder, ...updates };

      set((state) => ({
        folders: state.folders.map((f) => (f.id === id ? updatedFolder : f)),
        selectedFolder: state.selectedFolder?.id === id ? updatedFolder : state.selectedFolder,
        isLoading: false,
      }));

      return updatedFolder;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update folder';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  deleteFolder: async (id: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      // Move all notes from this folder to no folder
      set((state) => ({
        notes: state.notes.map((note) =>
          note.folderId === id ? { ...note, folderId: undefined } : note
        ),
        folders: state.folders.filter((f) => f.id !== id),
        selectedFolder: state.selectedFolder?.id === id ? null : state.selectedFolder,
        isLoading: false,
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete folder';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  bulkDelete: async (ids: string[]): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        notes: state.notes.filter((note) => !ids.includes(note.id)),
        selectedNote: ids.includes(state.selectedNote?.id || '') ? null : state.selectedNote,
        isLoading: false,
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk delete';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  bulkMoveToFolder: async (ids: string[], folderId: string | null): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        notes: state.notes.map((note) =>
          ids.includes(note.id) ? { ...note, folderId, updatedAt: new Date() } : note
        ),
        isLoading: false,
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk move';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  bulkChangeColor: async (ids: string[], color: NoteColor): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        notes: state.notes.map((note) =>
          ids.includes(note.id) ? { ...note, color, updatedAt: new Date() } : note
        ),
        isLoading: false,
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk change color';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // ============================================================================
  // Filter & Sorting Actions
  // ============================================================================

  setFilters: (filters: NoteFilters): void => {
    set({ filters });
  },

  setSorting: (sortBy: NotesState['sortBy'], sortOrder: 'asc' | 'desc'): void => {
    set({ sortBy, sortOrder });
  },

  setViewMode: (mode: 'grid' | 'list'): void => {
    set({ viewMode: mode });
  },

  resetFilters: (): void => {
    set({ filters: {} });
  },

  // ============================================================================
  // Selection Actions
  // ============================================================================

  selectNote: (note: Note | null): void => {
    set({ selectedNote: note });
  },

  selectFolder: (folder: NoteFolder | null): void => {
    set({ selectedFolder: folder });
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

  getFilteredNotes: (): Note[] => {
    const { notes, filters } = get();

    return notes.filter((note) => {
      // Color filter
      if (filters.colors?.length && !filters.colors.includes(note.color)) {
        return false;
      }

      // Tags filter
      if (filters.tags?.length) {
        const hasTag = filters.tags.some((tag) => note.tags?.includes(tag));
        if (!hasTag) return false;
      }

      // Pinned filter
      if (filters.isPinned !== undefined && note.isPinned !== filters.isPinned) {
        return false;
      }

      // Folder filter
      if (filters.folderId !== undefined && note.folderId !== filters.folderId) {
        return false;
      }

      // Search filter
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(searchLower);
        const matchesContent = note.content.toLowerCase().includes(searchLower);
        const matchesTags = note.tags?.some((tag) => tag.toLowerCase().includes(searchLower));

        if (!matchesTitle && !matchesContent && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  },

  getSortedNotes: (): Note[] => {
    const { sortBy, sortOrder } = get();
    const filteredNotes = get().getFilteredNotes();

    // Pinned notes always come first
    const pinned = filteredNotes.filter((n) => n.isPinned);
    const unpinned = filteredNotes.filter((n) => !n.isPinned);

    const sortFn = (a: Note, b: Note) => {
      let comparison = 0;

      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    };

    return [...pinned.sort(sortFn), ...unpinned.sort(sortFn)];
  },

  getPinnedNotes: (): Note[] => {
    return get().getFilteredNotes().filter((note) => note.isPinned);
  },

  getNotesByFolder: (folderId: string | null): Note[] => {
    return get().getFilteredNotes().filter((note) => note.folderId === folderId);
  },

  getNotesByColor: (color: NoteColor): Note[] => {
    return get().getFilteredNotes().filter((note) => note.color === color);
  },

  getNotesByTag: (tag: string): Note[] => {
    return get().getFilteredNotes().filter((note) => note.tags?.includes(tag));
  },

  getAllTags: (): string[] => {
    const allTags = get().notes.flatMap((note) => note.tags || []);
    return Array.from(new Set(allTags)).sort();
  },
}));

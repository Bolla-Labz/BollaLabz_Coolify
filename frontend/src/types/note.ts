// Last Modified: 2025-11-23 17:30
/**
 * Note Type Definitions
 *
 * Types for notes, note-taking, and organization
 */

export type NoteColor = 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  tags: string[];
  folderId?: string;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  attachments?: NoteAttachment[];
  reminders?: Date[];
  sharedWith?: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface NoteAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export interface NoteFolder {
  id: string;
  name: string;
  color?: NoteColor;
  parentId?: string;
  noteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  color?: NoteColor;
  tags?: string[];
  folderId?: string;
  isPinned?: boolean;
  isFavorite?: boolean;
  reminders?: Date[];
}

export interface UpdateNoteInput extends Partial<CreateNoteInput> {
  id: string;
  isArchived?: boolean;
}

export interface NoteFilters {
  folderId?: string;
  tags?: string[];
  colors?: NoteColor[];
  isPinned?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  searchQuery?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

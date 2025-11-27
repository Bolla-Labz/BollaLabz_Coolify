// Last Modified: 2025-11-24 16:55
/**
 * Filter Store - Zustand store for search filters and presets
 *
 * Philosophy: "Zero Cognitive Load" - Save filters once, reuse forever.
 * Users shouldn't have to rebuild complex filters repeatedly.
 *
 * Features:
 * - Save filter presets with names
 * - Share filters via URL parameters
 * - Default filters per user
 * - Filter templates library
 * - Quick filter buttons
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Filter condition types
 */
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty'
  | 'before'
  | 'after'
  | 'on'
  | 'is_true'
  | 'is_false';

export type FilterFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean' | 'tags';

export type FilterLogic = 'AND' | 'OR';

/**
 * Individual filter condition
 */
export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  fieldType: FilterFieldType;
}

/**
 * Filter group (conditions with AND/OR logic)
 */
export interface FilterGroup {
  id: string;
  logic: FilterLogic;
  conditions: FilterCondition[];
  groups?: FilterGroup[]; // Nested groups
}

/**
 * Saved filter preset
 */
export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  category: 'contacts' | 'conversations' | 'tasks' | 'events' | 'global';
  filter: FilterGroup;
  isDefault?: boolean;
  isPublic?: boolean; // Can be shared with other users
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

/**
 * Filter store state
 */
interface FilterState {
  // Active filters per category
  activeFilters: Record<string, FilterGroup | null>;

  // Saved presets
  presets: FilterPreset[];

  // Recently used filters
  recentFilters: string[]; // Preset IDs

  // Filter builder state (UI state)
  builderOpen: boolean;
  builderCategory: string | null;

  // Actions
  setActiveFilter: (category: string, filter: FilterGroup | null) => void;
  clearActiveFilter: (category: string) => void;
  savePreset: (preset: Omit<FilterPreset, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => FilterPreset;
  updatePreset: (id: string, updates: Partial<FilterPreset>) => void;
  deletePreset: (id: string) => void;
  applyPreset: (category: string, presetId: string) => void;
  getPresetsByCategory: (category: string) => FilterPreset[];
  getDefaultPreset: (category: string) => FilterPreset | null;
  setDefaultPreset: (category: string, presetId: string) => void;
  exportPreset: (presetId: string) => string;
  importPreset: (json: string) => FilterPreset | null;
  sharePreset: (presetId: string) => string; // Returns shareable URL
  openBuilder: (category: string) => void;
  closeBuilder: () => void;
  trackPresetUsage: (presetId: string) => void;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create filter store with persistence
 */
export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      activeFilters: {},
      presets: getDefaultPresets(),
      recentFilters: [],
      builderOpen: false,
      builderCategory: null,

      setActiveFilter: (category, filter) => {
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            [category]: filter,
          },
        }));
      },

      clearActiveFilter: (category) => {
        set((state) => {
          const { [category]: _, ...rest } = state.activeFilters;
          return { activeFilters: rest };
        });
      },

      savePreset: (preset) => {
        const newPreset: FilterPreset = {
          ...preset,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0,
        };

        set((state) => ({
          presets: [...state.presets, newPreset],
        }));

        return newPreset;
      },

      updatePreset: (id, updates) => {
        set((state) => ({
          presets: state.presets.map((preset) =>
            preset.id === id
              ? { ...preset, ...updates, updatedAt: new Date().toISOString() }
              : preset
          ),
        }));
      },

      deletePreset: (id) => {
        set((state) => ({
          presets: state.presets.filter((preset) => preset.id !== id),
          recentFilters: state.recentFilters.filter((fid) => fid !== id),
        }));
      },

      applyPreset: (category, presetId) => {
        const preset = get().presets.find((p) => p.id === presetId);
        if (!preset) return;

        get().setActiveFilter(category, preset.filter);
        get().trackPresetUsage(presetId);
      },

      getPresetsByCategory: (category) => {
        return get().presets.filter((p) => p.category === category || p.category === 'global');
      },

      getDefaultPreset: (category) => {
        const presets = get().getPresetsByCategory(category);
        return presets.find((p) => p.isDefault) || null;
      },

      setDefaultPreset: (category, presetId) => {
        set((state) => ({
          presets: state.presets.map((preset) => ({
            ...preset,
            isDefault:
              preset.category === category ? preset.id === presetId : preset.isDefault,
          })),
        }));
      },

      exportPreset: (presetId) => {
        const preset = get().presets.find((p) => p.id === presetId);
        if (!preset) return '';
        return JSON.stringify(preset, null, 2);
      },

      importPreset: (json) => {
        try {
          const preset = JSON.parse(json) as FilterPreset;
          // Generate new ID to avoid conflicts
          const imported = get().savePreset({
            ...preset,
            name: `${preset.name} (Imported)`,
          });
          return imported;
        } catch (error) {
          console.error('Failed to import preset:', error);
          return null;
        }
      },

      sharePreset: (presetId) => {
        const preset = get().presets.find((p) => p.id === presetId);
        if (!preset) return '';

        const encoded = encodeURIComponent(JSON.stringify(preset.filter));
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?filter=${encoded}&category=${preset.category}`;
      },

      openBuilder: (category) => {
        set({ builderOpen: true, builderCategory: category });
      },

      closeBuilder: () => {
        set({ builderOpen: false, builderCategory: null });
      },

      trackPresetUsage: (presetId) => {
        set((state) => {
          // Update usage count
          const presets = state.presets.map((preset) =>
            preset.id === presetId
              ? { ...preset, usageCount: preset.usageCount + 1 }
              : preset
          );

          // Add to recent filters (front of list)
          const recent = [presetId, ...state.recentFilters.filter((id) => id !== presetId)].slice(
            0,
            10
          );

          return { presets, recentFilters: recent };
        });
      },
    }),
    {
      name: 'bollalabz-filter-store',
      partialize: (state) => ({
        presets: state.presets,
        recentFilters: state.recentFilters,
      }),
    }
  )
);

/**
 * Default filter presets
 * Created on first load to provide useful examples
 */
function getDefaultPresets(): FilterPreset[] {
  const now = new Date().toISOString();

  return [
    // Contacts presets
    {
      id: 'preset-contacts-active',
      name: 'Active Contacts',
      description: 'Contacts with recent activity',
      category: 'contacts',
      filter: {
        id: 'root',
        logic: 'AND',
        conditions: [
          {
            id: 'c1',
            field: 'last_contacted',
            operator: 'after',
            value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
            fieldType: 'date',
          },
        ],
      },
      isDefault: false,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: 'preset-contacts-vip',
      name: 'VIP Contacts',
      description: 'Important contacts requiring attention',
      category: 'contacts',
      filter: {
        id: 'root',
        logic: 'OR',
        conditions: [
          {
            id: 'c1',
            field: 'tags',
            operator: 'contains',
            value: 'VIP',
            fieldType: 'tags',
          },
          {
            id: 'c2',
            field: 'importance',
            operator: 'equals',
            value: 'high',
            fieldType: 'select',
          },
        ],
      },
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: 'preset-contacts-no-email',
      name: 'Missing Email',
      description: 'Contacts without email addresses',
      category: 'contacts',
      filter: {
        id: 'root',
        logic: 'AND',
        conditions: [
          {
            id: 'c1',
            field: 'email',
            operator: 'is_empty',
            value: null,
            fieldType: 'text',
          },
        ],
      },
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },

    // Tasks presets
    {
      id: 'preset-tasks-urgent',
      name: 'Urgent Tasks',
      description: 'High priority tasks due soon',
      category: 'tasks',
      filter: {
        id: 'root',
        logic: 'AND',
        conditions: [
          {
            id: 'c1',
            field: 'priority',
            operator: 'in',
            value: ['urgent', 'high'],
            fieldType: 'select',
          },
          {
            id: 'c2',
            field: 'status',
            operator: 'not_equals',
            value: 'completed',
            fieldType: 'select',
          },
        ],
      },
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: 'preset-tasks-overdue',
      name: 'Overdue Tasks',
      description: 'Tasks past their due date',
      category: 'tasks',
      filter: {
        id: 'root',
        logic: 'AND',
        conditions: [
          {
            id: 'c1',
            field: 'due_date',
            operator: 'before',
            value: new Date().toISOString(),
            fieldType: 'date',
          },
          {
            id: 'c2',
            field: 'status',
            operator: 'not_equals',
            value: 'completed',
            fieldType: 'select',
          },
        ],
      },
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: 'preset-tasks-today',
      name: 'Due Today',
      description: 'Tasks due today',
      category: 'tasks',
      filter: {
        id: 'root',
        logic: 'AND',
        conditions: [
          {
            id: 'c1',
            field: 'due_date',
            operator: 'on',
            value: new Date().toISOString().split('T')[0],
            fieldType: 'date',
          },
        ],
      },
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: 'preset-tasks-unassigned',
      name: 'Unassigned',
      description: 'Tasks without assignees',
      category: 'tasks',
      filter: {
        id: 'root',
        logic: 'AND',
        conditions: [
          {
            id: 'c1',
            field: 'assignee',
            operator: 'is_empty',
            value: null,
            fieldType: 'text',
          },
        ],
      },
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },

    // Conversations presets
    {
      id: 'preset-conversations-unread',
      name: 'Unread Messages',
      description: 'Conversations with unread messages',
      category: 'conversations',
      filter: {
        id: 'root',
        logic: 'AND',
        conditions: [
          {
            id: 'c1',
            field: 'unread_count',
            operator: 'greater_than',
            value: 0,
            fieldType: 'number',
          },
        ],
      },
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: 'preset-conversations-recent',
      name: 'Recent Chats',
      description: 'Conversations from last 7 days',
      category: 'conversations',
      filter: {
        id: 'root',
        logic: 'AND',
        conditions: [
          {
            id: 'c1',
            field: 'last_message_at',
            operator: 'after',
            value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            fieldType: 'date',
          },
        ],
      },
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },

    // Events presets
    {
      id: 'preset-events-upcoming',
      name: 'Upcoming Events',
      description: 'Events in the next 7 days',
      category: 'events',
      filter: {
        id: 'root',
        logic: 'AND',
        conditions: [
          {
            id: 'c1',
            field: 'start_time',
            operator: 'between',
            value: [
              new Date().toISOString(),
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            ],
            fieldType: 'date',
          },
        ],
      },
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: 'preset-events-today',
      name: "Today's Events",
      description: 'All events scheduled for today',
      category: 'events',
      filter: {
        id: 'root',
        logic: 'AND',
        conditions: [
          {
            id: 'c1',
            field: 'start_time',
            operator: 'on',
            value: new Date().toISOString().split('T')[0],
            fieldType: 'date',
          },
        ],
      },
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
  ];
}

/**
 * Helper to apply filter conditions to data
 * Returns filtered array
 */
export function applyFilter<T extends Record<string, any>>(
  data: T[],
  filter: FilterGroup | null
): T[] {
  if (!filter) return data;

  return data.filter((item) => evaluateFilterGroup(item, filter));
}

/**
 * Evaluate filter group recursively
 */
function evaluateFilterGroup<T extends Record<string, any>>(
  item: T,
  group: FilterGroup
): boolean {
  const conditionResults = group.conditions.map((condition) =>
    evaluateCondition(item, condition)
  );

  const groupResults = group.groups?.map((subGroup) =>
    evaluateFilterGroup(item, subGroup)
  ) || [];

  const allResults = [...conditionResults, ...groupResults];

  if (group.logic === 'AND') {
    return allResults.every((result) => result);
  } else {
    return allResults.some((result) => result);
  }
}

/**
 * Evaluate single filter condition
 */
function evaluateCondition<T extends Record<string, any>>(
  item: T,
  condition: FilterCondition
): boolean {
  const fieldValue = item[condition.field];
  const { operator, value } = condition;

  switch (operator) {
    case 'equals':
      return fieldValue === value;

    case 'not_equals':
      return fieldValue !== value;

    case 'contains':
      return String(fieldValue || '').toLowerCase().includes(String(value).toLowerCase());

    case 'not_contains':
      return !String(fieldValue || '').toLowerCase().includes(String(value).toLowerCase());

    case 'starts_with':
      return String(fieldValue || '').toLowerCase().startsWith(String(value).toLowerCase());

    case 'ends_with':
      return String(fieldValue || '').toLowerCase().endsWith(String(value).toLowerCase());

    case 'greater_than':
      return Number(fieldValue) > Number(value);

    case 'less_than':
      return Number(fieldValue) < Number(value);

    case 'between':
      const [min, max] = value as [number | string, number | string];
      const numValue = Number(fieldValue);
      return numValue >= Number(min) && numValue <= Number(max);

    case 'in':
      return Array.isArray(value) && value.includes(fieldValue);

    case 'not_in':
      return Array.isArray(value) && !value.includes(fieldValue);

    case 'is_empty':
      return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);

    case 'is_not_empty':
      return !!fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0);

    case 'before':
      return new Date(fieldValue) < new Date(value);

    case 'after':
      return new Date(fieldValue) > new Date(value);

    case 'on':
      const itemDate = new Date(fieldValue).toISOString().split('T')[0];
      const compareDate = new Date(value).toISOString().split('T')[0];
      return itemDate === compareDate;

    case 'is_true':
      return fieldValue === true;

    case 'is_false':
      return fieldValue === false;

    default:
      return false;
  }
}

export default useFilterStore;

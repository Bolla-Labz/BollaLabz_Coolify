// Last Modified: 2025-11-24 16:58
/**
 * FilterBuilder Component - Visual Query Builder
 *
 * Philosophy: "Human-First Design" - Complex filters shouldn't require SQL knowledge.
 * Build powerful filters with drag-and-drop and visual controls.
 *
 * Features:
 * - Drag-and-drop filter conditions
 * - AND/OR logic groups
 * - Field types: text, number, date, select, boolean
 * - Visual query builder like Notion
 * - Export/Import filters as JSON
 * - Save as preset
 */

import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Save, Download, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useFilterStore, type FilterGroup, type FilterCondition, type FilterFieldType, type FilterOperator } from '@/stores/filterStore';
import { cn } from '@/lib/utils';

/**
 * Field definitions for each category
 */
const FIELD_DEFINITIONS: Record<
  string,
  Array<{ name: string; label: string; type: FilterFieldType }>
> = {
  contacts: [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'company', label: 'Company', type: 'text' },
    { name: 'tags', label: 'Tags', type: 'tags' },
    { name: 'importance', label: 'Importance', type: 'select' },
    { name: 'last_contacted', label: 'Last Contacted', type: 'date' },
  ],
  tasks: [
    { name: 'title', label: 'Title', type: 'text' },
    { name: 'description', label: 'Description', type: 'text' },
    { name: 'status', label: 'Status', type: 'select' },
    { name: 'priority', label: 'Priority', type: 'select' },
    { name: 'assignee', label: 'Assignee', type: 'text' },
    { name: 'tags', label: 'Tags', type: 'tags' },
    { name: 'due_date', label: 'Due Date', type: 'date' },
    { name: 'created_at', label: 'Created', type: 'date' },
  ],
  conversations: [
    { name: 'contact_name', label: 'Contact', type: 'text' },
    { name: 'last_message', label: 'Last Message', type: 'text' },
    { name: 'unread_count', label: 'Unread Count', type: 'number' },
    { name: 'tags', label: 'Tags', type: 'tags' },
    { name: 'last_message_at', label: 'Last Message At', type: 'date' },
  ],
  events: [
    { name: 'title', label: 'Title', type: 'text' },
    { name: 'description', label: 'Description', type: 'text' },
    { name: 'location', label: 'Location', type: 'text' },
    { name: 'attendees', label: 'Attendees', type: 'text' },
    { name: 'start_time', label: 'Start Time', type: 'date' },
    { name: 'end_time', label: 'End Time', type: 'date' },
  ],
};

/**
 * Operators for each field type
 */
const OPERATORS_BY_TYPE: Record<FilterFieldType, Array<{ value: FilterOperator; label: string }>> = {
  text: [
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  number: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'greater_than', label: 'greater than' },
    { value: 'less_than', label: 'less than' },
    { value: 'between', label: 'between' },
  ],
  date: [
    { value: 'on', label: 'on' },
    { value: 'before', label: 'before' },
    { value: 'after', label: 'after' },
    { value: 'between', label: 'between' },
  ],
  select: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'in', label: 'is any of' },
    { value: 'not_in', label: 'is none of' },
  ],
  boolean: [
    { value: 'is_true', label: 'is true' },
    { value: 'is_false', label: 'is false' },
  ],
  tags: [
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
  ],
};

interface FilterBuilderProps {
  category: string;
  initialFilter?: FilterGroup;
  onApply: (filter: FilterGroup) => void;
  onClose: () => void;
}

export function FilterBuilder({ category, initialFilter, onApply, onClose }: FilterBuilderProps) {
  const [filter, setFilter] = useState<FilterGroup>(
    initialFilter || {
      id: 'root',
      logic: 'AND',
      conditions: [],
      groups: [],
    }
  );

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  const { savePreset, exportPreset, importPreset } = useFilterStore();

  const fields = FIELD_DEFINITIONS[category] || [];

  /**
   * Add new condition
   */
  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: `cond-${Date.now()}`,
      field: fields[0]?.name || 'name',
      operator: 'contains',
      value: '',
      fieldType: fields[0]?.type || 'text',
    };

    setFilter({
      ...filter,
      conditions: [...filter.conditions, newCondition],
    });
  };

  /**
   * Update condition
   */
  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setFilter({
      ...filter,
      conditions: filter.conditions.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  };

  /**
   * Remove condition
   */
  const removeCondition = (id: string) => {
    setFilter({
      ...filter,
      conditions: filter.conditions.filter((c) => c.id !== id),
    });
  };

  /**
   * Toggle logic (AND/OR)
   */
  const toggleLogic = () => {
    setFilter({
      ...filter,
      logic: filter.logic === 'AND' ? 'OR' : 'AND',
    });
  };

  /**
   * Save as preset
   */
  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    savePreset({
      name: presetName,
      description: presetDescription,
      category: category as any,
      filter,
      isDefault: false,
      isPublic: false,
    });

    setShowSaveDialog(false);
    setPresetName('');
    setPresetDescription('');
  };

  /**
   * Export filter JSON
   */
  const handleExport = () => {
    const json = JSON.stringify(filter, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filter-${category}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Import filter JSON
   */
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setFilter(imported);
        } catch (error) {
          console.error('Failed to import filter:', error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Filter Builder</h3>
          <p className="text-sm text-muted-foreground">
            Create custom filters for {category}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
            <Save className="w-4 h-4 mr-2" />
            Save Preset
          </Button>
        </div>
      </div>

      {/* Logic toggle */}
      {filter.conditions.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Match</span>
          <Button variant="outline" size="sm" onClick={toggleLogic}>
            {filter.logic}
          </Button>
          <span className="text-sm text-muted-foreground">of the following:</span>
        </div>
      )}

      {/* Conditions */}
      <div className="space-y-2">
        {filter.conditions.map((condition, index) => (
          <ConditionRow
            key={condition.id}
            condition={condition}
            fields={fields}
            onUpdate={(updates) => updateCondition(condition.id, updates)}
            onRemove={() => removeCondition(condition.id)}
            showLogic={index > 0}
            logic={filter.logic}
          />
        ))}

        {filter.conditions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No filters applied. Click "Add Condition" to start building your filter.
          </div>
        )}
      </div>

      {/* Add condition button */}
      <Button variant="outline" onClick={addCondition} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Condition
      </Button>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            onApply(filter);
            onClose();
          }}
          disabled={filter.conditions.length === 0}
        >
          Apply Filter
        </Button>
      </div>

      {/* Save Preset Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g., High Priority Tasks"
              />
            </div>
            <div>
              <Label htmlFor="preset-description">Description (optional)</Label>
              <Textarea
                id="preset-description"
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                placeholder="Describe what this filter is for..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Single condition row
 */
interface ConditionRowProps {
  condition: FilterCondition;
  fields: Array<{ name: string; label: string; type: FilterFieldType }>;
  onUpdate: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
  showLogic: boolean;
  logic: 'AND' | 'OR';
}

function ConditionRow({
  condition,
  fields,
  onUpdate,
  onRemove,
  showLogic,
  logic,
}: ConditionRowProps) {
  const field = fields.find((f) => f.name === condition.field);
  const operators = field ? OPERATORS_BY_TYPE[field.type] : [];

  // Check if operator requires value input
  const needsValue = !['is_empty', 'is_not_empty', 'is_true', 'is_false'].includes(
    condition.operator
  );

  return (
    <div className="flex items-start gap-2 p-3 border rounded-lg bg-card">
      {showLogic && (
        <Badge variant="outline" className="mt-2">
          {logic}
        </Badge>
      )}

      <div className="flex-1 grid grid-cols-12 gap-2">
        {/* Field selector */}
        <div className="col-span-4">
          <Select
            value={condition.field}
            onValueChange={(value) => {
              const newField = fields.find((f) => f.name === value);
              if (newField) {
                onUpdate({
                  field: value,
                  fieldType: newField.type,
                  operator: OPERATORS_BY_TYPE[newField.type][0].value,
                  value: '',
                });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fields.map((f) => (
                <SelectItem key={f.name} value={f.name}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Operator selector */}
        <div className="col-span-3">
          <Select
            value={condition.operator}
            onValueChange={(value) => onUpdate({ operator: value as FilterOperator })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value input */}
        {needsValue && (
          <div className="col-span-5">
            <ValueInput
              fieldType={condition.fieldType}
              value={condition.value}
              onChange={(value) => onUpdate({ value })}
            />
          </div>
        )}
      </div>

      {/* Remove button */}
      <Button variant="ghost" size="icon" onClick={onRemove} className="mt-1">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

/**
 * Value input based on field type
 */
interface ValueInputProps {
  fieldType: FilterFieldType;
  value: any;
  onChange: (value: any) => void;
}

function ValueInput({ fieldType, value, onChange }: ValueInputProps) {
  switch (fieldType) {
    case 'text':
    case 'tags':
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter value..."
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder="Enter number..."
        />
      );

    case 'date':
      return (
        <Input
          type="date"
          value={value ? new Date(value).toISOString().split('T')[0] : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'select':
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter value..."
        />
      );

    case 'boolean':
      return null; // Boolean uses is_true/is_false operators, no value needed

    default:
      return null;
  }
}

export default FilterBuilder;

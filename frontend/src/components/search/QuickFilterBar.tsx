// Last Modified: 2025-11-24 16:59
/**
 * QuickFilterBar Component
 *
 * Philosophy: "Zero Cognitive Load" - Quick access to saved filters and search
 * without leaving the page you're on.
 *
 * Features:
 * - Quick filter presets dropdown
 * - Inline search input
 * - Filter indicator badges
 * - Clear filters button
 */

import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFilterStore } from '@/stores/filterStore';
import { cn } from '@/lib/utils';

interface QuickFilterBarProps {
  category: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterApply: (filterId: string | null) => void;
  currentFilterId?: string | null;
  onBuildFilter: () => void;
  placeholder?: string;
  className?: string;
}

export function QuickFilterBar({
  category,
  searchQuery,
  onSearchChange,
  onFilterApply,
  currentFilterId,
  onBuildFilter,
  placeholder = 'Search...',
  className = '',
}: QuickFilterBarProps) {
  const { getPresetsByCategory, applyPreset, trackPresetUsage } = useFilterStore();
  const presets = getPresetsByCategory(category);

  const currentPreset = currentFilterId
    ? presets.find((p) => p.id === currentFilterId)
    : null;

  const handlePresetSelect = (presetId: string) => {
    onFilterApply(presetId);
    applyPreset(category, presetId);
  };

  const handleClearFilter = () => {
    onFilterApply(null);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-8"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Presets Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            {currentPreset ? currentPreset.name : 'Filters'}
            {currentPreset && (
              <Badge variant="secondary" className="ml-1">
                Active
              </Badge>
            )}
            <ChevronDown className="w-3 h-3 ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Quick Filters</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {presets.length === 0 ? (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No saved filters yet
            </div>
          ) : (
            <>
              {presets.slice(0, 5).map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className={cn(
                    'cursor-pointer',
                    currentFilterId === preset.id && 'bg-accent'
                  )}
                >
                  <div className="flex-1">
                    <div className="font-medium">{preset.name}</div>
                    {preset.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {preset.description}
                      </div>
                    )}
                  </div>
                  {preset.isDefault && (
                    <Badge variant="outline" className="ml-2">
                      Default
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}

              {presets.length > 5 && (
                <DropdownMenuItem className="text-xs text-muted-foreground justify-center">
                  +{presets.length - 5} more filters
                </DropdownMenuItem>
              )}
            </>
          )}

          <DropdownMenuSeparator />

          {currentPreset && (
            <DropdownMenuItem onClick={handleClearFilter} className="text-destructive">
              <X className="w-4 h-4 mr-2" />
              Clear Filter
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={onBuildFilter}>
            <Filter className="w-4 h-4 mr-2" />
            Build Custom Filter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filter Indicator */}
      {currentPreset && (
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="gap-1">
            {currentPreset.name}
            <button
              onClick={handleClearFilter}
              className="hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        </div>
      )}
    </div>
  );
}

export default QuickFilterBar;

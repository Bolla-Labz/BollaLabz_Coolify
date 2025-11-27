// Last Modified: 2025-11-23 17:30
import React, { useState } from 'react';
import { useTasksStore, TaskStatus, TaskPriority, TaskFilter } from '../../stores/tasksStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { Calendar } from '../ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import {
  Filter,
  X,
  Search,
  CalendarIcon,
  User,
  Tag,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'backlog', label: 'Backlog', color: 'bg-gray-500' },
  { value: 'todo', label: 'To Do', color: 'bg-blue-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { value: 'done', label: 'Done', color: 'bg-green-500' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-500' }
];

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-gray-500' },
  { value: 'medium', label: 'Medium', color: 'text-blue-500' },
  { value: 'high', label: 'High', color: 'text-orange-500' },
  { value: 'critical', label: 'Critical', color: 'text-red-500' }
];

const assigneeOptions = [
  { id: '1', name: 'John Doe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
  { id: '2', name: 'Jane Smith', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' },
  { id: '3', name: 'Mike Johnson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' }
];

const tagOptions = [
  'frontend', 'backend', 'bug', 'feature',
  'enhancement', 'documentation', 'testing', 'urgent'
];

export function TaskFilters() {
  const { filter, setFilter, clearFilter, getFilteredTasks } = useTasksStore();
  const [localFilter, setLocalFilter] = useState<TaskFilter>(filter);
  const [isOpen, setIsOpen] = useState(false);

  const handleApplyFilter = () => {
    setFilter(localFilter);
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    setLocalFilter({});
    clearFilter();
  };

  const toggleStatus = (status: TaskStatus) => {
    const currentStatuses = localFilter.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    setLocalFilter({ ...localFilter, status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const togglePriority = (priority: TaskPriority) => {
    const currentPriorities = localFilter.priority || [];
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority];
    setLocalFilter({ ...localFilter, priority: newPriorities.length > 0 ? newPriorities : undefined });
  };

  const toggleAssignee = (assigneeId: string) => {
    const currentAssignees = localFilter.assigneeId || [];
    const newAssignees = currentAssignees.includes(assigneeId)
      ? currentAssignees.filter(a => a !== assigneeId)
      : [...currentAssignees, assigneeId];
    setLocalFilter({ ...localFilter, assigneeId: newAssignees.length > 0 ? newAssignees : undefined });
  };

  const toggleTag = (tag: string) => {
    const currentTags = localFilter.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    setLocalFilter({ ...localFilter, tags: newTags.length > 0 ? newTags : undefined });
  };

  const activeFilterCount = [
    localFilter.search,
    localFilter.status?.length,
    localFilter.priority?.length,
    localFilter.assigneeId?.length,
    localFilter.tags?.length,
    localFilter.dueDateRange
  ].filter(Boolean).length;

  const filteredTaskCount = getFilteredTasks().length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="w-4 h-4 mr-1" />
          Filter
          {activeFilterCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Tasks</SheetTitle>
          <SheetDescription>
            {filteredTaskCount} tasks match your filters
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Search */}
          <div>
            <Label htmlFor="search" className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4" />
              Search
            </Label>
            <Input
              id="search"
              placeholder="Search title or description..."
              value={localFilter.search || ''}
              onChange={(e) => setLocalFilter({ ...localFilter, search: e.target.value })}
            />
          </div>

          {/* Status Filter */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-green-500" />
              Status
            </Label>
            <div className="space-y-2">
              {statusOptions.map(option => (
                <div key={option.value} className="flex items-center gap-2">
                  <Checkbox
                    checked={localFilter.status?.includes(option.value) || false}
                    onCheckedChange={() => toggleStatus(option.value)}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div className={cn("w-3 h-3 rounded-full", option.color)} />
                    <span className="text-sm">{option.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" />
              Priority
            </Label>
            <div className="space-y-2">
              {priorityOptions.map(option => (
                <div key={option.value} className="flex items-center gap-2">
                  <Checkbox
                    checked={localFilter.priority?.includes(option.value) || false}
                    onCheckedChange={() => togglePriority(option.value)}
                  />
                  <span className={cn("text-sm flex-1", option.color)}>
                    {option.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Assignee Filter */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4" />
              Assignee
            </Label>
            <div className="space-y-2">
              {assigneeOptions.map(assignee => (
                <div key={assignee.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={localFilter.assigneeId?.includes(assignee.id) || false}
                    onCheckedChange={() => toggleAssignee(assignee.id)}
                  />
                  <span className="text-sm flex-1">{assignee.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4" />
              Tags
            </Label>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map(tag => (
                <Badge
                  key={tag}
                  variant={localFilter.tags?.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Due Date Range */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <CalendarIcon className="w-4 h-4" />
              Due Date Range
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilter.dueDateRange?.start ? (
                      format(localFilter.dueDateRange.start, "PP")
                    ) : (
                      <span>Start date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={localFilter.dueDateRange?.start}
                    onSelect={(date) => {
                      if (date) {
                        setLocalFilter({
                          ...localFilter,
                          dueDateRange: {
                            start: date,
                            end: localFilter.dueDateRange?.end || date
                          }
                        });
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilter.dueDateRange?.end ? (
                      format(localFilter.dueDateRange.end, "PP")
                    ) : (
                      <span>End date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={localFilter.dueDateRange?.end}
                    onSelect={(date) => {
                      if (date) {
                        setLocalFilter({
                          ...localFilter,
                          dueDateRange: {
                            start: localFilter.dueDateRange?.start || date,
                            end: date
                          }
                        });
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {localFilter.dueDateRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocalFilter({ ...localFilter, dueDateRange: undefined })}
                className="mt-2"
              >
                <X className="w-3 h-3 mr-1" />
                Clear dates
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleApplyFilter} className="flex-1">
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleClearFilter}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {localFilter.search && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {localFilter.search}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setLocalFilter({ ...localFilter, search: undefined })}
                    />
                  </Badge>
                )}
                {localFilter.status?.map(status => (
                  <Badge key={status} variant="secondary" className="gap-1">
                    {statusOptions.find(s => s.value === status)?.label}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => toggleStatus(status)}
                    />
                  </Badge>
                ))}
                {localFilter.priority?.map(priority => (
                  <Badge key={priority} variant="secondary" className="gap-1">
                    {priorityOptions.find(p => p.value === priority)?.label}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => togglePriority(priority)}
                    />
                  </Badge>
                ))}
                {localFilter.assigneeId?.map(id => (
                  <Badge key={id} variant="secondary" className="gap-1">
                    {assigneeOptions.find(a => a.id === id)?.name}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => toggleAssignee(id)}
                    />
                  </Badge>
                ))}
                {localFilter.tags?.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    />
                  </Badge>
                ))}
                {localFilter.dueDateRange && (
                  <Badge variant="secondary" className="gap-1">
                    Due: {format(localFilter.dueDateRange.start, 'MMM d')} - {format(localFilter.dueDateRange.end, 'MMM d')}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setLocalFilter({ ...localFilter, dueDateRange: undefined })}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
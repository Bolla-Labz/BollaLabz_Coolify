// Last Modified: 2025-11-24 00:00
import React, { useState, useEffect, useDeferredValue, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useTasksStore, TaskStatus, Task } from '../../stores/tasksStore';
import { TaskCard } from './TaskCard';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Plus, Filter, MoreVertical, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';

interface Column {
  id: TaskStatus;
  title: string;
  color: string;
  limit?: number;
}

const columns: Column[] = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-500' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-500', limit: 10 },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-500', limit: 5 },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
  { id: 'blocked', title: 'Blocked', color: 'bg-red-500' }
];

export function TaskBoard() {
  const {
    tasks,
    getTasksByStatus,
    moveTask,
    addTask,
    bulkUpdateStatus,
    bulkDelete
  } = useTasksStore();
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isCreatingTask, setIsCreatingTask] = useState<TaskStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Defer search query for smooth filtering
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isPendingSearch = searchQuery !== deferredSearchQuery;

  // Filter tasks using deferred search term
  const filteredTasks = useMemo(() => {
    if (!deferredSearchQuery.trim()) {
      return tasks;
    }

    const lowerCaseQuery = deferredSearchQuery.toLowerCase();
    return tasks.filter(task =>
      task.title.toLowerCase().includes(lowerCaseQuery) ||
      task.description?.toLowerCase().includes(lowerCaseQuery) ||
      task.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))
    );
  }, [tasks, deferredSearchQuery]);

  // Get filtered tasks by status
  const getFilteredTasksByStatus = (status: TaskStatus): Task[] => {
    return filteredTasks
      .filter(task => task.status === status)
      .sort((a, b) => (a.columnOrder ?? 0) - (b.columnOrder ?? 0));
  };

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    moveTask(draggableId, newStatus, destination.index);
  };

  // Handle quick task creation
  const handleQuickCreate = (status: TaskStatus) => {
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle,
      status,
      priority: 'medium',
      tags: [],
      columnOrder: getTasksByStatus(status).length
    });

    setNewTaskTitle('');
    setIsCreatingTask(null);
  };

  // Handle task selection for bulk operations
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Handle bulk operations
  const handleBulkMove = (status: TaskStatus) => {
    if (selectedTasks.length === 0) return;
    bulkUpdateStatus(selectedTasks, status);
    setSelectedTasks([]);
  };

  const handleBulkDelete = () => {
    if (selectedTasks.length === 0) return;
    if (window.confirm(`Delete ${selectedTasks.length} tasks?`)) {
      bulkDelete(selectedTasks);
      setSelectedTasks([]);
    }
  };

  // Get column statistics (uses filtered tasks)
  const getColumnStats = (status: TaskStatus) => {
    const columnTasks = getFilteredTasksByStatus(status);
    const column = columns.find(c => c.id === status);
    const totalTasks = getTasksByStatus(status).length;
    return {
      count: columnTasks.length,
      totalCount: totalTasks,
      limit: column?.limit,
      isOverLimit: column?.limit ? totalTasks > column.limit : false,
      isFiltered: columnTasks.length !== totalTasks
    };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Board Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Task Board</h2>
          {selectedTasks.length > 0 && (
            <span className="px-2 py-1 bg-primary/10 text-primary text-sm rounded-md">
              {selectedTasks.length} selected
            </span>
          )}
          {isPendingSearch && (
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
              Filtering...
            </span>
          )}
        </div>

        {selectedTasks.length > 0 ? (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Move to...
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {columns.map(column => (
                  <DropdownMenuItem
                    key={column.id}
                    onClick={() => handleBulkMove(column.id)}
                  >
                    {column.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              Delete Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTasks([])}
            >
              Clear Selection
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 h-full min-w-fit px-4 pb-4">
            {columns.map(column => {
              const columnTasks = getFilteredTasksByStatus(column.id);
              const stats = getColumnStats(column.id);

              return (
                <div
                  key={column.id}
                  className="flex flex-col w-80 bg-background/50 rounded-lg border"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between p-3 border-b">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", column.color)} />
                      <h3 className="font-medium">{column.title}</h3>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        stats.isOverLimit
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : stats.isFiltered
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {stats.count}
                        {stats.isFiltered && ` of ${stats.totalCount}`}
                        {!stats.isFiltered && stats.limit && ` / ${stats.limit}`}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsCreatingTask(column.id)}>
                          Add task
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Clear column</DropdownMenuItem>
                        <DropdownMenuItem>Set WIP limit</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Quick Add Task */}
                  {isCreatingTask === column.id && (
                    <div className="p-3 border-b">
                      <input
                        type="text"
                        placeholder="Task title..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleQuickCreate(column.id);
                          } else if (e.key === 'Escape') {
                            setIsCreatingTask(null);
                            setNewTaskTitle('');
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => handleQuickCreate(column.id)}
                          disabled={!newTaskTitle.trim()}
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsCreatingTask(null);
                            setNewTaskTitle('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Tasks */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <ScrollArea
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "flex-1 p-2",
                          snapshot.isDraggingOver && "bg-accent/50"
                        )}
                      >
                        {columnTasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "mb-2",
                                  snapshot.isDragging && "opacity-50"
                                )}
                              >
                                <TaskCard
                                  task={task}
                                  isSelected={selectedTasks.includes(task.id)}
                                  onSelect={() => toggleTaskSelection(task.id)}
                                  isDragging={snapshot.isDragging}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </ScrollArea>
                    )}
                  </Droppable>

                  {/* Add Task Button */}
                  {!isCreatingTask && (
                    <button
                      onClick={() => setIsCreatingTask(column.id)}
                      className="flex items-center gap-2 w-full p-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border-t"
                    >
                      <Plus className="w-4 h-4" />
                      Add task
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
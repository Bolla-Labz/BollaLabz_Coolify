"use client";

import { useState, useMemo } from "react";
import type { Task, TaskPriority, TaskStatus } from "@repo/types";
import { TaskItem } from "./task-item";

// Icons
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

interface TaskListProps {
  tasks?: Task[];
  loading?: boolean;
  onToggleComplete?: (taskId: string) => void;
  onEdit?: (task: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
}

type SortField = "dueDate" | "priority" | "createdAt" | "title";
type SortOrder = "asc" | "desc";

const statusOptions: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const priorityOptions: { value: TaskPriority | "all"; label: string }[] = [
  { value: "all", label: "All Priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

// Mock data for demonstration (using valid TaskStatus: todo, in_progress, done)
const mockTasks: Partial<Task>[] = [
  {
    id: "1",
    userId: "user1",
    title: "Review quarterly financial report",
    description: "Analyze Q4 projections and prepare summary for board meeting",
    status: "in_progress",
    priority: "high",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    tags: ["finance", "review", "board"],
    progress: 65,
    projectName: "Q4 Planning",
    createdBy: "user1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "2",
    userId: "user1",
    title: "Call John Smith about project timeline",
    description: "Discuss revised milestones and resource allocation",
    status: "todo",
    priority: "high",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    tags: ["call", "client", "project"],
    createdBy: "user1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "3",
    userId: "user1",
    title: "Prepare presentation for stakeholder meeting",
    description: "Create slides covering project progress and next steps",
    status: "todo",
    priority: "medium",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    tags: ["presentation", "stakeholders"],
    progress: 20,
    projectName: "Product Launch",
    createdBy: "user1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "4",
    userId: "user1",
    title: "Update project documentation",
    description: "Document new API endpoints and update README",
    status: "todo",
    priority: "low",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    tags: ["docs", "api"],
    createdBy: "user1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "5",
    userId: "user1",
    title: "Fix authentication bug in mobile app",
    description: "Users are experiencing login issues on iOS devices",
    status: "in_progress",
    priority: "high",
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Overdue
    tags: ["bug", "mobile", "auth"],
    createdBy: "user1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "6",
    userId: "user1",
    title: "Weekly team sync",
    description: "Regular weekly meeting to discuss progress and blockers",
    status: "done",
    priority: "medium",
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    tags: ["meeting", "team"],
    createdBy: "user1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

const priorityOrder: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function TaskList({
  tasks,
  loading = false,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "all">("all");
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | "all">("all");
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);

  const displayTasks = tasks || mockTasks;

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...displayTasks];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
          task.projectName?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      result = result.filter((task) => task.status === selectedStatus);
    }

    // Filter by priority
    if (selectedPriority !== "all") {
      result = result.filter((task) => task.priority === selectedPriority);
    }

    // Filter done if hidden
    if (!showCompleted) {
      result = result.filter((task) => task.status !== "done");
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "dueDate":
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          comparison = aDate - bDate;
          break;
        case "priority":
          comparison =
            priorityOrder[b.priority as TaskPriority] -
            priorityOrder[a.priority as TaskPriority];
          break;
        case "createdAt":
          const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = bCreated - aCreated;
          break;
        case "title":
          comparison = (a.title || "").localeCompare(b.title || "");
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [displayTasks, searchQuery, selectedStatus, selectedPriority, sortField, sortOrder, showCompleted]);

  // Group tasks by status for better organization
  const groupedTasks = useMemo(() => {
    const overdue = filteredAndSortedTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate).getTime() < Date.now() &&
        t.status !== "done"
    );
    const today = filteredAndSortedTasks.filter(
      (t) =>
        t.dueDate &&
        !overdue.includes(t) &&
        new Date(t.dueDate).toDateString() === new Date().toDateString() &&
        t.status !== "done"
    );
    const upcoming = filteredAndSortedTasks.filter(
      (t) =>
        !overdue.includes(t) &&
        !today.includes(t) &&
        t.status !== "done"
    );
    const completed = filteredAndSortedTasks.filter((t) => t.status === "done");

    return { overdue, today, upcoming, completed };
  }, [filteredAndSortedTasks]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted rounded-lg animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-muted rounded mb-2" />
                  <div className="h-3 w-full bg-muted rounded mb-2" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-lg border border-input hover:bg-muted transition-colors ${
              showFilters || selectedStatus !== "all" || selectedPriority !== "all"
                ? "bg-primary/10 border-primary/20 text-primary"
                : ""
            }`}
            title="Filters"
          >
            <FilterIcon className="h-4 w-4" />
          </button>

          {/* Sort button */}
          <select
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-") as [SortField, SortOrder];
              setSortField(field);
              setSortOrder(order);
            }}
            className="px-3 py-2.5 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="dueDate-asc">Due Date (Soonest)</option>
            <option value="dueDate-desc">Due Date (Latest)</option>
            <option value="priority-desc">Priority (Highest)</option>
            <option value="priority-asc">Priority (Lowest)</option>
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>

          {/* Add task button */}
          <a
            href="/dashboard/tasks/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Add Task</span>
          </a>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="p-4 bg-card rounded-lg border border-border animate-fade-in">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as TaskStatus | "all")}
                className="px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Priority
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as TaskPriority | "all")}
                className="px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">Show completed</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredAndSortedTasks.length} task{filteredAndSortedTasks.length !== 1 ? "s" : ""}
        {searchQuery && ` matching "${searchQuery}"`}
      </p>

      {/* Task groups */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">No tasks found</p>
          {searchQuery || selectedStatus !== "all" || selectedPriority !== "all" ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("all");
                setSelectedPriority("all");
              }}
              className="text-primary hover:underline text-sm mt-2"
            >
              Clear filters
            </button>
          ) : (
            <a
              href="/dashboard/tasks/new"
              className="text-primary hover:underline text-sm mt-2 inline-block"
            >
              Create your first task
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue section */}
          {groupedTasks.overdue.length > 0 && (
            <TaskSection
              title="Overdue"
              count={groupedTasks.overdue.length}
              variant="destructive"
              tasks={groupedTasks.overdue}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}

          {/* Today section */}
          {groupedTasks.today.length > 0 && (
            <TaskSection
              title="Due Today"
              count={groupedTasks.today.length}
              variant="warning"
              tasks={groupedTasks.today}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}

          {/* Upcoming section */}
          {groupedTasks.upcoming.length > 0 && (
            <TaskSection
              title="Upcoming"
              count={groupedTasks.upcoming.length}
              tasks={groupedTasks.upcoming}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}

          {/* Completed section */}
          {showCompleted && groupedTasks.completed.length > 0 && (
            <TaskSection
              title="Completed"
              count={groupedTasks.completed.length}
              variant="muted"
              tasks={groupedTasks.completed}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              defaultCollapsed
            />
          )}
        </div>
      )}
    </div>
  );
}

// Task section component
interface TaskSectionProps {
  title: string;
  count: number;
  variant?: "default" | "destructive" | "warning" | "muted";
  tasks: Partial<Task>[];
  onToggleComplete?: (taskId: string) => void;
  onEdit?: (task: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
  defaultCollapsed?: boolean;
}

function TaskSection({
  title,
  count,
  variant = "default",
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  defaultCollapsed = false,
}: TaskSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const headerColor =
    variant === "destructive"
      ? "text-destructive"
      : variant === "warning"
      ? "text-warning"
      : variant === "muted"
      ? "text-muted-foreground"
      : "text-foreground";

  return (
    <div>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 mb-3 w-full text-left"
      >
        <svg
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isCollapsed ? "" : "rotate-90"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
        <h2 className={`font-semibold ${headerColor}`}>{title}</h2>
        <span className="text-sm text-muted-foreground">({count})</span>
      </button>

      {!isCollapsed && (
        <div className="space-y-3 animate-fade-in">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

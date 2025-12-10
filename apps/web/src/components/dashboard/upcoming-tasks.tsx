"use client";

import Link from "next/link";
import type { Task, TaskPriority, TaskStatus } from "@repo/types";

// Icons
const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const CircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

interface UpcomingTasksProps {
  tasks?: Task[];
  loading?: boolean;
  limit?: number;
  onToggleComplete?: (taskId: string) => void;
}

// Mock data for demonstration (using valid TaskStatus: todo, in_progress, done)
const mockTasks: Partial<Task>[] = [
  {
    id: "1",
    title: "Review quarterly report",
    status: "todo" as TaskStatus,
    priority: "high" as TaskPriority,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours from now
    tags: ["finance", "review"],
  },
  {
    id: "2",
    title: "Call John Smith about project",
    status: "in_progress" as TaskStatus,
    priority: "high" as TaskPriority,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(), // 4 hours from now
    tags: ["call", "project"],
  },
  {
    id: "3",
    title: "Prepare presentation slides",
    status: "todo" as TaskStatus,
    priority: "medium" as TaskPriority,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
    tags: ["presentation"],
  },
  {
    id: "4",
    title: "Update documentation",
    status: "todo" as TaskStatus,
    priority: "low" as TaskPriority,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), // 2 days from now
    tags: ["docs"],
  },
];

function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case "high":
      return "text-destructive";
    case "medium":
      return "text-warning";
    case "low":
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
}

function getPriorityBg(priority: TaskPriority): string {
  switch (priority) {
    case "high":
      return "bg-destructive/10";
    case "medium":
      return "bg-warning/10";
    case "low":
      return "bg-muted";
    default:
      return "bg-muted";
  }
}

function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    return "Overdue";
  } else if (diffHours < 1) {
    return "Due soon";
  } else if (diffHours < 24) {
    return `Due in ${diffHours}h`;
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else {
    return `In ${diffDays} days`;
  }
}

function isDueSoon(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours < 4 && diffMs >= 0;
}

function isOverdue(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date.getTime() < now.getTime();
}

export function UpcomingTasks({
  tasks,
  loading = false,
  limit = 4,
  onToggleComplete,
}: UpcomingTasksProps) {
  const displayTasks = tasks || mockTasks.slice(0, limit);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-card-foreground">Upcoming Tasks</h2>
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-5 w-5 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 w-48 bg-muted rounded mb-2" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-card-foreground">Upcoming Tasks</h2>
        <Link
          href="/dashboard/tasks"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View all
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {displayTasks.map((task) => {
          const completed = task.status === "done";
          const overdue = task.dueDate && isOverdue(task.dueDate);
          const dueSoon = task.dueDate && isDueSoon(task.dueDate);

          return (
            <div
              key={task.id}
              className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
            >
              {/* Checkbox */}
              <button
                onClick={() => onToggleComplete?.(task.id || "")}
                className={`mt-0.5 flex-shrink-0 ${
                  completed
                    ? "text-success"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {completed ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : (
                  <CircleIcon className="h-5 w-5" />
                )}
              </button>

              {/* Task info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/dashboard/tasks?id=${task.id}`}
                  className={`text-sm font-medium block ${
                    completed
                      ? "text-muted-foreground line-through"
                      : "text-card-foreground"
                  }`}
                >
                  {task.title}
                </Link>

                <div className="flex items-center gap-2 mt-1">
                  {/* Priority badge */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBg(
                      task.priority as TaskPriority
                    )} ${getPriorityColor(task.priority as TaskPriority)}`}
                  >
                    {task.priority}
                  </span>

                  {/* Due date */}
                  {task.dueDate && (
                    <span
                      className={`text-xs flex items-center gap-1 ${
                        overdue
                          ? "text-destructive"
                          : dueSoon
                          ? "text-warning"
                          : "text-muted-foreground"
                      }`}
                    >
                      <ClockIcon className="h-3 w-3" />
                      {formatDueDate(task.dueDate)}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {task.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {task.tags.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{task.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {displayTasks.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <p>No upcoming tasks</p>
          <Link
            href="/dashboard/tasks/new"
            className="text-primary hover:underline text-sm mt-2 inline-block"
          >
            Create your first task
          </Link>
        </div>
      )}
    </div>
  );
}

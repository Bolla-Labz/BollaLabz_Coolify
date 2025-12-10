"use client";

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

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

const EllipsisIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
  </svg>
);

interface TaskItemProps {
  task: Partial<Task>;
  onToggleComplete?: (taskId: string) => void;
  onEdit?: (task: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
  variant?: "default" | "compact";
}

function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case "high":
      return "text-destructive border-destructive";
    case "medium":
      return "text-warning border-warning";
    case "low":
      return "text-muted-foreground border-muted-foreground";
    default:
      return "text-muted-foreground border-muted-foreground";
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

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case "done":
      return "bg-success/10 text-success";
    case "in_progress":
      return "bg-primary/10 text-primary";
    case "todo":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 0) return "Due today";
    if (absDays === 1) return "1 day overdue";
    return `${absDays} days overdue`;
  } else if (diffHours < 1) {
    return "Due soon";
  } else if (diffHours < 24) {
    return `Due in ${diffHours}h`;
  } else if (diffDays === 1) {
    return "Due tomorrow";
  } else if (diffDays < 7) {
    return `Due in ${diffDays} days`;
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

function isOverdue(dateString: string): boolean {
  return new Date(dateString).getTime() < Date.now();
}

function isDueSoon(dateString: string): boolean {
  const date = new Date(dateString);
  const diffMs = date.getTime() - Date.now();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours < 24 && diffMs >= 0;
}

export function TaskItem({
  task,
  onToggleComplete,
  variant = "default",
}: TaskItemProps) {
  const isCompleted = task.status === "done";
  const overdue = task.dueDate && isOverdue(task.dueDate) && !isCompleted;
  const dueSoon = task.dueDate && isDueSoon(task.dueDate) && !isCompleted;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete?.(task.id || "")}
          className={`flex-shrink-0 ${
            isCompleted
              ? "text-success"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          {isCompleted ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <CircleIcon className="h-5 w-5" />
          )}
        </button>

        {/* Title */}
        <span
          className={`flex-1 text-sm truncate ${
            isCompleted ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {task.title}
        </span>

        {/* Priority indicator */}
        <div
          className={`h-2 w-2 rounded-full flex-shrink-0 ${getPriorityBg(
            task.priority as TaskPriority
          )}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`bg-card rounded-xl border p-4 hover:shadow-md transition-all ${
        overdue
          ? "border-destructive/50"
          : dueSoon
          ? "border-warning/50"
          : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete?.(task.id || "")}
          className={`mt-0.5 flex-shrink-0 ${
            isCompleted
              ? "text-success"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          {isCompleted ? (
            <CheckCircleIcon className="h-6 w-6" />
          ) : (
            <CircleIcon className="h-6 w-6" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className={`font-medium ${
              isCompleted ? "text-muted-foreground line-through" : "text-foreground"
            }`}
          >
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {/* Priority badge */}
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBg(
                task.priority as TaskPriority
              )} ${getPriorityColor(task.priority as TaskPriority)}`}
            >
              {task.priority}
            </span>

            {/* Status badge (if not todo) */}
            {task.status && task.status !== "todo" && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(
                  task.status as TaskStatus
                )}`}
              >
                {task.status.replace("_", " ")}
              </span>
            )}

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

            {/* Project */}
            {task.projectName && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {task.projectName}
              </span>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded"
                >
                  {tag}
                </span>
              ))}
              {task.tags.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{task.tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Progress bar */}
          {task.progress !== undefined && task.progress > 0 && !isCompleted && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{task.progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="More actions"
          >
            <EllipsisIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

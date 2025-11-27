// Last Modified: 2025-11-24 00:00
import React, { useTransition } from 'react';
import { Task, TaskPriority } from '../../stores/tasksStore';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import {
  Calendar,
  Clock,
  AlertTriangle,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  Circle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow, isPast, isToday, format } from 'date-fns';
import { useTasksStore } from '../../stores/tasksStore';

interface TaskCardProps {
  task: Task;
  isSelected?: boolean;
  onSelect?: () => void;
  isDragging?: boolean;
  onClick?: () => void;
}

const priorityConfig: Record<TaskPriority, { label: string; color: string; icon: React.ReactNode }> = {
  low: { label: 'Low', color: 'text-gray-500', icon: <Circle className="w-3 h-3" /> },
  medium: { label: 'Medium', color: 'text-blue-500', icon: <AlertCircle className="w-3 h-3" /> },
  high: { label: 'High', color: 'text-orange-500', icon: <AlertTriangle className="w-3 h-3" /> },
  critical: { label: 'Critical', color: 'text-red-500', icon: <XCircle className="w-3 h-3" /> }
};

export function TaskCard({ task, isSelected, onSelect, isDragging, onClick }: TaskCardProps) {
  const { selectTask } = useTasksStore();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.task-checkbox')) {
      return; // Don't open detail when clicking checkbox
    }

    startTransition(() => {
      if (onClick) {
        onClick();
      } else {
        selectTask(task.id);
      }
    });
  };

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const hasComments = (task.comments?.length || 0) > 0;
  const hasAttachments = (task.attachments?.length || 0) > 0;

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative bg-card p-3 rounded-lg border cursor-pointer transition-all",
        "hover:shadow-md hover:border-primary/50",
        isDragging && "rotate-2 shadow-lg",
        isSelected && "ring-2 ring-primary ring-offset-2",
        isPending && "opacity-70"
      )}
    >
      {/* Selection Checkbox */}
      {onSelect && (
        <div className="task-checkbox absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Priority Indicator */}
      <div className={cn(
        "absolute top-0 right-0 w-1 h-full rounded-r-lg",
        task.priority === 'critical' && "bg-red-500",
        task.priority === 'high' && "bg-orange-500",
        task.priority === 'medium' && "bg-blue-500",
        task.priority === 'low' && "bg-gray-400"
      )} />

      {/* Card Content */}
      <div className="space-y-2">
        {/* Title and Priority */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-2 flex-1 group-hover:text-primary transition-colors">
            {task.title}
          </h4>
          <div className={cn("flex items-center", priorityConfig[task.priority].color)}>
            {priorityConfig[task.priority].icon}
          </div>
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                +{task.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Subtasks Progress */}
        {totalSubtasks > 0 && (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completedSubtasks}/{totalSubtasks}</span>
                <span>{Math.round((completedSubtasks / totalSubtasks) * 100)}%</span>
              </div>
              <div className="w-full h-1 bg-muted rounded-full mt-1">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {/* Due Date */}
          <div className="flex items-center gap-3">
            {task.dueDate && (
              <div className={cn(
                "flex items-center gap-1",
                isOverdue && "text-red-500 font-medium",
                isDueToday && "text-orange-500 font-medium"
              )}>
                <Calendar className="w-3 h-3" />
                <span>
                  {isOverdue && "Overdue "}
                  {isDueToday ? "Today" : format(new Date(task.dueDate), 'MMM d')}
                </span>
              </div>
            )}

            {/* Time Estimate */}
            {task.estimatedHours && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{task.estimatedHours}h</span>
              </div>
            )}
          </div>

          {/* Indicators */}
          <div className="flex items-center gap-2">
            {hasComments && (
              <div className="flex items-center gap-0.5">
                <MessageSquare className="w-3 h-3" />
                <span>{task.comments?.length}</span>
              </div>
            )}
            {hasAttachments && (
              <div className="flex items-center gap-0.5">
                <Paperclip className="w-3 h-3" />
                <span>{task.attachments?.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Assignee */}
        {task.assigneeId && (
          <div className="flex items-center justify-between">
            <Avatar className="w-6 h-6">
              {task.assigneeAvatar ? (
                <img src={task.assigneeAvatar} alt={task.assigneeName} />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                  {task.assigneeName?.charAt(0).toUpperCase()}
                </div>
              )}
            </Avatar>
          </div>
        )}

        {/* Blocked Indicator */}
        {task.status === 'blocked' && task.blockedReason && (
          <div className="flex items-start gap-1 p-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded text-xs">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{task.blockedReason}</span>
          </div>
        )}
      </div>
    </div>
  );
}
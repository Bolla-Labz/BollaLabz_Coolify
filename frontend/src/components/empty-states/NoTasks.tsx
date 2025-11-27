// Last Modified: 2025-11-24 00:00
import { CheckCircle2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface NoTasksProps {
  onCreateTask: () => void;
}

export function NoTasks({ onCreateTask }: NoTasksProps) {
  return (
    <EmptyState
      icon={CheckCircle2}
      title="All caught up!"
      description="You have no pending tasks. Enjoy your free time or create a new task to stay productive."
      action={{
        label: 'Create New Task',
        onClick: onCreateTask,
      }}
    />
  );
}

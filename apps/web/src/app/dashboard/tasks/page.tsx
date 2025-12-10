"use client";

import { TaskList } from "@/components/tasks/task-list";

export default function TasksPage() {
  const handleToggleComplete = (taskId: string) => {
    console.log(`Toggling task ${taskId}`);
    // In production, this would call the API via TanStack Query mutation
  };

  const handleEdit = (task: { id?: string; title?: string }) => {
    console.log(`Editing task ${task.id}`);
    // In production, this would open an edit modal or navigate to edit page
  };

  const handleDelete = (taskId: string) => {
    console.log(`Deleting task ${taskId}`);
    // In production, this would show a confirmation dialog then call API
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <p className="text-muted-foreground mt-1">
          Manage your tasks and stay on top of your work.
        </p>
      </div>

      {/* Task list */}
      <TaskList
        onToggleComplete={handleToggleComplete}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

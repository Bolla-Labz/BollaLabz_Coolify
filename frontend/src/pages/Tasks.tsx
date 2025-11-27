// Last Modified: 2025-11-24 00:00
import React, { useState, useEffect } from 'react';
import { TaskBoard } from '../components/tasks/TaskBoard';
import { TaskDetail } from '../components/tasks/TaskDetail';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskCardSkeleton } from '@/components/skeletons';
import { NoTasks } from '@/components/empty-states';
import { useTasksStore } from '../stores/tasksStore';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card } from '../components/ui/card';
import {
  LayoutGrid,
  List,
  Calendar,
  BarChart3,
  Plus,
  Download,
  Upload,
  Settings2,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function Tasks() {
  const {
    tasks,
    selectedTaskId,
    selectTask,
    getTaskStats,
    getOverdueTasks,
    fetchTasks,
    isLoading,
    error
  } = useTasksStore();
  const [view, setView] = useState<'board' | 'list' | 'calendar' | 'analytics'>('board');
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const stats = getTaskStats();
  const overdueTasks = getOverdueTasks();

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks().catch((error) => {
      console.error('Failed to load tasks:', error);
      // Error is already handled by the store (toast shown)
    });
  }, [fetchTasks]);

  // Show loading state
  if (isLoading && stats.total === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Tasks Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading your tasks...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error && stats.total === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-4" />
          <p className="text-sm text-red-500 mb-2">Failed to load tasks</p>
          <p className="text-xs text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchTasks()} size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!isLoading && stats.total === 0) {
    return (
      <div className="p-6">
        <NoTasks onCreateTask={() => setShowNewTaskDialog(true)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.total} tasks • {stats.completed} completed ({Math.round(stats.completionRate)}%) • {overdueTasks.length} overdue
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TaskFilters />
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-1" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Task
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="mt-4">
          <TabsList>
            <TabsTrigger value="board" className="flex items-center gap-1">
              <LayoutGrid className="w-4 h-4" />
              Board
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-1">
              <List className="w-4 h-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'board' && <TaskBoard />}

        {view === 'list' && (
          <div className="p-6">
            <Card className="p-8 text-center">
              <List className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">List View</h3>
              <p className="text-sm text-muted-foreground">
                Table view with sorting and filtering coming soon
              </p>
            </Card>
          </div>
        )}

        {view === 'calendar' && (
          <div className="p-6">
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Calendar View</h3>
              <p className="text-sm text-muted-foreground">
                See tasks on a calendar timeline
              </p>
            </Card>
          </div>
        )}

        {view === 'analytics' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tasks</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <LayoutGrid className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {Math.round(stats.completionRate)}% completion rate
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Due Today</p>
                    <p className="text-2xl font-bold">{stats.dueToday}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {stats.overdue}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Settings2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Status Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Status Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500" />
                    <span>Backlog</span>
                  </div>
                  <span className="font-medium">{stats.byStatus.backlog || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>To Do</span>
                  </div>
                  <span className="font-medium">{stats.byStatus.todo || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>In Progress</span>
                  </div>
                  <span className="font-medium">{stats.byStatus.in_progress || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Done</span>
                  </div>
                  <span className="font-medium">{stats.byStatus.done || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Blocked</span>
                  </div>
                  <span className="font-medium">{stats.byStatus.blocked || 0}</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      <TaskDetail
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => selectTask(null)}
      />
    </div>
  );
}
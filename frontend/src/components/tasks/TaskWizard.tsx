// Last Modified: 2025-11-24 21:22
import React from 'react';
import { MultiStepForm, MultiStepFormStep } from '@/components/forms/MultiStepForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckSquare,
  FileText,
  Users,
  Calendar,
  GitBranch,
  Zap,
  Flag,
  Clock,
  Plus,
  X,
} from 'lucide-react';
import { useTasksStore, TaskStatus, TaskPriority } from '@/stores/tasksStore';
import * as z from 'zod';

interface TaskWizardProps {
  onComplete: () => void;
}

/**
 * TaskWizard - Guided multi-step task creation
 *
 * Steps:
 * 1. Task Type & Title
 * 2. Description & Requirements
 * 3. Assignees & Participants
 * 4. Schedule & Deadlines
 * 5. Dependencies & Subtasks
 */
export function TaskWizard({ onComplete }: TaskWizardProps) {
  const { addTask } = useTasksStore();

  const handleSubmit = async (data: any) => {
    const task = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      status: data.status as TaskStatus,
      priority: data.priority as TaskPriority,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      estimatedHours: data.estimatedHours ? parseInt(data.estimatedHours) : undefined,
      tags: data.tags || [],
      assignees: data.assignees || [],
      subtasks: data.subtasks || [],
      dependencies: data.dependencies || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addTask(task);
    onComplete();
  };

  const steps: MultiStepFormStep[] = [
    // Step 1: Task Type & Title
    {
      title: 'Task Type & Title',
      description: 'What needs to be done?',
      icon: <CheckSquare className="h-4 w-4" />,
      content: <TaskTypeStep />,
      validate: async (data) => {
        const schema = z.object({
          title: z.string().min(3, 'Title must be at least 3 characters'),
          priority: z.enum(['low', 'medium', 'high', 'critical']),
        });

        try {
          schema.parse(data);
          return true;
        } catch (error: any) {
          return error.errors[0]?.message || 'Please complete required fields';
        }
      },
    },

    // Step 2: Description & Requirements
    {
      title: 'Description & Requirements',
      description: 'Provide details about the task',
      icon: <FileText className="h-4 w-4" />,
      content: <DescriptionStep />,
      optional: true,
    },

    // Step 3: Assignees & Participants
    {
      title: 'Assignees & Participants',
      description: 'Who will work on this?',
      icon: <Users className="h-4 w-4" />,
      content: <AssigneesStep />,
      optional: true,
    },

    // Step 4: Schedule & Deadlines
    {
      title: 'Schedule & Deadlines',
      description: 'When should this be done?',
      icon: <Calendar className="h-4 w-4" />,
      content: <ScheduleStep />,
      optional: true,
    },

    // Step 5: Dependencies & Subtasks
    {
      title: 'Dependencies & Subtasks',
      description: 'Break down the work',
      icon: <GitBranch className="h-4 w-4" />,
      content: <DependenciesStep />,
      optional: true,
    },
  ];

  return (
    <MultiStepForm
      steps={steps}
      onSubmit={handleSubmit}
      onCancel={onComplete}
      storageKey="task-wizard"
      resumeOnMount={true}
      showProgress={true}
      allowSkipOptional={true}
    />
  );
}

// Step 1: Task Type & Title
function TaskTypeStep({ data, onChange }: any) {
  const handleChange = (field: string, value: any) => {
    onChange?.({ ...data, [field]: value });
  };

  const templates = [
    { id: 'bug', name: 'Bug Fix', priority: 'high', tags: ['bug'] },
    { id: 'feature', name: 'New Feature', priority: 'medium', tags: ['feature'] },
    { id: 'improvement', name: 'Improvement', priority: 'low', tags: ['enhancement'] },
    { id: 'research', name: 'Research', priority: 'low', tags: ['research'] },
  ];

  const handleTemplateSelect = (template: typeof templates[0]) => {
    onChange?.({
      ...data,
      priority: template.priority,
      tags: template.tags,
    });
  };

  return (
    <div className="space-y-4">
      {/* Templates */}
      <div className="space-y-2">
        <Label>Quick Templates</Label>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              onClick={() => handleTemplateSelect(template)}
              className="justify-start"
            >
              <Zap className="h-4 w-4 mr-2" />
              {template.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Task Title *
        </Label>
        <Input
          id="title"
          value={data?.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Fix login page responsiveness"
          required
          autoFocus
        />
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label htmlFor="priority" className="flex items-center gap-2">
          <Flag className="w-4 h-4" />
          Priority *
        </Label>
        <Select
          value={data?.priority || 'medium'}
          onValueChange={(value) => handleChange('priority', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">Initial Status</Label>
        <Select
          value={data?.status || 'todo'}
          onValueChange={(value) => handleChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="backlog">Backlog</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Step 2: Description & Requirements
function DescriptionStep({ data, onChange }: any) {
  const handleChange = (field: string, value: any) => {
    onChange?.({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data?.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe what needs to be done..."
          rows={6}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="acceptance">Acceptance Criteria</Label>
        <Textarea
          id="acceptance"
          value={data?.acceptance || ''}
          onChange={(e) => handleChange('acceptance', e.target.value)}
          placeholder="- User can log in successfully&#10;- Error messages are clear&#10;- Works on mobile devices"
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Use bullet points to list criteria
        </p>
      </div>
    </div>
  );
}

// Step 3: Assignees
function AssigneesStep({ data, onChange }: any) {
  const [newAssignee, setNewAssignee] = React.useState('');
  const assignees = data?.assignees || [];

  const handleChange = (field: string, value: any) => {
    onChange?.({ ...data, [field]: value });
  };

  const addAssignee = () => {
    if (newAssignee && !assignees.includes(newAssignee)) {
      onChange?.({ ...data, assignees: [...assignees, newAssignee] });
      setNewAssignee('');
    }
  };

  const removeAssignee = (assignee: string) => {
    onChange?.({ ...data, assignees: assignees.filter((a: string) => a !== assignee) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Add Assignees</Label>
        <div className="flex gap-2">
          <Input
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
            placeholder="Enter name or email"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addAssignee();
              }
            }}
          />
          <Button type="button" onClick={addAssignee} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {assignees.length > 0 && (
        <div className="space-y-2">
          <Label>Assigned To</Label>
          <div className="flex flex-wrap gap-2">
            {assignees.map((assignee: string, idx: number) => (
              <Badge key={idx} variant="secondary" className="gap-1">
                {assignee}
                <button
                  type="button"
                  onClick={() => removeAssignee(assignee)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Step 4: Schedule & Deadlines
function ScheduleStep({ data, onChange }: any) {
  const handleChange = (field: string, value: any) => {
    onChange?.({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dueDate" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Due Date
        </Label>
        <Input
          id="dueDate"
          type="date"
          value={data?.dueDate || ''}
          onChange={(e) => handleChange('dueDate', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimatedHours" className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Estimated Hours
        </Label>
        <Input
          id="estimatedHours"
          type="number"
          min="0"
          step="0.5"
          value={data?.estimatedHours || ''}
          onChange={(e) => handleChange('estimatedHours', e.target.value)}
          placeholder="e.g., 4"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="recurring"
          checked={data?.recurring || false}
          onCheckedChange={(checked) => handleChange('recurring', checked)}
        />
        <Label htmlFor="recurring" className="text-sm font-normal cursor-pointer">
          This is a recurring task
        </Label>
      </div>
    </div>
  );
}

// Step 5: Dependencies & Subtasks
function DependenciesStep({ data, onChange }: any) {
  const [newSubtask, setNewSubtask] = React.useState('');
  const subtasks = data?.subtasks || [];

  const handleChange = (field: string, value: any) => {
    onChange?.({ ...data, [field]: value });
  };

  const addSubtask = () => {
    if (newSubtask) {
      const subtask = {
        id: Date.now().toString(),
        title: newSubtask,
        completed: false,
      };
      onChange?.({ ...data, subtasks: [...subtasks, subtask] });
      setNewSubtask('');
    }
  };

  const removeSubtask = (id: string) => {
    onChange?.({ ...data, subtasks: subtasks.filter((s: any) => s.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Add Subtasks</Label>
        <div className="flex gap-2">
          <Input
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            placeholder="Enter subtask description"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSubtask();
              }
            }}
          />
          <Button type="button" onClick={addSubtask} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {subtasks.length > 0 && (
        <div className="space-y-2">
          <Label>Subtasks ({subtasks.length})</Label>
          <div className="space-y-1">
            {subtasks.map((subtask: any) => (
              <div
                key={subtask.id}
                className="flex items-center justify-between p-2 rounded-lg border"
              >
                <span className="text-sm">{subtask.title}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSubtask(subtask.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Break down complex tasks into smaller, manageable subtasks
      </p>
    </div>
  );
}

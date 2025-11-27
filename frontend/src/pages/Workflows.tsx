// Last Modified: 2025-11-23 17:30
import { useEffect, useState } from 'react';
import { Plus, Play, Pause, Trash2, Settings as SettingsIcon, Activity } from 'lucide-react';
import { useWorkflowsStore } from '@/stores/workflowsStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { CreateWorkflowDTO } from '@/services/workflowsService';

export default function Workflows() {
  const {
    workflows,
    isLoading,
    error,
    fetchWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    triggerWorkflow,
    getSortedWorkflows,
    clearError,
  } = useWorkflowsStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateWorkflowDTO>({
    name: '',
    trigger_type: 'webhook',
    webhook_url: '',
    conditions: {},
    actions: {},
  });

  useEffect(() => {
    fetchWorkflows().catch((error) => {
      console.error('Failed to load workflows:', error);
      // Error is already handled by the store (toast shown)
    });
  }, [fetchWorkflows]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleCreateWorkflow = async () => {
    if (!formData.name.trim()) {
      toast.error('Workflow name is required');
      return;
    }

    try {
      const workflow = await createWorkflow(formData);
      if (workflow) {
        toast.success('Workflow created successfully');
        setIsCreateDialogOpen(false);
        setFormData({
          name: '',
          trigger_type: 'webhook',
          webhook_url: '',
          conditions: {},
          actions: {},
        });
      }
    } catch (error) {
      console.error('Failed to create workflow:', error);
      // Error is already handled by the store
    }
  };

  const handleToggleWorkflow = async (id: number) => {
    try {
      const success = await toggleWorkflow(id);
      if (success) {
        const workflow = workflows.find((w) => w.id === id);
        toast.success(`Workflow ${workflow?.isActive ? 'deactivated' : 'activated'}`);
      }
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
      // Error is already handled by the store
    }
  };

  const handleDeleteWorkflow = async (id: number) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const success = await deleteWorkflow(id);
      if (success) {
        toast.success('Workflow deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      // Error is already handled by the store
    }
  };

  const handleTriggerWorkflow = async (id: number) => {
    try {
      const result = await triggerWorkflow(id);
      if (result) {
        toast.success(`Workflow triggered successfully. Hit count: ${result.hit_count}`);
      }
    } catch (error) {
      console.error('Failed to trigger workflow:', error);
      // Error is already handled by the store
    }
  };

  const sortedWorkflows = getSortedWorkflows();

  const getTriggerTypeColor = (type: string) => {
    switch (type) {
      case 'webhook':
        return 'bg-blue-500/10 text-blue-500';
      case 'schedule':
        return 'bg-green-500/10 text-green-500';
      case 'event':
        return 'bg-purple-500/10 text-purple-500';
      case 'manual':
        return 'bg-orange-500/10 text-orange-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows & Automations</h1>
          <p className="text-muted-foreground mt-1">
            Automate tasks with webhooks, schedules, and triggers
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                Set up a new automation workflow with triggers and actions
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Send daily summary"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="trigger_type">Trigger Type</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, trigger_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="schedule">Schedule</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.trigger_type === 'webhook' && (
                <div className="grid gap-2">
                  <Label htmlFor="webhook_url">Webhook URL</Label>
                  <Input
                    id="webhook_url"
                    type="url"
                    placeholder="https://api.example.com/webhook"
                    value={formData.webhook_url || ''}
                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="conditions">Conditions (JSON)</Label>
                <Textarea
                  id="conditions"
                  placeholder='{"temperature": "> 75"}'
                  value={JSON.stringify(formData.conditions || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      setFormData({ ...formData, conditions: JSON.parse(e.target.value) });
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="font-mono text-sm"
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="actions">Actions (JSON)</Label>
                <Textarea
                  id="actions"
                  placeholder='{"notify": "admin@example.com"}'
                  value={JSON.stringify(formData.actions || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      setFormData({ ...formData, actions: JSON.parse(e.target.value) });
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="font-mono text-sm"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorkflow} disabled={isLoading}>
                Create Workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading State */}
      {isLoading && workflows.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading workflows...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && workflows.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Workflows Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first workflow to automate tasks and processes
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Workflow
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Workflows Grid */}
      {!isLoading && workflows.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedWorkflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {workflow.triggerType === 'webhook' && workflow.webhookUrl}
                      {workflow.triggerType === 'schedule' && 'Scheduled automation'}
                      {workflow.triggerType === 'event' && 'Event-triggered'}
                      {workflow.triggerType === 'manual' && 'Manual trigger'}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={getTriggerTypeColor(workflow.triggerType)}
                  >
                    {workflow.triggerType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                      {workflow.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-2xl font-bold">{workflow.hitCount}</p>
                      <p className="text-xs text-muted-foreground">Total Runs</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {workflow.lastTriggered
                          ? new Date(workflow.lastTriggered).toLocaleDateString()
                          : 'Never'}
                      </p>
                      <p className="text-xs text-muted-foreground">Last Run</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleTriggerWorkflow(workflow.id)}
                      disabled={!workflow.isActive}
                    >
                      <Play className="h-3 w-3" />
                      Trigger
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleWorkflow(workflow.id)}
                    >
                      {workflow.isActive ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteWorkflow(workflow.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Last Modified: 2025-11-23 17:30
import React, { useState, useEffect } from 'react';
import { useTasksStore, Task, TaskStatus, TaskPriority } from '../../stores/tasksStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import {
  X, Save, Trash2, Clock, Calendar, Tag, User, Paperclip,
  MessageSquare, CheckSquare, Plus, Edit2, Send, Download
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

interface TaskDetailProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'backlog', label: 'Backlog', color: 'bg-gray-500' },
  { value: 'todo', label: 'To Do', color: 'bg-blue-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { value: 'done', label: 'Done', color: 'bg-green-500' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-500' }
];

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-gray-500' },
  { value: 'medium', label: 'Medium', color: 'text-blue-500' },
  { value: 'high', label: 'High', color: 'text-orange-500' },
  { value: 'critical', label: 'Critical', color: 'text-red-500' }
];

export function TaskDetail({ taskId, isOpen, onClose }: TaskDetailProps) {
  const { getTaskById, updateTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask, addComment } = useTasksStore();
  const [task, setTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (taskId) {
      const foundTask = getTaskById(taskId);
      if (foundTask) {
        setTask(foundTask);
        setEditedTask(foundTask);
      }
    }
  }, [taskId, getTaskById]);

  if (!task || !editedTask) return null;

  const handleSave = () => {
    if (!editedTask) return;
    updateTask(task.id, editedTask);
    setTask(editedTask);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    addSubtask(task.id, { title: newSubtask, completed: false });
    setNewSubtask('');
    // Refresh task
    const updated = getTaskById(task.id);
    if (updated) {
      setTask(updated);
      setEditedTask(updated);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment(task.id, {
      text: newComment,
      authorId: '1', // Would come from auth context
      authorName: 'Current User',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'
    });
    setNewComment('');
    // Refresh task
    const updated = getTaskById(task.id);
    if (updated) {
      setTask(updated);
      setEditedTask(updated);
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim() || editedTask.tags.includes(newTag)) return;
    setEditedTask({ ...editedTask, tags: [...editedTask.tags, newTag] });
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setEditedTask({ ...editedTask, tags: editedTask.tags.filter(t => t !== tag) });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span className="text-muted-foreground">#{task.id.slice(-6)}</span>
              {isEditing ? (
                <Input
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="flex-1"
                />
              ) : (
                <span>{task.title}</span>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setEditedTask(task);
                    setIsEditing(false);
                  }}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="subtasks">
              Subtasks {task.subtasks && task.subtasks.length > 0 && `(${task.subtasks.length})`}
            </TabsTrigger>
            <TabsTrigger value="comments">
              Comments {task.comments && task.comments.length > 0 && `(${task.comments.length})`}
            </TabsTrigger>
            <TabsTrigger value="attachments">
              Attachments {task.attachments && task.attachments.length > 0 && `(${task.attachments.length})`}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="details" className="space-y-4">
              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  {isEditing ? (
                    <Select
                      value={editedTask.status}
                      onValueChange={(value: TaskStatus) => setEditedTask({ ...editedTask, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", option.color)} />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        statusOptions.find(s => s.value === task.status)?.color
                      )} />
                      <span>{statusOptions.find(s => s.value === task.status)?.label}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Priority</Label>
                  {isEditing ? (
                    <Select
                      value={editedTask.priority}
                      onValueChange={(value: TaskPriority) => setEditedTask({ ...editedTask, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className={option.color}>{option.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className={cn(
                      "mt-2",
                      priorityOptions.find(p => p.value === task.priority)?.color
                    )}>
                      {priorityOptions.find(p => p.value === task.priority)?.label}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                {isEditing ? (
                  <Textarea
                    value={editedTask.description || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                    placeholder="Add a description..."
                    rows={4}
                  />
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {task.description || 'No description'}
                  </p>
                )}
              </div>

              {/* Due Date and Time Estimates */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Due Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedTask.dueDate ? format(new Date(editedTask.dueDate), 'yyyy-MM-dd') : ''}
                      onChange={(e) => setEditedTask({
                        ...editedTask,
                        dueDate: e.target.value ? new Date(e.target.value) : undefined
                      })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'Not set'}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Estimated Hours</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedTask.estimatedHours || ''}
                      onChange={(e) => setEditedTask({
                        ...editedTask,
                        estimatedHours: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      min="0"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {task.estimatedHours ? `${task.estimatedHours}h` : 'Not set'}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Actual Hours</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedTask.actualHours || ''}
                      onChange={(e) => setEditedTask({
                        ...editedTask,
                        actualHours: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      min="0"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {task.actualHours ? `${task.actualHours}h` : 'Not tracked'}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editedTask.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      {isEditing && (
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-destructive"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      )}
                    </Badge>
                  ))}
                  {isEditing && (
                    <div className="flex items-center gap-1">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add tag"
                        className="h-7 w-24"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button size="sm" variant="ghost" onClick={handleAddTag}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Blocked Reason */}
              {(task.status === 'blocked' || editedTask.status === 'blocked') && (
                <div>
                  <Label>Blocked Reason</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedTask.blockedReason || ''}
                      onChange={(e) => setEditedTask({ ...editedTask, blockedReason: e.target.value })}
                      placeholder="Why is this task blocked?"
                      rows={2}
                    />
                  ) : (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {task.blockedReason || 'No reason provided'}
                    </p>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Created: {format(new Date(task.createdAt), 'MMM d, yyyy h:mm a')}</div>
                <div>Updated: {format(new Date(task.updatedAt), 'MMM d, yyyy h:mm a')}</div>
                {task.completedAt && (
                  <div>Completed: {format(new Date(task.completedAt), 'MMM d, yyyy h:mm a')}</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="subtasks" className="space-y-4">
              {/* Add Subtask */}
              <div className="flex gap-2">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add a subtask..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                />
                <Button onClick={handleAddSubtask} disabled={!newSubtask.trim()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Subtasks List */}
              <div className="space-y-2">
                {task.subtasks?.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent">
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => {
                        toggleSubtask(task.id, subtask.id);
                        // Refresh task
                        const updated = getTaskById(task.id);
                        if (updated) {
                          setTask(updated);
                          setEditedTask(updated);
                        }
                      }}
                    />
                    <span className={cn(
                      "flex-1",
                      subtask.completed && "line-through text-muted-foreground"
                    )}>
                      {subtask.title}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        deleteSubtask(task.id, subtask.id);
                        const updated = getTaskById(task.id);
                        if (updated) {
                          setTask(updated);
                          setEditedTask(updated);
                        }
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {!task.subtasks || task.subtasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No subtasks yet. Add one above!
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              {/* Comments List */}
              <div className="space-y-4">
                {task.comments?.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      {comment.authorAvatar ? (
                        <img src={comment.authorAvatar} alt={comment.authorName} />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xs">
                          {comment.authorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.authorName}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                        </span>
                        {comment.editedAt && (
                          <span className="text-xs text-muted-foreground">(edited)</span>
                        )}
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  </div>
                ))}
                {!task.comments || task.comments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet. Start a discussion!
                  </p>
                )}
              </div>

              {/* Add Comment */}
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="attachments" className="space-y-4">
              {task.attachments && task.attachments.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {task.attachments.map(attachment => (
                    <div key={attachment.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Paperclip className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(attachment.size / 1024).toFixed(1)} KB • {attachment.type}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Paperclip className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No attachments</p>
                  <Button variant="outline" className="mt-3">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Attachment
                  </Button>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
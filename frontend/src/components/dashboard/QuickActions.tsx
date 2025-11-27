// Last Modified: 2025-11-23 17:30
import React from 'react';
import {
  Plus,
  MessageSquare,
  Phone,
  Calendar,
  FileText,
  Users,
  Settings,
  Download,
  Upload,
  Search,
  Command
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
  shortcut?: string;
}

export function QuickActions() {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: 'new-message',
      label: 'New Message',
      description: 'Start a conversation',
      icon: MessageSquare,
      color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20',
      onClick: () => navigate('/conversations?action=new'),
      shortcut: 'Ctrl+M'
    },
    {
      id: 'add-contact',
      label: 'Add Contact',
      description: 'Create new contact',
      icon: Users,
      color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
      onClick: () => navigate('/contacts?action=new'),
      shortcut: 'Ctrl+N'
    },
    {
      id: 'schedule-call',
      label: 'Schedule Call',
      description: 'Plan a voice call',
      icon: Phone,
      color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20',
      onClick: () => navigate('/calendar?action=call'),
      shortcut: 'Ctrl+K'
    },
    {
      id: 'create-task',
      label: 'Create Task',
      description: 'Add a new task',
      icon: FileText,
      color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20',
      onClick: () => navigate('/tasks?action=new'),
      shortcut: 'Ctrl+T'
    },
    {
      id: 'export-data',
      label: 'Export Data',
      description: 'Download your data',
      icon: Download,
      color: 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/20',
      onClick: () => console.log('Export data'),
    },
    {
      id: 'import-contacts',
      label: 'Import',
      description: 'Import contacts CSV',
      icon: Upload,
      color: 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900/20',
      onClick: () => console.log('Import contacts'),
    }
  ];

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'm':
            e.preventDefault();
            navigate('/conversations?action=new');
            break;
          case 'n':
            e.preventDefault();
            navigate('/contacts?action=new');
            break;
          case 'k':
            e.preventDefault();
            navigate('/calendar?action=call');
            break;
          case 't':
            e.preventDefault();
            navigate('/tasks?action=new');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <Command className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Floating Action Button Style */}
        <div className="mb-4">
          <button className="w-full p-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 font-medium">
            <Plus className="w-5 h-5" />
            Quick Create
          </button>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className="group relative p-3 rounded-lg border bg-background hover:bg-muted hover:border-primary/20 transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                    action.color
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{action.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {action.description}
                    </p>
                  </div>
                </div>

                {/* Keyboard Shortcut Badge */}
                {action.shortcut && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                      {action.shortcut}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Command Palette Hint */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 rounded bg-background text-xs font-mono">Ctrl+K</kbd> to open command palette
            </p>
          </div>
        </div>

        {/* Recent Actions */}
        <div className="mt-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-2">Recent Actions</h3>
          <div className="space-y-1">
            <button className="w-full text-left p-2 rounded hover:bg-muted transition-colors flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Messaged Sarah Chen</span>
              <span className="text-xs text-muted-foreground ml-auto">2m ago</span>
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-muted transition-colors flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Added John Doe</span>
              <span className="text-xs text-muted-foreground ml-auto">1h ago</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
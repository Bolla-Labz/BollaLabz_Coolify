// Last Modified: 2025-11-23 17:30
import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  Phone,
  CheckCircle,
  UserPlus,
  AlertCircle,
  Calendar,
  Mail,
  DollarSign
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useWebSocket } from '../../components/providers/WebSocketProvider';

interface Activity {
  id: string;
  type: 'message' | 'call' | 'task' | 'contact' | 'alert' | 'meeting' | 'email' | 'payment';
  title: string;
  description: string;
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: {
    duration?: string;
    amount?: number;
    status?: 'completed' | 'pending' | 'failed';
  };
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'message',
    title: 'New message from Sarah Chen',
    description: 'Hey, can we reschedule our meeting to next week?',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    user: {
      name: 'Sarah Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah'
    }
  },
  {
    id: '2',
    type: 'call',
    title: 'Incoming call from John Doe',
    description: 'Call duration: 5 minutes 23 seconds',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    user: {
      name: 'John Doe',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
    },
    metadata: {
      duration: '5:23'
    }
  },
  {
    id: '3',
    type: 'task',
    title: 'Task completed: Follow up with client',
    description: 'Client proposal review completed successfully',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    metadata: {
      status: 'completed'
    }
  },
  {
    id: '4',
    type: 'contact',
    title: 'New contact added',
    description: 'Emma Wilson has been added to your contacts',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    user: {
      name: 'Emma Wilson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma'
    }
  },
  {
    id: '5',
    type: 'alert',
    title: 'Relationship health alert',
    description: 'No contact with Mike Brown for over 30 days',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000)
  },
  {
    id: '6',
    type: 'payment',
    title: 'Monthly cost update',
    description: 'SMS and voice costs: $12.45 this week',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    metadata: {
      amount: 12.45
    }
  }
];

const activityIcons: Record<Activity['type'], React.ElementType> = {
  message: MessageSquare,
  call: Phone,
  task: CheckCircle,
  contact: UserPlus,
  alert: AlertCircle,
  meeting: Calendar,
  email: Mail,
  payment: DollarSign
};

const activityColors: Record<Activity['type'], string> = {
  message: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20',
  call: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
  task: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20',
  contact: 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/20',
  alert: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20',
  meeting: 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900/20',
  email: 'text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-900/20',
  payment: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20'
};

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    // Subscribe to real-time activity updates
    const unsubscribe = subscribe('activity', (newActivity: Activity) => {
      setActivities(prev => [
        { ...newActivity, timestamp: new Date(newActivity.timestamp) },
        ...prev.slice(0, 9) // Keep only last 10 activities
      ]);
    });

    return unsubscribe;
  }, [subscribe]);

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 pb-4">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your latest interactions and updates
        </p>
      </div>

      <div className="divide-y divide-border">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type];
          const colorClass = activityColors[activity.type];

          return (
            <div
              key={activity.id}
              className="px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <div className="flex gap-4">
                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                  colorClass
                )}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {activity.description}
                      </p>

                      {/* Metadata */}
                      {activity.metadata && (
                        <div className="flex items-center gap-3 mt-2">
                          {activity.metadata.duration && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {activity.metadata.duration}
                            </span>
                          )}
                          {activity.metadata.amount && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${activity.metadata.amount.toFixed(2)}
                            </span>
                          )}
                          {activity.metadata.status && (
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              activity.metadata.status === 'completed' && "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                              activity.metadata.status === 'pending' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
                              activity.metadata.status === 'failed' && "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            )}>
                              {activity.metadata.status}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>

                  {/* User Avatar */}
                  {activity.user && (
                    <div className="flex items-center gap-2 mt-2">
                      <img
                        src={activity.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.user.name}`}
                        alt={activity.user.name}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-xs text-muted-foreground">
                        {activity.user.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      <div className="p-4 border-t">
        <button className="text-sm text-primary hover:underline font-medium">
          View all activity →
        </button>
      </div>
    </div>
  );
}
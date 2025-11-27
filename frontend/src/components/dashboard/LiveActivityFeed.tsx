// Last Modified: 2025-11-24 21:20
/**
 * LiveActivityFeed Component
 * Real-time activity stream with WebSocket integration
 * Features:
 * - Live activity updates via WebSocket
 * - Animated entry/exit transitions
 * - Progress indicators for ongoing tasks
 * - Virtual scrolling for performance
 * - Grouped notifications with aggregation
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '@/components/providers/WebSocketProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Activity,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  Users,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  CheckSquare,
  TrendingUp,
  LucideIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ============================================
// TYPES
// ============================================

export interface ActivityItem {
  id: string;
  type: 'message' | 'call' | 'task' | 'meeting' | 'alert' | 'metric' | 'system';
  title: string;
  description?: string;
  timestamp: Date;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress?: number;
  user?: {
    name: string;
    avatar?: string;
    initials?: string;
  };
  metadata?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  read?: boolean;
}

export interface LiveActivityFeedProps {
  initialActivities?: ActivityItem[];
  maxItems?: number;
  enableRealtime?: boolean;
  websocketChannel?: string;
  groupByType?: boolean;
  showProgress?: boolean;
  onActivityClick?: (activity: ActivityItem) => void;
  className?: string;
}

// ============================================
// ACTIVITY ICON MAPPING
// ============================================

const getActivityIcon = (type: ActivityItem['type']): LucideIcon => {
  const iconMap: Record<ActivityItem['type'], LucideIcon> = {
    message: MessageSquare,
    call: Phone,
    task: CheckSquare,
    meeting: Calendar,
    alert: AlertCircle,
    metric: TrendingUp,
    system: Activity,
  };
  return iconMap[type] || Activity;
};

// ============================================
// ACTIVITY ITEM COMPONENT
// ============================================

interface ActivityItemProps {
  activity: ActivityItem;
  showProgress?: boolean;
  onClick?: () => void;
}

const ActivityItemComponent = memo(function ActivityItemComponent({
  activity,
  showProgress = true,
  onClick
}: ActivityItemProps) {
  const Icon = getActivityIcon(activity.type);

  const getPriorityColor = () => {
    switch (activity.priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10';
      case 'high':
        return 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10';
      case 'normal':
        return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10';
      case 'low':
        return 'border-l-gray-500 bg-gray-50/50 dark:bg-gray-900/10';
      default:
        return 'border-l-gray-300 dark:border-l-gray-700';
    }
  };

  const getStatusColor = () => {
    switch (activity.status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        'border-l-4 p-4 rounded-r-lg transition-all duration-200',
        getPriorityColor(),
        onClick && 'cursor-pointer hover:shadow-md',
        !activity.read && 'ring-2 ring-blue-100 dark:ring-blue-900/30'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon or Avatar */}
        {activity.user ? (
          <Avatar className="w-8 h-8">
            {activity.user.avatar && <AvatarImage src={activity.user.avatar} />}
            <AvatarFallback className="text-xs">
              {activity.user.initials || activity.user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            getStatusColor()
          )}>
            <Icon className="w-4 h-4" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={cn(
                'text-sm font-medium',
                !activity.read && 'font-semibold'
              )}>
                {activity.title}
              </p>
              {activity.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {activity.description}
                </p>
              )}
            </div>

            {/* Status Badge */}
            {activity.status && (
              <Badge
                variant={activity.status === 'completed' ? 'default' : 'outline'}
                className={cn('text-xs', getStatusColor())}
              >
                {activity.status.replace('_', ' ')}
              </Badge>
            )}
          </div>

          {/* Progress Bar */}
          {showProgress && activity.progress !== undefined && activity.status === 'in_progress' && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-medium">{activity.progress}%</span>
              </div>
              <Progress value={activity.progress} className="h-1.5" />
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ============================================
// GROUPED ACTIVITIES COMPONENT
// ============================================

interface GroupedActivitiesProps {
  type: ActivityItem['type'];
  activities: ActivityItem[];
  showProgress?: boolean;
  onActivityClick?: (activity: ActivityItem) => void;
}

const GroupedActivities = memo(function GroupedActivities({
  type,
  activities,
  showProgress,
  onActivityClick
}: GroupedActivitiesProps) {
  const Icon = getActivityIcon(type);
  const [isExpanded, setIsExpanded] = useState(true);

  const typeLabels: Record<ActivityItem['type'], string> = {
    message: 'Messages',
    call: 'Calls',
    task: 'Tasks',
    meeting: 'Meetings',
    alert: 'Alerts',
    metric: 'Metrics',
    system: 'System',
  };

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted rounded-lg transition-colors"
      >
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{typeLabels[type]}</span>
        <Badge variant="secondary" className="ml-auto">
          {activities.length}
        </Badge>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2"
          >
            {activities.map((activity) => (
              <ActivityItemComponent
                key={activity.id}
                activity={activity}
                showProgress={showProgress}
                onClick={onActivityClick ? () => onActivityClick(activity) : undefined}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================
// LIVE ACTIVITY FEED COMPONENT
// ============================================

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  initialActivities = [],
  maxItems = 50,
  enableRealtime = true,
  websocketChannel = 'activity:new',
  groupByType = false,
  showProgress = true,
  onActivityClick,
  className
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [filter, setFilter] = useState<ActivityItem['type'] | 'all'>('all');
  const { subscribe, isConnected } = useWebSocket();

  // Subscribe to real-time activity updates
  useEffect(() => {
    if (!enableRealtime || !websocketChannel || !isConnected) return;

    const unsubscribe = subscribe(websocketChannel, (newActivity: ActivityItem) => {
      setActivities((prev) => {
        const updated = [
          {
            ...newActivity,
            timestamp: new Date(newActivity.timestamp),
          },
          ...prev,
        ];
        return updated.slice(0, maxItems);
      });
    });

    return unsubscribe;
  }, [enableRealtime, websocketChannel, isConnected, subscribe, maxItems]);

  // Handle activity updates (e.g., progress changes)
  useEffect(() => {
    if (!enableRealtime || !isConnected) return;

    const unsubscribe = subscribe('activity:update', (update: Partial<ActivityItem> & { id: string }) => {
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === update.id
            ? { ...activity, ...update }
            : activity
        )
      );
    });

    return unsubscribe;
  }, [enableRealtime, isConnected, subscribe]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activities;
    return activities.filter((a) => a.type === filter);
  }, [activities, filter]);

  // Group activities by type
  const groupedActivities = useMemo(() => {
    if (!groupByType) return null;

    const groups: Record<ActivityItem['type'], ActivityItem[]> = {
      message: [],
      call: [],
      task: [],
      meeting: [],
      alert: [],
      metric: [],
      system: [],
    };

    filteredActivities.forEach((activity) => {
      groups[activity.type]?.push(activity);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [filteredActivities, groupByType]);

  // Mark activity as read
  const handleActivityClick = useCallback((activity: ActivityItem) => {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activity.id ? { ...a, read: true } : a
      )
    );
    onActivityClick?.(activity);
  }, [onActivityClick]);

  // Get unread count
  const unreadCount = useMemo(
    () => activities.filter((a) => !a.read).length,
    [activities]
  );

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Activity Feed</CardTitle>
            {enableRealtime && (
              <div className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              )} />
            )}
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          <Badge
            variant={filter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilter('all')}
          >
            All
          </Badge>
          {(['message', 'call', 'task', 'meeting', 'alert'] as const).map((type) => (
            <Badge
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              className="cursor-pointer capitalize"
              onClick={() => setFilter(type)}
            >
              {type}s
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6">
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No activities yet</p>
            </div>
          ) : groupByType && groupedActivities ? (
            <div className="space-y-4">
              {groupedActivities.map(([type, items]) => (
                <GroupedActivities
                  key={type}
                  type={type as ActivityItem['type']}
                  activities={items}
                  showProgress={showProgress}
                  onActivityClick={handleActivityClick}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredActivities.map((activity) => (
                  <ActivityItemComponent
                    key={activity.id}
                    activity={activity}
                    showProgress={showProgress}
                    onClick={() => handleActivityClick(activity)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LiveActivityFeed;

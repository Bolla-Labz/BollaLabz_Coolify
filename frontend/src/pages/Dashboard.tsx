// Last Modified: 2025-11-24 00:00
import React, { useState, useTransition, Suspense } from 'react';
import * as Sentry from '@sentry/react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { RelationshipHealth } from '../components/dashboard/RelationshipHealth';
import { CostTracker } from '../components/dashboard/CostTracker';
import { QuickActions } from '../components/dashboard/QuickActions';
import { DashboardCardSkeleton } from '@/components/skeletons';
import { SectionSuspenseWrapper } from '@/components/ui/SuspenseWrapper';
import { DataLoader } from '@/components/ui/loaders/DataLoader';
import { useWebSocket } from '../components/providers/WebSocketProvider';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import {
  Users,
  MessageSquare,
  CheckSquare,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Phone
} from 'lucide-react';

// Sentry test button component
function ErrorButton() {
  return (
    <button
      onClick={() => {
        throw new Error('This is your first error!');
      }}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
    >
      Break the world
    </button>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const [isPending, startTransition] = useTransition();

  // Mock data - will be replaced with real API calls
  const [stats, setStats] = useState({
    totalContacts: 247,
    totalConversations: 1342,
    activeTasks: 23,
    monthlySpend: 45.78,
    contactsChange: 12,
    conversationsChange: -5,
    tasksChange: 3,
    spendChange: 15.2,
  });

  // Simulate data refresh with non-blocking updates
  const handleRefreshDashboard = () => {
    startTransition(() => {
      // In production, this would fetch from API
      // For now, simulate update with slight variations
      setStats(prev => ({
        ...prev,
        totalContacts: prev.totalContacts + Math.floor(Math.random() * 5),
        totalConversations: prev.totalConversations + Math.floor(Math.random() * 20),
        activeTasks: prev.activeTasks + Math.floor(Math.random() * 3) - 1,
      }));
    });
  };

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name || 'User'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your command center today
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sentry Test Button - Remove after testing */}
          <ErrorButton />
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
            isConnected
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-red-500/10 text-red-600 dark:text-red-400"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Stats Grid - Each card responds to its container size */}
      <div className="@container">
        <div className={cn(
          "grid gap-4 @sm:grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 @xl:grid-cols-4 transition-opacity duration-200",
          isPending && "opacity-60"
        )}>
          <StatsCard
            title="Total Contacts"
            value={stats.totalContacts}
            change={stats.contactsChange}
            icon={Users}
            trend={stats.contactsChange > 0 ? 'up' : 'down'}
            description="Active phone contacts"
            onClick={handleRefreshDashboard}
          />
          <StatsCard
            title="Conversations"
            value={stats.totalConversations}
            change={stats.conversationsChange}
            icon={MessageSquare}
            trend={stats.conversationsChange > 0 ? 'up' : 'down'}
            description="Total messages exchanged"
            onClick={handleRefreshDashboard}
          />
          <StatsCard
            title="Active Tasks"
            value={stats.activeTasks}
            change={stats.tasksChange}
            icon={CheckSquare}
            trend={stats.tasksChange > 0 ? 'up' : 'down'}
            description="Tasks in progress"
            onClick={handleRefreshDashboard}
          />
          <StatsCard
            title="Monthly Spend"
            value={`$${stats.monthlySpend.toFixed(2)}`}
            change={stats.spendChange}
            icon={DollarSign}
            trend={stats.spendChange > 0 ? 'up' : 'down'}
            description="SMS, Voice, AI costs"
            valueClassName="text-green-600 dark:text-green-400"
            onClick={handleRefreshDashboard}
          />
        </div>
        {isPending && (
          <div className="text-sm text-muted-foreground mt-2 animate-pulse">
            Updating dashboard data...
          </div>
        )}
      </div>

      {/* Main Content Grid with Suspense boundaries */}
      <div className={cn(
        "grid grid-cols-1 lg:grid-cols-3 gap-6 transition-opacity duration-200",
        isPending && "opacity-60"
      )}>
        {/* Activity Feed - Takes 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <SectionSuspenseWrapper
            name="ActivityFeed"
            loadingMessage="Loading activity feed..."
          >
            <ActivityFeed />
          </SectionSuspenseWrapper>

          <SectionSuspenseWrapper
            name="RelationshipHealth"
            loadingMessage="Loading relationship data..."
          >
            <RelationshipHealth />
          </SectionSuspenseWrapper>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <SectionSuspenseWrapper
            name="CostTracker"
            loadingMessage="Loading cost data..."
          >
            <CostTracker />
          </SectionSuspenseWrapper>

          <SectionSuspenseWrapper
            name="QuickActions"
            loadingMessage="Loading actions..."
          >
            <QuickActions />
          </SectionSuspenseWrapper>
        </div>
      </div>
    </div>
  );
}
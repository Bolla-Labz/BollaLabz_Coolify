"use client";

import { StatsCard, StatsGrid } from "@/components/dashboard/stats-card";
import { RecentContacts } from "@/components/dashboard/recent-contacts";
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks";
import { RecentCalls } from "@/components/dashboard/recent-calls";

// Icons for stats cards
const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

const TasksIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

export default function DashboardPage() {
  // In production, these would come from TanStack Query hooks
  const isLoading = false;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here is an overview of your command center.
        </p>
      </div>

      {/* Stats cards */}
      <StatsGrid>
        <StatsCard
          title="Total Contacts"
          value="248"
          change={12}
          changeLabel="this month"
          icon={<UsersIcon className="h-6 w-6" />}
          loading={isLoading}
        />
        <StatsCard
          title="Active Tasks"
          value="18"
          change={-5}
          changeLabel="vs last week"
          icon={<TasksIcon className="h-6 w-6" />}
          loading={isLoading}
        />
        <StatsCard
          title="Calls Today"
          value="7"
          change={23}
          changeLabel="vs yesterday"
          icon={<PhoneIcon className="h-6 w-6" />}
          loading={isLoading}
        />
        <StatsCard
          title="Events This Week"
          value="12"
          icon={<CalendarIcon className="h-6 w-6" />}
          loading={isLoading}
        />
      </StatsGrid>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <UpcomingTasks loading={isLoading} />
          <RecentCalls loading={isLoading} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <RecentContacts loading={isLoading} />

          {/* Quick actions card */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-card-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickActionButton
                href="/dashboard/contacts/new"
                icon={<UsersIcon className="h-5 w-5" />}
                label="Add Contact"
              />
              <QuickActionButton
                href="/dashboard/tasks/new"
                icon={<TasksIcon className="h-5 w-5" />}
                label="Create Task"
              />
              <QuickActionButton
                href="/dashboard/calls/new"
                icon={<PhoneIcon className="h-5 w-5" />}
                label="Make Call"
              />
              <QuickActionButton
                href="/dashboard/calendar/new"
                icon={<CalendarIcon className="h-5 w-5" />}
                label="Schedule Event"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted hover:border-primary/20 transition-colors"
    >
      <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
      <span className="text-sm font-medium text-card-foreground">{label}</span>
    </a>
  );
}

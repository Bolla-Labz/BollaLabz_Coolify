import { DashboardShell } from "@/components/layout/dashboard-shell";

// Force dynamic rendering - prevents static generation which requires Clerk credentials
export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardShell>{children}</DashboardShell>;
}

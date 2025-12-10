"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { QueryProvider } from "@/components/providers/query-provider";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <QueryProvider>
      <div className="min-h-screen bg-background">
        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar - hidden on mobile unless menu is open */}
        <div
          className={`
            fixed inset-y-0 left-0 z-40 transform lg:translate-x-0 transition-transform duration-300
            ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        </div>

        {/* Main content */}
        <div
          className={`transition-all duration-300 ${
            sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-64"
          }`}
        >
          <Header
            onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          />

          <main className="p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </QueryProvider>
  );
}

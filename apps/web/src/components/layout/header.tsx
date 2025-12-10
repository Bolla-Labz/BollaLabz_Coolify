"use client";

import { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";

// Icons
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
);

const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

interface HeaderProps {
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock notifications - in production these would come from an API
  const notifications = [
    { id: "1", title: "New task assigned", message: "You have a new task: Update documentation", time: "5 min ago", unread: true },
    { id: "2", title: "Call reminder", message: "Upcoming call with John Smith in 30 minutes", time: "25 min ago", unread: true },
    { id: "3", title: "Contact updated", message: "Jane Doe's contact information was updated", time: "1 hour ago", unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-background border-b border-border">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left side - Mobile menu & Search */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          {/* Search bar */}
          <div className="relative hidden sm:block">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contacts, tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 lg:w-80 pl-10 pr-4 py-2 rounded-lg bg-muted border border-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Right side - Notifications & User */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Mobile search button */}
          <button className="sm:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <SearchIcon className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Notifications"
            >
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 rounded-lg bg-popover border border-border shadow-lg z-50 animate-fade-in">
                  <div className="p-3 border-b border-border">
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-border last:border-0 hover:bg-muted cursor-pointer transition-colors ${
                            notification.unread ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {notification.unread && (
                              <span className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            )}
                            <div className={notification.unread ? "" : "ml-4"}>
                              <p className="text-sm font-medium text-foreground">
                                {notification.title}
                              </p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-border">
                    <button className="w-full py-2 text-sm text-primary hover:bg-muted rounded-lg transition-colors">
                      View all notifications
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 pl-2 border-l border-border">
            {user && (
              <div className="hidden lg:block text-right">
                <p className="text-sm font-medium text-foreground">
                  {user.fullName || user.firstName || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            )}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

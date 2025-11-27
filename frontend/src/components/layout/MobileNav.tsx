// Last Modified: 2025-11-23 17:30
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  X,
  LayoutDashboard,
  Users,
  MessageSquare,
  CheckSquare,
  Calendar,
  Settings,
  Brain,
  Phone,
  TrendingUp,
  DollarSign,
  Bell,
  Shield,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  {
    title: 'Main',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Contacts', href: '/contacts', icon: Users },
      { title: 'Conversations', href: '/conversations', icon: MessageSquare },
      { title: 'Tasks', href: '/tasks', icon: CheckSquare },
      { title: 'Calendar', href: '/calendar', icon: Calendar },
    ],
  },
  {
    title: 'AI Features',
    items: [
      { title: 'AI Assistant', href: '/ai-assistant', icon: Brain },
      { title: 'Voice Agents', href: '/voice-agents', icon: Phone },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { title: 'Analytics', href: '/analytics', icon: TrendingUp },
      { title: 'Cost Tracking', href: '/costs', icon: DollarSign },
    ],
  },
  {
    title: 'System',
    items: [
      { title: 'Notifications', href: '/notifications', icon: Bell },
      { title: 'Security', href: '/security', icon: Shield },
      { title: 'Integrations', href: '/integrations', icon: Zap },
      { title: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  return (
    <div
      className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 bg-background shadow-xl transition-transform duration-300 lg:hidden',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">BollaLabz</h1>
            <p className="text-xs text-muted-foreground">Command Center</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
          <span className="sr-only">Close menu</span>
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-4">
        <nav className="space-y-6">
          {navItems.map((section) => (
            <div key={section.title}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                          'hover:bg-accent hover:text-accent-foreground',
                          isActive
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground'
                        )
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Status</span>
            <span className="flex items-center gap-1 text-green-600">
              <div className="status-online" />
              Online
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Version</span>
            <span className="font-mono">v0.1.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
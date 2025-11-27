// Last Modified: 2025-11-24 12:55
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CheckSquare,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Brain,
  Phone,
  TrendingUp,
  DollarSign,
  Bell,
  Shield,
  Zap,
  HelpCircle,
  Wallet,
  CreditCard,
  Network,
  Workflow,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { usePrefetchRoute } from '@/hooks/usePrefetchOnHover'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const mainNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and insights',
  },
  {
    title: 'Contacts',
    href: '/contacts',
    icon: Users,
    description: 'Manage relationships',
  },
  {
    title: 'Conversations',
    href: '/conversations',
    icon: MessageSquare,
    description: 'SMS and voice history',
  },
  {
    title: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
    description: 'Task management',
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    description: 'Schedule and events',
  },
  {
    title: 'Workflows',
    href: '/workflows',
    icon: Workflow,
    description: 'Automation & webhooks',
  },
]

const aiFeatures = [
  {
    title: 'AI Assistant',
    href: '/ai-assistant',
    icon: Brain,
    description: 'Context-aware AI',
  },
  {
    title: 'Voice Agents',
    href: '/voice-agents',
    icon: Phone,
    description: 'Intelligent voice system',
  },
]

const analytics = [
  {
    title: 'Financial',
    href: '/financial',
    icon: Wallet,
    description: 'Bank accounts & expenses',
  },
  {
    title: 'Credit Score',
    href: '/credit',
    icon: CreditCard,
    description: 'Credit monitoring',
  },
  {
    title: 'People Analytics',
    href: '/people-analytics',
    icon: Network,
    description: 'Relationship insights',
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: TrendingUp,
    description: 'Performance metrics',
  },
  {
    title: 'Cost Tracking',
    href: '/costs',
    icon: DollarSign,
    description: 'Usage and expenses',
  },
]

const system = [
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
    description: 'Alerts and updates',
  },
  {
    title: 'Security',
    href: '/security',
    icon: Shield,
    description: 'Privacy and security',
  },
  {
    title: 'Integrations',
    href: '/integrations',
    icon: Zap,
    description: 'Connected services',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'System preferences',
  },
]

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation()

  const NavItem = ({ item }: { item: typeof mainNavItems[0] }) => {
    const isActive = location.pathname === item.href
    const Icon = item.icon

    // Prefetch on hover with high priority for main nav items
    const prefetchHandlers = usePrefetchRoute(item.href, {
      priority: 'high',
      delay: 100
    })

    const linkContent = (
      <NavLink
        to={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
          'hover:bg-accent hover:text-accent-foreground',
          isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
          !isOpen && 'justify-center'
        )}
        onMouseEnter={prefetchHandlers.onMouseEnter}
        onMouseLeave={prefetchHandlers.onMouseLeave}
        onTouchStart={prefetchHandlers.onTouchStart}
      >
        <Icon className={cn('h-4 w-4 flex-shrink-0', !isOpen && 'h-5 w-5')} />
        {isOpen && (
          <>
            <span className="flex-1">{item.title}</span>
            {isActive && (
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </>
        )}
      </NavLink>
    )

    if (!isOpen) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return linkContent
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border bg-background transition-all duration-300',
        isOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {isOpen ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">BollaLabz</h1>
              <p className="text-xs text-muted-foreground">Command Center</p>
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn('h-8 w-8', !isOpen && 'absolute -right-4 top-4 z-50 border bg-background shadow-sm')}
        >
          {isOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* Sidebar Content */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {/* Main Navigation */}
          <div>
            {isOpen && (
              <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Main
              </h2>
            )}
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* AI Features */}
          <div>
            {isOpen && (
              <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                AI Features
              </h2>
            )}
            <div className="space-y-1">
              {aiFeatures.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Analytics */}
          <div>
            {isOpen && (
              <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Analytics
              </h2>
            )}
            <div className="space-y-1">
              {analytics.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* System */}
          <div>
            {isOpen && (
              <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                System
              </h2>
            )}
            <div className="space-y-1">
              {system.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>
        </nav>
      </ScrollArea>

      {/* Sidebar Footer */}
      <div className="border-t border-border p-4">
        {isOpen ? (
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
        ) : (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Help & Support</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </aside>
  )
}
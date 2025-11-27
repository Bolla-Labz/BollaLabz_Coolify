// Last Modified: 2025-11-24 02:30
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Menu,
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  Command,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import toast from 'react-hot-toast'

interface TopBarProps {
  onMenuClick: () => void
  isSidebarOpen: boolean
}

export function TopBar({ onMenuClick, isSidebarOpen }: TopBarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [notifications, setNotifications] = useState(3) // Mock notification count
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const connectionStatus = useConnectionStatus()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  // Mock search commands
  const searchCommands = [
    { id: 1, label: 'Dashboard', action: () => navigate('/dashboard'), icon: '📊' },
    { id: 2, label: 'View Contacts', action: () => navigate('/contacts'), icon: '👥' },
    { id: 3, label: 'Recent Conversations', action: () => navigate('/conversations'), icon: '💬' },
    { id: 4, label: 'My Tasks', action: () => navigate('/tasks'), icon: '✅' },
    { id: 5, label: 'Calendar', action: () => navigate('/calendar'), icon: '📅' },
    { id: 6, label: 'Settings', action: () => navigate('/settings'), icon: '⚙️' },
  ]

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-1 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search or type a command..."
                className="w-96 pl-10 pr-12"
                onFocus={() => setIsSearchOpen(true)}
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden"
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2 px-2">
            {connectionStatus.status === 'connected' && (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Wifi className="h-4 w-4" />
                <span className="hidden sm:inline">Connected</span>
              </div>
            )}

            {connectionStatus.status === 'reconnecting' && (
              <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">
                  Reconnecting... ({connectionStatus.attempt}/{connectionStatus.maxAttempts})
                </span>
              </div>
            )}

            {connectionStatus.status === 'disconnected' && (
              <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                <WifiOff className="h-4 w-4" />
                <span className="hidden sm:inline">Disconnected</span>
              </div>
            )}

            {connectionStatus.status === 'failed' && (
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <WifiOff className="h-4 w-4" />
                <span className="hidden sm:inline">{connectionStatus.message || 'Connection failed'}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="h-6 text-xs"
                >
                  Refresh
                </Button>
              </div>
            )}
          </div>

          {/* AI Assistant Quick Access */}
          <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden lg:inline">AI Assistant</span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {notifications}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-1 p-2">
                <div className="rounded-lg p-2 hover:bg-accent">
                  <p className="text-sm font-medium">New contact added</p>
                  <p className="text-xs text-muted-foreground">John Doe was added to your contacts</p>
                  <p className="text-xs text-muted-foreground mt-1">2 minutes ago</p>
                </div>
                <div className="rounded-lg p-2 hover:bg-accent">
                  <p className="text-sm font-medium">Task completed</p>
                  <p className="text-xs text-muted-foreground">Follow up with client - marked as done</p>
                  <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                </div>
                <div className="rounded-lg p-2 hover:bg-accent">
                  <p className="text-sm font-medium">Voice call received</p>
                  <p className="text-xs text-muted-foreground">Incoming call from +1 234-567-8900</p>
                  <p className="text-xs text-muted-foreground mt-1">3 hours ago</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center justify-center">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar} alt={user?.name || user?.fullName || 'User'} />
                  <AvatarFallback>
                    {(user?.name || user?.fullName)?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name || user?.fullName || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/help')}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Command Palette */}
      <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <CommandInput placeholder="Search or type a command..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            {searchCommands.map((command) => (
              <CommandItem
                key={command.id}
                onSelect={() => {
                  command.action()
                  setIsSearchOpen(false)
                }}
              >
                <span className="mr-2">{command.icon}</span>
                <span>{command.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Recent">
            <CommandItem>
              <span className="mr-2">📞</span>
              <span>Call from John Doe</span>
            </CommandItem>
            <CommandItem>
              <span className="mr-2">💬</span>
              <span>Message from Jane Smith</span>
            </CommandItem>
            <CommandItem>
              <span className="mr-2">✅</span>
              <span>Complete project review</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  )
}
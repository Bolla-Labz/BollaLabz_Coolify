// Last Modified: 2025-11-23 17:30
import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileNav } from './MobileNav'
import ChatBot from '@/components/ai/chat/ChatBot'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTheme } from '@/hooks/useTheme'

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { theme } = useTheme()

  // Close mobile nav on route change
  useEffect(() => {
    setIsMobileNavOpen(false)
  }, [location])

  // Manage sidebar state based on screen size
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false)
    } else {
      setIsSidebarOpen(true)
    }
  }, [isMobile])

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileNavOpen])

  return (
    <div className="relative min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      )}

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          !isMobile && isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        )}
      >
        {/* Top Bar */}
        <TopBar
          onMenuClick={() => {
            if (isMobile) {
              setIsMobileNavOpen(!isMobileNavOpen)
            } else {
              setIsSidebarOpen(!isSidebarOpen)
            }
          }}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

        {/* Footer (optional) */}
        <footer className="border-t border-border py-4">
          <div className="px-4 md:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
                <div className="mb-2 sm:mb-0">
                  <span>BollaLabz Command Center v0.1.0</span>
                  <span className="mx-2">•</span>
                  <span>Zero Cognitive Load</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span>Status: Online</span>
                  <span className="status-online"></span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile overlay when sidebar is open */}
      {isMobile && isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* AI Chatbot Assistant */}
      <ChatBot />
    </div>
  )
}
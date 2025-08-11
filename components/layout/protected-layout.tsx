'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { Sidebar } from '@/components/layout/sidebar'
import { ToastProvider } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Menu, X, Package as PackageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProtectedLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
}

export const ProtectedLayout = ({ children, showSidebar = true }: ProtectedLayoutProps) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const handleToggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  const handleCloseMobileSidebar = () => {
    setIsMobileSidebarOpen(false)
  }

  return (
    <ToastProvider>
      <ModalProvider>
        <ProtectedRoute>
          {showSidebar ? (
            <div className="flex h-screen bg-background">
              {/* Desktop Sidebar */}
              <div className="hidden lg:block">
                <Sidebar />
              </div>

              {/* Mobile Sidebar Overlay */}
              {isMobileSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                  <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={handleCloseMobileSidebar}
                  />
                  <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border">
                    <Sidebar onMobileClose={handleCloseMobileSidebar} />
                  </div>
                </div>
              )}

              {/* Main Content */}
              <main className="flex-1 overflow-hidden">
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between p-1 xs:p-2 sm:p-3 border-b border-border bg-card min-h-[44px]">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleMobileSidebar}
                    className="h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 p-1"
                  >
                    <Menu className="h-4 w-4 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <div className="flex items-center space-x-1">
                    <div className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 flex items-center justify-center">
                      <PackageIcon className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <span className="text-xs xs:text-sm sm:text-base font-bold text-foreground">
                      LUMO
                    </span>
                  </div>
                  <div className="w-7 xs:w-8 sm:w-9" /> {/* Spacer for centering */}
                </div>

                <div className="h-[calc(100vh-44px)] lg:h-full overflow-y-auto custom-scrollbar">
                  <div className="p-1 xs:p-2 sm:p-3 lg:p-4">
                    {children}
                  </div>
                </div>
              </main>
            </div>
          ) : (
            <div className="min-h-screen bg-background">
              <div className="container mx-auto p-4 lg:p-6">
                {children}
              </div>
            </div>
          )}
        </ProtectedRoute>
      </ModalProvider>
    </ToastProvider>
  )
}
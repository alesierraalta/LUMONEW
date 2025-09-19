'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { Sidebar } from '@/components/layout/sidebar'
import { ToastProvider } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { ConnectionIndicator } from '@/components/ui/connection-status'
import { UserMenu } from '@/components/auth/user-menu'

interface ProtectedLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
}

export const ProtectedLayout = ({ children, showSidebar = true }: ProtectedLayoutProps) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const { theme } = useTheme()

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
                 {/* Enhanced Mobile Header */}
                 <div className="lg:hidden flex items-center justify-between p-2 sm:p-3 border-b border-border bg-card min-h-[64px] sm:min-h-[72px]">
                   <Button
                     variant="ghost"
                     size="icon"
                     onClick={handleToggleMobileSidebar}
                     className="h-8 w-8 sm:h-9 sm:w-9 p-1 hover:bg-accent/50"
                   >
                     <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                   </Button>
                   
                   <div className="flex items-center justify-center">
                     <div className="h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center">
                       <Image 
                         src="/logo.png" 
                         alt="LUMO Logo" 
                         width={128} 
                         height={128} 
                         className={cn(
                           "h-full w-full object-contain",
                           (theme === 'dark' || theme === 'black') && "invert"
                         )}
                       />
                     </div>
                   </div>
                  
                  <div className="flex items-center space-x-2">
                    <ConnectionIndicator />
                    <UserMenu />
                  </div>
                </div>

                 <div className="h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)] lg:h-full overflow-y-auto custom-scrollbar">
                  <div className="p-2 sm:p-3 lg:p-4">
                    {children}
                  </div>
                </div>
              </main>
            </div>
          ) : (
            <div className="min-h-screen bg-background">
              <div className="container mx-auto p-3 sm:p-4 lg:p-6">
                {children}
              </div>
            </div>
          )}
        </ProtectedRoute>
      </ModalProvider>
    </ToastProvider>
  )
}
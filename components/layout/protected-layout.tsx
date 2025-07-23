'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Sidebar } from '@/components/layout/sidebar'
import { ToastProvider } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'
import { ProtectedRoute } from '@/components/auth/protected-route'

interface ProtectedLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
}

export const ProtectedLayout = ({ children, showSidebar = true }: ProtectedLayoutProps) => {
  return (
    <ToastProvider>
      <ModalProvider>
        <ProtectedRoute>
          {showSidebar ? (
            <div className="flex h-screen bg-background">
              <Sidebar />
              <main className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto custom-scrollbar">
                  {children}
                </div>
              </main>
            </div>
          ) : (
            <div className="min-h-screen bg-background">
              {children}
            </div>
          )}
        </ProtectedRoute>
      </ModalProvider>
    </ToastProvider>
  )
}
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Sidebar } from '@/components/layout/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CardProvider } from '@/components/cards/card-provider'
import { CardContainer } from '@/components/cards/card-container'
import { ToastProvider } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'
import { Settings, User, Bell, Palette, Database, Shield } from 'lucide-react'
import { setLocale } from '@/lib/actions/locale'

// Mock user data
const mockUser = {
  id: '1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin' as const,
  avatar: undefined,
  isActive: true,
  lastLogin: new Date(),
  permissions: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canViewReports: true,
    canManageUsers: true,
    canBulkOperations: true,
    canQuickStock: true,
    canViewAuditLogs: true
  },
  accessibleLocations: ['1', '2', '3'],
  defaultLocation: '1',
  preferences: {
    language: 'es' as const,
    theme: 'light' as const,
    dateFormat: 'DD/MM/YYYY',
    currency: 'USD',
    notifications: {
      email: true,
      push: true,
      lowStock: true,
      bulkOperations: true
    }
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'system',
  updatedBy: 'system'
}

function SettingsContent() {
  const [isClient, setIsClient] = useState(false)
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  const handleMount = useCallback(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    handleMount()
  }, [handleMount])

  const handleLanguageChange = async (newLocale: string) => {
    await setLocale(newLocale)
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-fade-in">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Information Cards */}
      <CardContainer
        layout="grid"
        columns={3}
        maxCards={6}
        className="mb-6"
      />

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('profileSettings')}
            </CardTitle>
            <CardDescription>
              {t('profileDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  defaultValue="Alejandro Sierraalta"
                  className="focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="alesierraalta@gmail.com"
                  className="focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t('language')}</Label>
              <Select defaultValue={locale} onValueChange={handleLanguageChange}>
                <SelectTrigger className="focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of your application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select defaultValue="light">
                <SelectTrigger className="focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select defaultValue="USD">
                <SelectTrigger className="focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="VES">VES (Bs.)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between hover:bg-muted/50 p-2 rounded transition-colors">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
            </div>
            <div className="border-t my-4"></div>
            <div className="flex items-center justify-between hover:bg-muted/50 p-2 rounded transition-colors">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications in your browser
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
            </div>
            <div className="border-t my-4"></div>
            <div className="flex items-center justify-between hover:bg-muted/50 p-2 rounded transition-colors">
              <div className="space-y-0.5">
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when items are running low
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Settings
            </CardTitle>
            <CardDescription>
              Configure system-wide settings and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select defaultValue="DD/MM/YYYY">
                <SelectTrigger className="focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between hover:bg-muted/50 p-2 rounded transition-colors">
              <div className="space-y-0.5">
                <Label>Auto-save Changes</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save changes as you type
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button size="lg" className="hover:scale-105 transition-transform">
            {t('saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <ToastProvider>
      <ModalProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <CardProvider
                currentPage="settings"
                currentUser={mockUser}
              >
                <SettingsContent />
              </CardProvider>
            </div>
          </main>
        </div>
      </ModalProvider>
    </ToastProvider>
  )
}
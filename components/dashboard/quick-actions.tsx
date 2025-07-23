'use client'

import { Button } from '@/components/ui/button'
import { Plus, Package, FolderOpen, MapPin, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export function QuickActions() {
  const router = useRouter()
  const t = useTranslations('quickActions')
  
  const actions = [
    {
      label: t('addItem'),
      icon: Package,
      href: '/inventory/create',
      variant: 'default' as const
    },
    {
      label: t('newCategory'),
      icon: FolderOpen,
      href: '/categories/create',
      variant: 'outline' as const
    },
    {
      label: t('addLocation'),
      icon: MapPin,
      href: '/locations/create',
      variant: 'outline' as const
    },
    {
      label: t('addUser'),
      icon: Users,
      href: '/users/create',
      variant: 'outline' as const
    }
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <div className="flex items-center space-x-2">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant}
          size="sm"
          className="flex items-center space-x-2"
          onClick={() => handleNavigation(action.href)}
        >
          <action.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{action.label}</span>
        </Button>
      ))}
    </div>
  )
}
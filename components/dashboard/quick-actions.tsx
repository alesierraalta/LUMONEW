'use client'

import { Button } from '@/components/ui/button'
import { Plus, Package, FolderOpen, MapPin, Users } from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      label: 'Add Item',
      icon: Package,
      href: '/inventory/new',
      variant: 'default' as const
    },
    {
      label: 'New Category',
      icon: FolderOpen,
      href: '/categories/new',
      variant: 'outline' as const
    },
    {
      label: 'Add Location',
      icon: MapPin,
      href: '/locations/new',
      variant: 'outline' as const
    },
    {
      label: 'Add User',
      icon: Users,
      href: '/users/new',
      variant: 'outline' as const
    }
  ]

  return (
    <div className="flex items-center space-x-2">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant}
          size="sm"
          className="flex items-center space-x-2"
          onClick={() => {
            // In a real app, this would navigate to the appropriate page
            console.log(`Navigate to ${action.href}`)
          }}
        >
          <action.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{action.label}</span>
        </Button>
      ))}
    </div>
  )
}
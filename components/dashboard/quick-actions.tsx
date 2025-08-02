'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, FolderOpen, MapPin, Users, Zap } from 'lucide-react'
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
      color: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800',
      description: 'Agregar producto'
    },
    {
      label: t('newCategory'),
      icon: FolderOpen,
      href: '/categories/create',
      color: 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800',
      description: 'Nueva categoría'
    },
    {
      label: t('addLocation'),
      icon: MapPin,
      href: '/locations/create',
      color: 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800',
      description: 'Agregar ubicación'
    },
    {
      label: t('addUser'),
      icon: Users,
      href: '/users/create',
      color: 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800',
      description: 'Nuevo usuario'
    }
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Desktop: Prominent tool buttons */}
      <div className="hidden lg:flex items-center gap-2">
        <Badge variant="secondary" className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 text-blue-700 dark:text-gray-300 border-blue-200 dark:border-gray-600">
          <Zap className="h-3 w-3 mr-1" />
          Herramientas Rápidas
        </Badge>
        {actions.map((action, index) => (
          <Button
            key={index}
            className={`${action.color} text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
            size="sm"
            onClick={() => handleNavigation(action.href)}
          >
            <action.icon className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Tablet: Compact but visible */}
      <div className="hidden md:flex lg:hidden items-center gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            className={`${action.color} text-white shadow-md hover:shadow-lg transition-all duration-200`}
            size="sm"
            onClick={() => handleNavigation(action.href)}
          >
            <action.icon className="h-4 w-4" />
            <span className="ml-1 text-xs">{action.description}</span>
          </Button>
        ))}
      </div>

      {/* Mobile: Icon grid */}
      <div className="flex md:hidden items-center gap-1">
        {actions.slice(0, 2).map((action, index) => (
          <Button
            key={index}
            className={`${action.color} text-white shadow-md h-9 w-9 p-0`}
            size="sm"
            onClick={() => handleNavigation(action.href)}
            title={action.label}
          >
            <action.icon className="h-4 w-4" />
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 border-dashed"
          title="Más opciones"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
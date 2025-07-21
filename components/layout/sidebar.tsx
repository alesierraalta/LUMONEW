'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  MapPin,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Box
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Inventario',
    icon: Package,
    isSection: true,
    children: [
      {
        name: 'Stock',
        href: '/inventory',
        icon: Box,
      },
      {
        name: 'Categorías',
        href: '/categories',
        icon: FolderOpen,
      },
      {
        name: 'Ubicaciones',
        href: '/locations',
        icon: MapPin,
      },
    ]
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['Inventario'])
  const pathname = usePathname()

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionName)
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    )
  }

  const renderNavigationItem = (item: any) => {
    if (item.isSection) {
      const isExpanded = expandedSections.includes(item.name)
      const hasActiveChild = item.children?.some((child: any) => pathname === child.href)
      
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleSection(item.name)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              hasActiveChild
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
              collapsed && "justify-center"
            )}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </div>
            {!collapsed && (
              isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )
            )}
          </button>
          
          {!collapsed && isExpanded && item.children && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map((child: any) => {
                const isActive = pathname === child.href
                return (
                  <Link
                    key={child.name}
                    href={child.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <child.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{child.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    } else {
      const isActive = pathname === item.href
      return (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent",
            collapsed && "justify-center"
          )}
        >
          <item.icon className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>{item.name}</span>}
        </Link>
      )
    }
  }

  return (
    <div className={cn(
      "flex flex-col bg-card border-r border-border sidebar-transition",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className={cn(
          "flex items-center space-x-2",
          collapsed && "justify-center"
        )}>
          <Box className="h-8 w-8 text-primary" />
          {!collapsed && (
            <span className="text-xl font-bold text-foreground">
              LUMO2
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map(renderNavigationItem)}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className={cn(
          "flex items-center space-x-3",
          collapsed && "justify-center"
        )}>
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            AS
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Alejandro Sierraalta
              </p>
              <p className="text-xs text-muted-foreground truncate">
                alesierraalta@gmail.com
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
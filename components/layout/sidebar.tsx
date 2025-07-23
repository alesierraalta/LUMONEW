'use client'

import { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { NavigationItem, createNavigationConfig, getNavigationIcons } from '@/lib/navigation-config'

interface NavigationItemProps {
  item: NavigationItem
  pathname: string
  collapsed: boolean
  expandedSections: string[]
  onToggleSection: (sectionName: string) => void
  t: (key: string) => string
}

const NavigationItemComponent = memo(({
  item,
  pathname,
  collapsed,
  expandedSections,
  onToggleSection,
  t
}: NavigationItemProps) => {

  if (item.isSection) {
    const isExpanded = expandedSections.includes(item.name)
    const hasActiveChild = item.children?.some((child: NavigationItem) => pathname === child.href)
    
    return (
      <div key={item.name} className="animate-fade-in">
        <button
          onClick={() => onToggleSection(item.name)}
          className={cn(
            "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium sidebar-nav-item transition-colors",
            hasActiveChild
              ? "bg-accent text-foreground active"
              : "text-muted-foreground hover:text-foreground hover:bg-accent",
            collapsed && "justify-center"
          )}
          aria-expanded={isExpanded}
          aria-label={t('sidebar.toggleSection')}
        >
          <div className="flex items-center space-x-3">
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{t(item.translationKey)}</span>}
          </div>
          {!collapsed && (
            <div className={cn("transition-transform duration-200", isExpanded && "rotate-180")}>
              <ChevronDown className="h-4 w-4" />
            </div>
          )}
        </button>
        
        <div className={cn(
          "overflow-hidden transition-all duration-200 ml-4",
          !collapsed && isExpanded ? "max-h-96 mt-1" : "max-h-0"
        )}>
          {!collapsed && item.children && (
            <div className="space-y-1 py-2">
              {item.children.map((child: NavigationItem) => {
                const isActive = pathname === child.href
                return (
                  <Link
                    key={child.name}
                    href={child.href || '#'}
                    prefetch={true}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium sidebar-nav-item transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground active"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                    aria-label={t('sidebar.navigateTo')}
                  >
                    <child.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{t(child.translationKey)}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  } else {
    const isActive = pathname === item.href
    return (
      <Link
        key={item.name}
        href={item.href || '#'}
        prefetch={true}
        className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium sidebar-nav-item transition-colors animate-fade-in",
          isActive
            ? "bg-primary text-primary-foreground active"
            : "text-muted-foreground hover:text-foreground hover:bg-accent",
          collapsed && "justify-center"
        )}
        aria-label={t('sidebar.navigateTo')}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span>{t(item.translationKey)}</span>}
      </Link>
    )
  }
})

NavigationItemComponent.displayName = 'NavigationItem'

export const Sidebar = memo(() => {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['Inventario'])
  const [navigation, setNavigation] = useState<NavigationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const t = useTranslations()
  const locale = useLocale()

  // Load navigation configuration and icons asynchronously
  useEffect(() => {
    let isMounted = true
    
    const loadNavigation = async () => {
      try {
        const icons = await getNavigationIcons()
        if (isMounted) {
          const navigationConfig = createNavigationConfig(icons, locale)
          setNavigation(navigationConfig)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Failed to load navigation:', error)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadNavigation()
    
    return () => {
      isMounted = false
    }
  }, [locale])

  const toggleSection = useCallback((sectionName: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionName)
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    )
  }, [])

  const handleCollapse = useCallback(() => {
    setCollapsed(prev => !prev)
  }, [])

  // Memoize navigation items with smaller dependency arrays
  const navigationItems = useMemo(() => {
    if (isLoading || navigation.length === 0) {
      return <div className="p-4 text-center text-muted-foreground">{t('common.loading')}</div>
    }

    return navigation.map(item => (
      <NavigationItemComponent
        key={item.name}
        item={item}
        pathname={pathname}
        collapsed={collapsed}
        expandedSections={expandedSections}
        onToggleSection={toggleSection}
        t={t}
      />
    ))
  }, [navigation, pathname, collapsed, expandedSections, toggleSection, isLoading, t])

  // Memoize collapsed classes
  const collapsedClasses = useMemo(() => cn(
    "flex flex-col bg-card border-r border-border transition-all duration-300",
    collapsed ? "w-16" : "w-64"
  ), [collapsed])

  // Memoize header content
  const headerContent = useMemo(() => (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div className={cn(
        "flex items-center space-x-2 transition-all duration-200",
        collapsed && "justify-center"
      )}>
        <div className="h-8 w-8 text-primary flex items-center justify-center">
          📦
        </div>
        {!collapsed && (
          <span className="text-xl font-bold text-foreground transition-opacity duration-200">
            LUMO2
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCollapse}
        className="h-8 w-8 transition-transform hover:scale-105"
        aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
    </div>
  ), [collapsed, handleCollapse])

  // Memoize user profile section
  const userProfile = useMemo(() => (
    <div className="p-4 border-t border-border">
      <div className={cn(
        "flex items-center space-x-3 rounded-lg p-2 transition-all duration-200 hover:bg-accent",
        collapsed && "justify-center"
      )}>
        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
          AS
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 transition-opacity duration-200">
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
  ), [collapsed])

  return (
    <div className={collapsedClasses}>
      {headerContent}
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 custom-scrollbar overflow-y-auto">
        {navigationItems}
      </nav>

      {/* User Profile */}
      {userProfile}
    </div>
  )
})

Sidebar.displayName = 'Sidebar'
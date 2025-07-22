'use client'

import { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { NavigationItem, createNavigationConfig, getNavigationIcons, getAllRoutes } from '@/lib/navigation-config'

interface NavigationItemProps {
  item: NavigationItem
  pathname: string
  collapsed: boolean
  expandedSections: string[]
  onToggleSection: (sectionName: string) => void
  isNavigating: boolean
  router: ReturnType<typeof useRouter> // Shared router instance
  onNavigationStart: (href: string) => void
  onNavigationEnd: (href: string) => void
}

const NavigationItemComponent = memo(({ 
  item, 
  pathname, 
  collapsed, 
  expandedSections, 
  onToggleSection,
  isNavigating,
  router,
  onNavigationStart,
  onNavigationEnd
}: NavigationItemProps) => {
  // Use refs to track cleanup functions instead of DOM manipulation
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleNavigation = useCallback(async (href: string) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Use React state for loading feedback instead of DOM manipulation
    onNavigationStart(href)
    
    try {
      // Use router.push for navigation
      await router.push(href)
    } finally {
      // Clean up loading state with proper timeout management
      timeoutRef.current = setTimeout(() => {
        onNavigationEnd(href)
        timeoutRef.current = null
      }, 300)
    }
  }, [router, onNavigationStart, onNavigationEnd])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (item.isSection) {
    const isExpanded = expandedSections.includes(item.name)
    const hasActiveChild = item.children?.some((child: NavigationItem) => pathname === child.href)
    
    return (
      <div key={item.name} className="animate-fade-in">
        <button
          onClick={() => onToggleSection(item.name)}
          className={cn(
            "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium sidebar-nav-item",
            hasActiveChild
              ? "bg-accent text-foreground active"
              : "text-muted-foreground hover:text-foreground hover:bg-accent",
            collapsed && "justify-center"
          )}
          aria-expanded={isExpanded}
          aria-label={`Toggle ${item.name} section`}
        >
          <div className="flex items-center space-x-3">
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </div>
          {!collapsed && (
            <div className={cn("sidebar-icon-spin", isExpanded && "expanded")}>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          )}
        </button>
        
        <div className={cn(
          "sidebar-section-expand ml-4 mt-1",
          !collapsed && isExpanded && "expanded"
        )}>
          {!collapsed && item.children && (
            <div className="space-y-1 py-2">
              {item.children.map((child: NavigationItem) => {
                const isActive = pathname === child.href
                const isChildNavigating = isNavigating && pathname === child.href
                return (
                  <button
                    key={child.name}
                    onClick={() => child.href && handleNavigation(child.href)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium w-full sidebar-nav-item animate-slide-in",
                      isActive
                        ? "bg-primary text-primary-foreground active"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                      isNavigating && "pointer-events-none opacity-50"
                    )}
                    disabled={isNavigating}
                    aria-label={`Navigate to ${child.name}`}
                  >
                    <child.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{child.name}</span>
                    {isChildNavigating && (
                      <Loader2 className="h-3 w-3 animate-spin ml-auto" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  } else {
    const isActive = pathname === item.href
    const isItemNavigating = isNavigating && pathname === item.href
    return (
      <button
        key={item.name}
        onClick={() => item.href && handleNavigation(item.href)}
        className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium w-full sidebar-nav-item animate-fade-in",
          isActive
            ? "bg-primary text-primary-foreground active"
            : "text-muted-foreground hover:text-foreground hover:bg-accent",
          collapsed && "justify-center",
          isNavigating && "pointer-events-none opacity-50"
        )}
        disabled={isNavigating}
        aria-label={`Navigate to ${item.name}`}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span>{item.name}</span>}
        {isItemNavigating && (
          <Loader2 className="h-3 w-3 animate-spin ml-auto" />
        )}
      </button>
    )
  }
})

NavigationItemComponent.displayName = 'NavigationItem'

export const Sidebar = memo(() => {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['Inventario'])
  const [isNavigating, setIsNavigating] = useState(false)
  const [navigation, setNavigation] = useState<NavigationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter() // Single router instance shared across all navigation items
  const prefetchedRef = useRef(false) // Track prefetch status to prevent duplicates

  // Load navigation configuration and icons asynchronously
  useEffect(() => {
    let isMounted = true
    
    const loadNavigation = async () => {
      try {
        const icons = await getNavigationIcons()
        if (isMounted) {
          const navigationConfig = createNavigationConfig(icons)
          setNavigation(navigationConfig)
          setIsLoading(false)
          
          // Optimized prefetching - only once per component lifecycle
          if (!prefetchedRef.current) {
            prefetchedRef.current = true
            // Prefetch with deduplication and delay to not block initial render
            setTimeout(() => {
              const routes = getAllRoutes(navigationConfig)
              routes.forEach(route => {
                router.prefetch(route)
              })
            }, 100)
          }
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
  }, [router])

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

  const handleNavigationStart = useCallback((href: string) => {
    setIsNavigating(true)
  }, [])

  const handleNavigationEnd = useCallback((href: string) => {
    setIsNavigating(false)
  }, [])

  // Split memoization for better performance - memoize collapsed state separately
  const collapsedClasses = useMemo(() => cn(
    "flex flex-col bg-card border-r border-border sidebar-transition",
    collapsed ? "w-16" : "w-64"
  ), [collapsed])

  // Memoize header content separately
  const headerContent = useMemo(() => (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div className={cn(
        "flex items-center space-x-2 animate-fade-in",
        collapsed && "justify-center"
      )}>
        {/* Use dynamic import for Box icon */}
        <div className="h-8 w-8 text-primary flex items-center justify-center">
          📦
        </div>
        {!collapsed && (
          <span className="text-xl font-bold text-foreground animate-slide-in">
            LUMO2
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCollapse}
        className="h-8 w-8 hover-lift"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
    </div>
  ), [collapsed, handleCollapse])

  // Memoize navigation items with smaller dependency arrays
  const navigationItems = useMemo(() => {
    if (isLoading || navigation.length === 0) {
      return <div className="p-4 text-center text-muted-foreground">Loading...</div>
    }

    return navigation.map(item => (
      <NavigationItemComponent
        key={item.name}
        item={item}
        pathname={pathname}
        collapsed={collapsed}
        expandedSections={expandedSections}
        onToggleSection={toggleSection}
        isNavigating={isNavigating}
        router={router}
        onNavigationStart={handleNavigationStart}
        onNavigationEnd={handleNavigationEnd}
      />
    ))
  }, [navigation, pathname, collapsed, expandedSections, toggleSection, isNavigating, router, handleNavigationStart, handleNavigationEnd, isLoading])

  // Memoize user profile section
  const userProfile = useMemo(() => (
    <div className="p-4 border-t border-border">
      <div className={cn(
        "flex items-center space-x-3 animate-fade-in hover-lift rounded-lg p-2 transition-all duration-200",
        collapsed && "justify-center"
      )}>
        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
          AS
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 animate-slide-in">
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
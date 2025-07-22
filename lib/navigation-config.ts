import { LucideIcon } from 'lucide-react'

export interface NavigationItem {
  name: string
  href?: string
  icon: LucideIcon
  isSection?: boolean
  children?: NavigationItem[]
}

// Dynamic icon imports to reduce bundle size
export const getNavigationIcons = async () => {
  const [
    { LayoutDashboard },
    { Package },
    { FolderOpen },
    { MapPin },
    { Users },
    { Settings },
    { Box },
  ] = await Promise.all([
    import('lucide-react').then(mod => ({ LayoutDashboard: mod.LayoutDashboard })),
    import('lucide-react').then(mod => ({ Package: mod.Package })),
    import('lucide-react').then(mod => ({ FolderOpen: mod.FolderOpen })),
    import('lucide-react').then(mod => ({ MapPin: mod.MapPin })),
    import('lucide-react').then(mod => ({ Users: mod.Users })),
    import('lucide-react').then(mod => ({ Settings: mod.Settings })),
    import('lucide-react').then(mod => ({ Box: mod.Box }))
  ])

  return {
    LayoutDashboard,
    Package,
    FolderOpen,
    MapPin,
    Users,
    Settings,
    Box
  }
}

// Static navigation configuration - moved out of component to prevent recreation
export const createNavigationConfig = (icons: Awaited<ReturnType<typeof getNavigationIcons>>): NavigationItem[] => [
  {
    name: 'Dashboard',
    href: '/',
    icon: icons.LayoutDashboard,
  },
  {
    name: 'Inventario',
    icon: icons.Package,
    isSection: true,
    children: [
      {
        name: 'Stock',
        href: '/inventory',
        icon: icons.Box,
      },
      {
        name: 'Categorías',
        href: '/categories',
        icon: icons.FolderOpen,
      },
      {
        name: 'Ubicaciones',
        href: '/locations',
        icon: icons.MapPin,
      },
    ]
  },
  {
    name: 'Users',
    href: '/users',
    icon: icons.Users,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: icons.Settings,
  },
]

// Extract all routes for prefetching with deduplication
export const getAllRoutes = (navigation: NavigationItem[]): string[] => {
  const routes = new Set<string>()
  
  const extractRoutes = (items: NavigationItem[]) => {
    items.forEach(item => {
      if (item.href) {
        routes.add(item.href)
      }
      if (item.children) {
        extractRoutes(item.children)
      }
    })
  }
  
  extractRoutes(navigation)
  return Array.from(routes)
}
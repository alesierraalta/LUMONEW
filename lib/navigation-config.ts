import { LucideIcon } from 'lucide-react'

export interface NavigationItem {
  name: string
  translationKey: string
  href?: string
  icon: LucideIcon
  isSection?: boolean
  children?: NavigationItem[]
}

// Optimized icon imports - import all at once for better performance
export const getNavigationIcons = async () => {
  const {
    LayoutDashboard,
    Package,
    FolderOpen,
    MapPin,
    Users,
    Settings,
    Box,
    Briefcase,
    Trash2
  } = await import('lucide-react')

  return {
    LayoutDashboard,
    Package,
    FolderOpen,
    MapPin,
    Users,
    Settings,
    Box,
    Briefcase,
    Trash2
  }
}

// Static navigation configuration - moved out of component to prevent recreation
export const createNavigationConfig = (icons: Awaited<ReturnType<typeof getNavigationIcons>>, locale: string = 'es'): NavigationItem[] => [
  {
    name: 'Dashboard',
    translationKey: 'navigation.dashboard',
    href: `/${locale}`,
    icon: icons.LayoutDashboard,
  },
  {
    name: 'Proyectos',
    translationKey: 'navigation.projects',
    href: `/${locale}/projects`,
    icon: icons.Briefcase,
  },

  {
    name: 'Inventario',
    translationKey: 'navigation.inventory',
    icon: icons.Package,
    isSection: true,
    children: [
      {
        name: 'Stock',
        translationKey: 'navigation.stock',
        href: `/${locale}/inventory`,
        icon: icons.Box,
      },
      {
        name: 'Categorías',
        translationKey: 'navigation.categories',
        href: `/${locale}/categories`,
        icon: icons.FolderOpen,
      },
      {
        name: 'Ubicaciones',
        translationKey: 'navigation.locations',
        href: `/${locale}/locations`,
        icon: icons.MapPin,
      },
    ]
  },
  {
    name: 'Users',
    translationKey: 'navigation.users',
    href: `/${locale}/users`,
    icon: icons.Users,
  },
  {
    name: 'Deleted Items',
    translationKey: 'navigation.deleted_items',
    href: `/${locale}/deleted-items`,
    icon: icons.Trash2,
  },
  {
    name: 'Settings',
    translationKey: 'navigation.settings',
    href: `/${locale}/settings`,
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
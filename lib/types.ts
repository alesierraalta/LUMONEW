import { ReactNode } from 'react'

// ============================================================================
// SPANISH FIELD LABELS FOR PRODUCTS
// ============================================================================
export interface SpanishFieldLabels {
  sku: 'SKU'
  producto: 'Producto'
  descripcion: 'Descripción'
  categoria: 'Categoría'
  precio: 'Precio'
  costo: 'Costo'
  margen: 'Margen'
  stockActual: 'Stock Actual'
  nivelMinimo: 'Nivel Mínimo'
  estado: 'Estado'
  ubicacion: 'Ubicación'
  ultimaActualizacion: 'Última Actualización'
  acciones: 'Acciones'
}

// ============================================================================
// ENHANCED INVENTORY ITEM WITH SPANISH SUPPORT
// ============================================================================
export interface InventoryItem {
  id: string
  sku: string
  name: string // Producto
  description?: string // Descripción - Optional since it doesn't exist in database
  categoryId: string
  category?: Category // Categoría
  price: number // Precio
  cost: number // Costo
  margin: number // Margen
  currentStock: number // Stock Actual
  minimumLevel: number // Nivel Mínimo
  maximumLevel?: number
  reorderPoint?: number
  status: 'active' | 'inactive' | 'discontinued' | 'pending' // Estado
  locationId: string
  location?: Location // Ubicación
  dimensions?: {
    length: number
    width: number
    height: number
    weight: number
    unit: 'cm' | 'in' | 'mm'
    weightUnit: 'kg' | 'lb' | 'g'
  }
  supplier?: {
    id: string
    name: string
    contactInfo: string
  }
  barcode?: string
  tags: string[]
  images: string[]
  lastUpdated: Date // Última Actualización
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
  // Real-time sync
  syncStatus: 'synced' | 'pending' | 'error'
  lastSyncAt?: Date
  // Automated management
  autoReorder: boolean
  autoReorderQuantity?: number
  seasonalDemand?: {
    season: 'spring' | 'summer' | 'fall' | 'winter'
    demandMultiplier: number
  }
}

// ============================================================================
// HIERARCHICAL CATEGORY WITH PARENT-CHILD RELATIONSHIPS
// ============================================================================
export interface Category {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
  // Hierarchical structure
  parentId?: string
  parent?: Category
  children?: Category[]
  level: number
  path: string[] // Array of parent IDs for easy traversal
  // Metrics
  itemCount: number
  totalValue: number
  // Status and management
  isActive: boolean
  sortOrder: number
  // Audit
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
  // Real-time sync
  syncStatus: 'synced' | 'pending' | 'error'
  lastSyncAt?: Date
}

// ============================================================================
// SIMPLIFIED LOCATION - SHELF/STORAGE CONTAINER SYSTEM
// ============================================================================
export interface Location {
  id: string
  name: string // Shelf/storage area identifier
  description?: string // Brief details about the storage space
  itemQuantity: number // Number of items currently stored
}

// ============================================================================
// ENHANCED USER WITH PERMISSIONS
// ============================================================================
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'employee' | 'viewer' | 'auditor'
  avatar?: string
  isActive: boolean
  lastLogin?: Date
  // Permissions
  permissions: {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canViewReports: boolean
    canManageUsers: boolean
    canBulkOperations: boolean
    canQuickStock: boolean
    canViewAuditLogs: boolean
  }
  // Location access
  accessibleLocations: string[]
  defaultLocation?: string
  // Preferences
  preferences: {
    language: 'en' | 'es'
    theme: 'light' | 'dark' | 'auto'
    dateFormat: string
    currency: string
    notifications: {
      email: boolean
      push: boolean
      lowStock: boolean
      bulkOperations: boolean
    }
  }
  // Audit
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}


// ============================================================================
// INVENTORY MOVEMENT TRACKING
// ============================================================================
export interface InventoryMovement {
  id: string
  // Item details
  itemId: string
  itemName: string
  itemSku: string
  // Movement details
  type: 'in' | 'out' | 'transfer' | 'adjustment' | 'return' | 'damaged' | 'expired'
  quantity: number
  unitCost?: number
  totalCost?: number
  // Location details
  fromLocationId?: string
  fromLocationName?: string
  toLocationId?: string
  toLocationName?: string
  // Reference information
  referenceType?: 'purchase_order' | 'sales_order' | 'transfer_order' | 'adjustment' | 'return'
  referenceId?: string
  referenceNumber?: string
  // User and approval
  userId: string
  userName: string
  approvedBy?: string
  approvedAt?: Date
  // Status and tracking
  status: 'pending' | 'approved' | 'completed' | 'cancelled'
  notes?: string
  // Batch and serial tracking
  batchNumber?: string
  serialNumbers?: string[]
  expirationDate?: Date
  // Audit
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

// ============================================================================
// QUICK STOCK OPERATIONS (SUMAR/RESTAR STOCK RÁPIDAMENTE)
// ============================================================================
export interface QuickStockOperation {
  id: string
  // Item details
  itemId: string
  itemName: string
  itemSku: string
  locationId: string
  locationName: string
  // Operation details
  operation: 'add' | 'subtract' // sumar | restar
  quantity: number
  reason: 'received' | 'sold' | 'damaged' | 'expired' | 'found' | 'lost' | 'adjustment' | 'other'
  notes?: string
  // Stock levels
  previousStock: number
  newStock: number
  // User information
  userId: string
  userName: string
  // Validation
  requiresApproval: boolean
  approvedBy?: string
  approvedAt?: Date
  // Status
  status: 'pending' | 'approved' | 'completed' | 'rejected'
  // Audit
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================
export interface BulkOperation {
  id: string
  // Operation details
  type: 'update' | 'delete' | 'archive' | 'transfer' | 'price_update' | 'category_change' | 'status_change'
  entityType: 'items' | 'categories' | 'locations'
  // Target entities
  targetIds: string[]
  totalTargets: number
  // Operation parameters
  parameters: Record<string, any>
  // Progress tracking
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  processedCount: number
  successCount: number
  failedCount: number
  errors: {
    entityId: string
    error: string
  }[]
  // User information
  userId: string
  userName: string
  // Timing
  startedAt?: Date
  completedAt?: Date
  estimatedDuration?: number
  // Validation and approval
  requiresApproval: boolean
  approvedBy?: string
  approvedAt?: Date
  // Audit
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// REAL-TIME SYNCHRONIZATION
// ============================================================================
export interface SyncStatus {
  entityType: 'item' | 'category' | 'location' | 'user'
  entityId: string
  status: 'synced' | 'pending' | 'error' | 'conflict'
  lastSyncAt: Date
  syncVersion: number
  conflictData?: {
    localVersion: any
    remoteVersion: any
    conflictFields: string[]
  }
  errorMessage?: string
  retryCount: number
  nextRetryAt?: Date
}


// ============================================================================
// ENHANCED DASHBOARD METRICS
// ============================================================================
export interface DashboardMetrics {
  // Basic metrics
  totalItems: number
  totalValue: number
  lowStockItems: number
  outOfStockItems: number
  categoriesCount: number
  locationsCount: number
  // Advanced metrics
  totalMovements: number
  pendingOperations: number
  activeAlerts: number
  syncErrors: number
  // Performance metrics
  topSellingItems: {
    itemId: string
    itemName: string
    quantity: number
    value: number
  }[]
  lowPerformingItems: {
    itemId: string
    itemName: string
    daysWithoutMovement: number
  }[]
  // Capacity metrics
  locationUtilization: {
    locationId: string
    locationName: string
    utilizationPercentage: number
    capacity: number
    currentStock: number
  }[]
  // Recent activity
  recentActivity: ActivityLog[]
  // Trends
  stockTrends: {
    date: string
    totalStock: number
    totalValue: number
  }[]
}

// ============================================================================
// ENHANCED ACTIVITY LOG
// ============================================================================
export interface ActivityLog {
  id: string
  action: 'created' | 'updated' | 'deleted' | 'stock_adjusted' | 'transferred' | 
          'bulk_operation' | 'quick_stock' | 'imported' | 'exported'
  entityType: 'item' | 'category' | 'location' | 'user'
  entityId: string
  entityName: string
  userId: string
  userName: string
  details?: string
  metadata?: Record<string, any>
  timestamp: Date
  // Enhanced tracking
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  duration?: number
  status: 'success' | 'failed' | 'pending'
}


// ============================================================================
// ENHANCED FORM DATA INTERFACES
// ============================================================================
export interface InventoryFormData {
  sku: string
  name: string // Producto
  categoryId: string // Categoría
  price: number // Precio
  cost: number // Costo
  currentStock: number // Stock Actual
  minimumLevel: number // Nivel Mínimo
  maximumLevel?: number
  locationId: string // Ubicación
  dimensions?: {
    length: number
    width: number
    height: number
    weight: number
    unit: 'cm' | 'in' | 'mm'
    weightUnit: 'kg' | 'lb' | 'g'
  }
  supplier?: {
    name: string
    contactInfo: string
  }
  barcode?: string
  tags: string[]
  autoReorder: boolean
  autoReorderQuantity?: number
}

export interface CategoryFormData {
  name: string
  description?: string
  color?: string
  icon?: string
  parentId?: string
  isActive: boolean
  sortOrder: number
}

export interface LocationFormData {
  name: string
  address?: string
}

export interface UserFormData {
  name: string
  email: string
  role: 'admin' | 'manager' | 'employee' | 'viewer' | 'auditor'
  isActive: boolean
  permissions: {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canViewReports: boolean
    canManageUsers: boolean
    canBulkOperations: boolean
    canQuickStock: boolean
    canViewAuditLogs: boolean
  }
  accessibleLocations: string[]
  defaultLocation?: string
  preferences: {
    language: 'en' | 'es'
    theme: 'light' | 'dark' | 'auto'
    dateFormat: string
    currency: string
    notifications: {
      email: boolean
      push: boolean
      lowStock: boolean
      bulkOperations: boolean
    }
  }
}

// ============================================================================
// ENHANCED FILTERING AND SEARCH
// ============================================================================
export interface FilterOptions {
  // Basic filters
  search?: string
  category?: string
  location?: string
  status?: 'active' | 'inactive' | 'discontinued'
  // Enhanced Stock filters
  stockStatus?: 'good_stock' | 'low_stock' | 'out_of_stock'
  lowStock?: boolean
  outOfStock?: boolean
  overStock?: boolean
  stockRange?: {
    min: number
    max: number
  }
  // Price filters
  priceRange?: {
    min: number
    max: number
  }
  // Date filters
  dateRange?: {
    start: Date
    end: Date
  }
  createdDateRange?: {
    start: Date
    end: Date
  }
  updatedDateRange?: {
    start: Date
    end: Date
  }
  // Advanced filters
  tags?: string[]
  supplier?: string
  hasImages?: boolean
  autoReorder?: boolean
  requiresApproval?: boolean
  // Hierarchical filters
  categoryPath?: string[]
  locationPath?: string[]
  // Sorting
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  // Pagination
  page?: number
  limit?: number
}

// ============================================================================
// IMPORT/EXPORT INTERFACES
// ============================================================================
export interface ImportOperation {
  id: string
  type: 'items' | 'categories' | 'locations' | 'users'
  fileName: string
  fileSize: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalRecords: number
  processedRecords: number
  successfulRecords: number
  failedRecords: number
  errors: {
    row: number
    field: string
    error: string
  }[]
  userId: string
  userName: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface ExportOperation {
  id: string
  type: 'items' | 'categories' | 'locations' | 'users' | 'audit_logs' | 'movements'
  format: 'csv' | 'xlsx' | 'json'
  filters?: FilterOptions
  status: 'pending' | 'processing' | 'completed' | 'failed'
  fileName?: string
  fileUrl?: string
  recordCount: number
  userId: string
  userName: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  expiresAt?: Date
}

// ============================================================================
// UTILITY INTERFACES
// ============================================================================
export interface ChartData {
  name: string
  value: number
  color?: string
  percentage?: number
}

export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, item: T) => ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  pagination?: PaginationInfo
  metadata?: Record<string, any>
}

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ApiError {
  message: string
  code?: string
  details?: ValidationError[]
  timestamp: Date
}

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================
export interface SystemConfig {
  // General settings
  companyName: string
  currency: string
  dateFormat: string
  timezone: string
  language: 'en' | 'es'
  // Stock settings
  allowNegativeStock: boolean
  autoCalculateMargin: boolean
  defaultMinimumLevel: number
  lowStockThreshold: number
  // Notification settings
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  // Audit settings
  auditRetentionDays: number
  detailedAuditLogging: boolean
  // Sync settings
  autoSync: boolean
  syncInterval: number
  maxRetries: number
  // Security settings
  sessionTimeout: number
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
  }
}

// ============================================================================
// COMPREHENSIVE CARD-BASED INFORMATION SYSTEM
// ============================================================================
export interface InfoCard {
  id: string
  type: 'stat' | 'notification' | 'action' | 'activity' | 'metric' | 'alert' | 'tip' | 'chart' | 'list'
  title: string
  subtitle?: string
  icon?: string
  iconColor?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  // Content
  content?: ReactNode
  data?: any
  // Display settings
  size: 'small' | 'medium' | 'large' | 'full'
  variant: 'default' | 'outlined' | 'filled' | 'gradient'
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  // Interaction
  expandable?: boolean
  dismissible?: boolean
  clickable?: boolean
  onClick?: () => void
  onExpand?: () => void
  onDismiss?: () => void
  // State
  isExpanded?: boolean
  isDismissed?: boolean
  isLoading?: boolean
  hasError?: boolean
  errorMessage?: string
  // Context
  pageContext: string[]
  userRoles: string[]
  permissions?: string[]
  // Timing
  createdAt: Date
  updatedAt?: Date
  expiresAt?: Date
  // Metadata
  metadata?: Record<string, any>
}

export interface StatCard extends InfoCard {
  type: 'stat'
  value: number | string
  previousValue?: number | string
  change?: {
    value: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
  }
  format?: 'number' | 'currency' | 'percentage' | 'text'
  unit?: string
}

export interface NotificationCard extends InfoCard {
  type: 'notification'
  message: string
  severity: 'info' | 'warning' | 'error' | 'success'
  actions?: {
    label: string
    action: () => void
    variant?: 'primary' | 'secondary' | 'destructive'
  }[]
  autoHide?: boolean
  hideAfter?: number
}

export interface ActionCard extends InfoCard {
  type: 'action'
  actions: {
    label: string
    description?: string
    icon?: string
    action: () => void
    variant?: 'primary' | 'secondary' | 'destructive'
    disabled?: boolean
  }[]
  layout?: 'vertical' | 'horizontal' | 'grid'
}

export interface ActivityCard extends InfoCard {
  type: 'activity'
  activities: {
    id: string
    action: string
    user: string
    timestamp: Date
    details?: string
    icon?: string
    color?: string
  }[]
  maxItems?: number
  showTimestamp?: boolean
  groupByDate?: boolean
}

export interface MetricCard extends InfoCard {
  type: 'metric'
  metrics: {
    label: string
    value: number | string
    change?: {
      value: number
      percentage: number
      trend: 'up' | 'down' | 'stable'
    }
    format?: 'number' | 'currency' | 'percentage'
    color?: string
  }[]
  layout?: 'vertical' | 'horizontal' | 'grid'
}


export interface TipCard extends InfoCard {
  type: 'tip'
  tip: {
    title: string
    description: string
    category: 'productivity' | 'feature' | 'best_practice' | 'shortcut'
    learnMoreUrl?: string
  }
  showOnce?: boolean
  canDismiss?: boolean
}

export interface ChartCard extends InfoCard {
  type: 'chart'
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'donut'
  chartData: any[]
  chartConfig?: {
    xAxisKey?: string
    yAxisKey?: string
    dataKey?: string
    colors?: string[]
    showLegend?: boolean
    showGrid?: boolean
    showTooltip?: boolean
  }
  timeRange?: {
    start: Date
    end: Date
    granularity: 'hour' | 'day' | 'week' | 'month'
  }
}

export interface ListCard extends InfoCard {
  type: 'list'
  items: {
    id: string
    title: string
    subtitle?: string
    value?: string | number
    icon?: string
    color?: string
    badge?: {
      text: string
      variant: 'default' | 'secondary' | 'destructive' | 'outline'
    }
    actions?: {
      label: string
      action: () => void
      icon?: string
    }[]
  }[]
  maxItems?: number
  showSearch?: boolean
  sortable?: boolean
}

// Card Provider Context
export interface CardContext {
  // Current page context
  currentPage: string
  currentUser: User
  // Card management
  cards: InfoCard[]
  visibleCards: InfoCard[]
  dismissedCards: string[]
  expandedCards: string[]
  // Actions
  addCard: (card: InfoCard) => void
  removeCard: (cardId: string) => void
  updateCard: (cardId: string, updates: Partial<InfoCard>) => void
  dismissCard: (cardId: string) => void
  expandCard: (cardId: string) => void
  collapseCard: (cardId: string) => void
  refreshCard: (cardId: string) => void
  // Filtering
  filterCards: (filters: CardFilters) => void
  // Settings
  cardSettings: CardSettings
  updateCardSettings: (settings: Partial<CardSettings>) => void
}

export interface CardFilters {
  types?: InfoCard['type'][]
  priorities?: InfoCard['priority'][]
  pageContext?: string[]
  showDismissed?: boolean
  showExpired?: boolean
}

export interface CardSettings {
  // Layout
  layout: 'grid' | 'masonry' | 'list'
  columns: 1 | 2 | 3 | 4
  gap: 'small' | 'medium' | 'large'
  // Behavior
  autoRefresh: boolean
  refreshInterval: number
  animationsEnabled: boolean
  // Persistence
  persistDismissed: boolean
  persistExpanded: boolean
  // Accessibility
  reducedMotion: boolean
  highContrast: boolean
}

// Card Factory for generating contextual cards
export interface CardFactory {
  generateCardsForPage: (pageContext: string, user: User) => Promise<InfoCard[]>
  generateStatCards: (data: any) => StatCard[]
  generateNotificationCards: (notifications: any[]) => NotificationCard[]
  generateActivityCards: (activities: any[]) => ActivityCard[]
  generateMetricCards: (metrics: any[]) => MetricCard[]
  generateActionCards: (actions: any[]) => ActionCard[]
  generateTipCards: (tips: any[]) => TipCard[]
  generateChartCards: (charts: any[]) => ChartCard[]
  generateListCards: (lists: any[]) => ListCard[]
}

// Page-specific card configurations
export interface PageCardConfig {
  pageId: string
  pageName: string
  defaultCards: string[]
  availableCards: string[]
  cardLayout: {
    columns: number
    maxCards: number
    priority: InfoCard['priority'][]
  }
  refreshInterval?: number
  autoRefresh?: boolean
}
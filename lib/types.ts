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

// ============================================================================
// PROJECT MANAGEMENT SYSTEM
// ============================================================================

// Product types with their specific workflows
export type ProductType = 'LU' | 'CL' | 'IMP'

// Workflow status for each product type
export type LUStatus = 'seleccionar_inventario' | 'inventario_seleccionado'
export type CLStatus = 'solicitar_cotizacion' | 'pagar_cotizacion' | 'coordinar_envio_pagar_flete' | 'recibido'
export type IMPStatus = 'pagar_pi_proveedor' | 'enviar_etiqueta_envio' | 'pagar_arancel_aduanas' | 'coordinar_envio' | 'recibido'

export type ProjectStatus = LUStatus | CLStatus | IMPStatus

// Base project interface
export interface Project {
  id: string
  name: string
  description?: string
  type: 'project'
  status: 'active' | 'completed' | 'cancelled' | 'on_hold'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  startDate: Date
  expectedEndDate?: Date
  actualEndDate?: Date
  // Progress tracking
  progress: number // 0-100
  totalItems: number
  completedItems: number
  // Audit
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

// Project items - products within a project
export interface ProjectItem {
  id: string
  projectId: string
  // Product details
  productType: ProductType
  productName: string
  productDescription?: string
  quantity: number
  unitPrice?: number
  totalPrice?: number
  // Workflow status
  currentStatus: ProjectStatus
  statusHistory: ProjectStatusHistory[]
  // LU specific (links to existing inventory)
  inventoryItemId?: string
  inventoryItem?: InventoryItem
  // CL specific fields
  quotationRequested?: Date
  quotationReceived?: Date
  quotationAmount?: number
  quotationPaid?: Date
  shippingCoordinated?: Date
  shippingCost?: number
  // IMP specific fields
  supplierPIAmount?: number
  supplierPIPaid?: Date
  shippingLabelSent?: Date
  isAirShipping?: boolean
  customsDutyAmount?: number
  customsDutyPaid?: Date
  // Common fields
  supplier?: {
    id: string
    name: string
    contactInfo: string
    email?: string
    phone?: string
  }
  notes?: string
  attachments: ProjectAttachment[]
  // Dates
  expectedDelivery?: Date
  actualDelivery?: Date
  // Status
  isCompleted: boolean
  completedAt?: Date
  // Audit
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

// Status history tracking
export interface ProjectStatusHistory {
  id: string
  projectItemId: string
  fromStatus?: ProjectStatus
  toStatus: ProjectStatus
  changedBy: string
  changedByName: string
  changeDate: Date
  notes?: string
  attachments?: ProjectAttachment[]
  // Cost tracking for each status change
  costIncurred?: number
  estimatedCost?: number
  actualCost?: number
}

// File attachments for projects
export interface ProjectAttachment {
  id: string
  projectId?: string
  projectItemId?: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  uploadedBy: string
  uploadedByName: string
  uploadedAt: Date
  category: 'quotation' | 'invoice' | 'receipt' | 'shipping_label' | 'customs_document' | 'photo' | 'other'
  description?: string
}

// Project dashboard metrics
export interface ProjectMetrics {
  // Overall metrics
  totalProjects: number
  activeProjects: number
  completedProjects: number
  onHoldProjects: number
  cancelledProjects: number
  // Item metrics by type
  luItems: {
    total: number
    completed: number
    pending: number
  }
  clItems: {
    total: number
    quotationPending: number
    paymentPending: number
    shippingPending: number
    completed: number
  }
  impItems: {
    total: number
    piPaymentPending: number
    shippingPending: number
    customsPending: number
    coordinationPending: number
    completed: number
  }
  // Financial metrics removed
  // totalBudget: number
  // totalActualCost: number
  // totalSavings: number
  // averageProjectCost: number
  // Timeline metrics
  onTimeProjects: number
  delayedProjects: number
  averageProjectDuration: number
  // Recent activity
  recentActivities: ProjectActivity[]
}

// Project activity log
export interface ProjectActivity {
  id: string
  projectId: string
  projectName: string
  projectItemId?: string
  productName?: string
  activityType: 'status_change' | 'cost_update' | 'note_added' | 'attachment_added' | 'project_created' | 'project_updated' | 'item_added' | 'item_updated'
  description: string
  userId: string
  userName: string
  timestamp: Date
  metadata?: Record<string, any>
}

// Form data interfaces
export interface ProjectFormData {
  name: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  startDate: Date
  expectedEndDate?: Date
}

export interface ProjectItemFormData {
  productType: ProductType
  productName: string
  productDescription?: string
  quantity: number
  unitPrice?: number
  // LU specific
  inventoryItemId?: string
  // Supplier info
  supplierName?: string
  supplierContactInfo?: string
  supplierEmail?: string
  supplierPhone?: string
  // Initial estimates
  estimatedCost?: number
  expectedDelivery?: Date
  notes?: string
}

// Workflow configuration
export interface WorkflowConfig {
  productType: ProductType
  statuses: {
    key: ProjectStatus
    label: string
    description: string
    color: string
    icon: string
    isCompleted: boolean
    requiredFields?: string[]
    allowedNextStatuses: ProjectStatus[]
  }[]
}

// Filter options for projects
export interface ProjectFilterOptions extends FilterOptions {
  projectStatus?: 'active' | 'completed' | 'cancelled' | 'on_hold'
  productType?: ProductType
  currentStatus?: ProjectStatus
  progressRange?: {
    min: number
    max: number
  }
  dueDateRange?: {
    start: Date
    end: Date
  }
}

// Project reports
export interface ProjectReport {
  id: string
  name: string
  type: 'status_summary' | 'cost_analysis' | 'timeline_analysis' | 'team_performance' | 'supplier_performance'
  filters: ProjectFilterOptions
  data: any
  generatedBy: string
  generatedAt: Date
  format: 'json' | 'csv' | 'pdf'
}

// Workflow definitions for each product type
export const WORKFLOW_CONFIGS: Record<ProductType, WorkflowConfig> = {
  LU: {
    productType: 'LU',
    statuses: [
      {
        key: 'seleccionar_inventario',
        label: 'Seleccionar del Inventario',
        description: 'Seleccionar producto del inventario VLN existente',
        color: '#22c55e',
        icon: 'Package',
        isCompleted: false,
        allowedNextStatuses: ['inventario_seleccionado']
      },
      {
        key: 'inventario_seleccionado',
        label: 'Inventario Seleccionado',
        description: 'Producto seleccionado del inventario VLN',
        color: '#16a34a',
        icon: 'CheckCircle',
        isCompleted: true,
        allowedNextStatuses: []
      }
    ]
  },
  CL: {
    productType: 'CL',
    statuses: [
      {
        key: 'solicitar_cotizacion',
        label: 'Solicitar Cotización',
        description: 'Solicitar cotización al proveedor',
        color: '#f59e0b',
        icon: 'FileText',
        isCompleted: false,
        allowedNextStatuses: ['pagar_cotizacion']
      },
      {
        key: 'pagar_cotizacion',
        label: 'Pagar Cotización',
        description: 'Realizar pago de la cotización',
        color: '#3b82f6',
        icon: 'CreditCard',
        isCompleted: false,
        requiredFields: ['quotationAmount'],
        allowedNextStatuses: ['coordinar_envio_pagar_flete']
      },
      {
        key: 'coordinar_envio_pagar_flete',
        label: 'Coordinar Envío y Pagar Flete',
        description: 'Coordinar el envío y pagar el flete',
        color: '#8b5cf6',
        icon: 'Truck',
        isCompleted: false,
        requiredFields: ['shippingCost'],
        allowedNextStatuses: ['recibido']
      },
      {
        key: 'recibido',
        label: 'Recibido',
        description: 'Producto recibido exitosamente',
        color: '#22c55e',
        icon: 'CheckCircle',
        isCompleted: true,
        allowedNextStatuses: []
      }
    ]
  },
  IMP: {
    productType: 'IMP',
    statuses: [
      {
        key: 'pagar_pi_proveedor',
        label: 'Pagar PI a Proveedor',
        description: 'Realizar pago de PI (Proforma Invoice) al proveedor',
        color: '#f59e0b',
        icon: 'Receipt',
        isCompleted: false,
        requiredFields: ['supplierPIAmount'],
        allowedNextStatuses: ['enviar_etiqueta_envio']
      },
      {
        key: 'enviar_etiqueta_envio',
        label: 'Enviar Etiqueta Envío',
        description: 'Enviar etiqueta de envío (si es aéreo, pagar flete)',
        color: '#3b82f6',
        icon: 'Mail',
        isCompleted: false,
        allowedNextStatuses: ['pagar_arancel_aduanas']
      },
      {
        key: 'pagar_arancel_aduanas',
        label: 'Pagar Arancel Aduanas',
        description: 'Pagar aranceles aduaneros',
        color: '#8b5cf6',
        icon: 'Building',
        isCompleted: false,
        requiredFields: ['customsDutyAmount'],
        allowedNextStatuses: ['coordinar_envio']
      },
      {
        key: 'coordinar_envio',
        label: 'Coordinar Envío',
        description: 'Coordinar la entrega final',
        color: '#06b6d4',
        icon: 'MapPin',
        isCompleted: false,
        allowedNextStatuses: ['recibido']
      },
      {
        key: 'recibido',
        label: 'Recibido',
        description: 'Producto recibido exitosamente',
        color: '#22c55e',
        icon: 'CheckCircle',
        isCompleted: true,
        allowedNextStatuses: []
      }
    ]
  }
}
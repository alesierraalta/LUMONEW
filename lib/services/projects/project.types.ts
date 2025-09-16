import type { Project, ProjectFormData, ProjectItem, ProjectItemFormData, ProjectMetrics } from '../../types'

/**
 * Project-specific types and interfaces for microservice architecture
 */

export interface ProjectFilters {
  status?: 'active' | 'completed' | 'cancelled' | 'on_hold'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  dateRange?: {
    start: Date
    end: Date
  }
  search?: string
  page?: number
  limit?: number
}

export interface ProjectSearchResult {
  projects: Project[]
  totalCount: number
  hasMore: boolean
  searchTime: number
}

export interface ProjectAnalytics {
  statusDistribution: Array<{
    status: string
    count: number
    percentage: number
  }>
  priorityDistribution: Array<{
    priority: string
    count: number
    percentage: number
  }>
  completionRate: number
  averageDuration: number
  overdueProjects: number
}

export interface ProjectValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
  }>
}

export interface BulkProjectOperationResult {
  success: boolean
  processed: number
  successful: number
  failed: number
  errors: Array<{
    projectId: string
    error: string
  }>
  results: Project[]
}

/**
 * Service method signatures for type safety
 */
export interface IProjectService {
  getAll(filters?: ProjectFilters): Promise<Project[]>
  getById(id: string): Promise<Project | null>
  create(projectData: ProjectFormData): Promise<Project>
  update(id: string, updates: Partial<ProjectFormData>): Promise<Project>
  delete(id: string): Promise<void>
  getMetrics(): Promise<ProjectMetrics>
  addItem(projectId: string, itemData: ProjectItemFormData): Promise<ProjectItem>
  updateItem(itemId: string, updates: Partial<ProjectItemFormData>): Promise<ProjectItem>
  deleteItem(itemId: string): Promise<void>
  updateProgress(projectId: string): Promise<void>
  getProjectItems(projectId: string): Promise<ProjectItem[]>
  search(query: string, filters?: ProjectFilters): Promise<Project[]>
}

export interface IProjectRepository {
  findMany(filters?: ProjectFilters): Promise<Project[]>
  findById(id: string): Promise<Project | null>
  create(projectData: ProjectFormData): Promise<Project>
  update(id: string, updates: Partial<ProjectFormData>): Promise<Project>
  delete(id: string): Promise<void>
  deleteProjectItems(projectId: string): Promise<void>
  createProjectItem(projectId: string, itemData: ProjectItemFormData): Promise<ProjectItem>
  updateProjectItem(itemId: string, updates: Partial<ProjectItemFormData>): Promise<ProjectItem>
  deleteProjectItem(itemId: string): Promise<void>
  findProjectItemById(itemId: string): Promise<ProjectItem | null>
  getProjectItems(projectId: string): Promise<ProjectItem[]>
  getMetrics(): Promise<ProjectMetrics>
  search(query: string, filters?: ProjectFilters): Promise<Project[]>
  count(filters?: ProjectFilters): Promise<number>
}

/**
 * Event types for project operations
 */
export interface ProjectEvent {
  type: 'created' | 'updated' | 'deleted' | 'item_added' | 'item_updated' | 'item_deleted' | 'progress_updated'
  projectId: string
  project?: Project
  item?: ProjectItem
  timestamp: Date
  userId: string
  metadata?: Record<string, any>
}

export interface ProjectEventHandler {
  (event: ProjectEvent): Promise<void>
}

/**
 * Workflow management types
 */
export interface WorkflowStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  required: boolean
  order: number
  estimatedDuration?: number
  actualDuration?: number
  assignedTo?: string
  completedAt?: Date
  notes?: string
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  productType: 'LU' | 'CL' | 'IMP'
  steps: WorkflowStep[]
  estimatedTotalDuration?: number
  isActive: boolean
}

/**
 * Performance metrics for project operations
 */
export interface ProjectPerformanceMetrics {
  operation: string
  duration: number
  success: boolean
  timestamp: Date
  projectId?: string
  metadata?: Record<string, any>
}

/**
 * Cache configuration for project data
 */
export interface ProjectCacheConfig {
  enabled: boolean
  ttl: number
  maxSize: number
  keyPrefix: string
}

/**
 * Real-time collaboration types
 */
export interface ProjectCollaborationEvent {
  type: 'user_joined' | 'user_left' | 'item_updated' | 'comment_added'
  projectId: string
  userId: string
  userName: string
  timestamp: Date
  data?: any
}

/**
 * Project template types
 */
export interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: string
  defaultPriority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedDuration: number
  requiredFields: string[]
  workflowTemplate?: WorkflowTemplate
  isActive: boolean
}

/**
 * Project reporting types
 */
export interface ProjectReport {
  id: string
  name: string
  type: 'status_summary' | 'progress_report' | 'resource_utilization' | 'timeline_analysis'
  projectId?: string
  filters: ProjectFilters
  data: any
  generatedBy: string
  generatedAt: Date
  format: 'json' | 'csv' | 'pdf'
}

/**
 * Project notification types
 */
export interface ProjectNotification {
  id: string
  projectId: string
  type: 'deadline_approaching' | 'milestone_reached' | 'item_completed' | 'project_overdue'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isRead: boolean
  createdAt: Date
  userId: string
}
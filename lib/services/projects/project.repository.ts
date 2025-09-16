import { createClient } from '../../supabase/client'
import type { Project, ProjectFormData, ProjectItem, ProjectItemFormData, ProjectMetrics } from '../../types'

const supabase = createClient()

/**
 * Project Repository - Data access layer for project management
 * Implements Repository pattern with optimized database queries
 */
export class ProjectRepository {
  private readonly projectsTable = 'projects'
  private readonly projectItemsTable = 'project_items'

  /**
   * Get all projects with optional filtering
   */
  async findMany(filters?: any): Promise<Project[]> {
    let query = supabase
      .from(this.projectsTable)
      .select(`
        *,
        project_items (
          id,
          product_type,
          product_name,
          current_status,
          is_completed
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }

    // Apply pagination
    if (filters?.page && filters?.limit) {
      const offset = (filters.page - 1) * filters.limit
      query = query.range(offset, offset + filters.limit - 1)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }

  /**
   * Find project by ID with full details
   */
  async findById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from(this.projectsTable)
      .select(`
        *,
        project_items (
          *,
          project_status_history (*),
          project_attachments (*)
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  }

  /**
   * Create new project
   */
  async create(projectData: ProjectFormData): Promise<Project> {
    const insertData = {
      name: projectData.name,
      description: projectData.description,
      priority: projectData.priority,
      start_date: new Date(projectData.startDate).toISOString(),
      expected_end_date: projectData.expectedEndDate ? new Date(projectData.expectedEndDate).toISOString() : null,
      status: 'active' as const,
      progress: 0,
      total_items: 0,
      completed_items: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from(this.projectsTable)
      .insert([insertData])
      .select(`
        *,
        project_items (
          id,
          product_type,
          product_name,
          current_status,
          is_completed
        )
      `)
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Update existing project
   */
  async update(id: string, updates: Partial<ProjectFormData>): Promise<Project> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    // Map form data to database columns
    if (updates.name) updateData.name = updates.name
    if (updates.description) updateData.description = updates.description
    if (updates.priority) updateData.priority = updates.priority
    if (updates.startDate) updateData.start_date = new Date(updates.startDate).toISOString()
    if (updates.expectedEndDate) updateData.expected_end_date = new Date(updates.expectedEndDate).toISOString()
    
    // Handle progress updates
    if (updates.totalItems !== undefined) updateData.total_items = updates.totalItems
    if (updates.completedItems !== undefined) updateData.completed_items = updates.completedItems
    if (updates.progress !== undefined) updateData.progress = updates.progress

    const { data, error } = await supabase
      .from(this.projectsTable)
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        project_items (
          id,
          product_type,
          product_name,
          current_status,
          is_completed
        )
      `)
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Delete project
   */
  async delete(id: string): Promise<void> {
    // Delete project items first (due to foreign key constraints)
    await this.deleteProjectItems(id)
    
    // Delete the project
    const { error } = await supabase
      .from(this.projectsTable)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  /**
   * Delete all project items for a project
   */
  async deleteProjectItems(projectId: string): Promise<void> {
    const { error } = await supabase
      .from(this.projectItemsTable)
      .delete()
      .eq('project_id', projectId)
    
    if (error) throw error
  }

  /**
   * Create project item
   */
  async createProjectItem(projectId: string, itemData: ProjectItemFormData): Promise<ProjectItem> {
    const insertData = {
      project_id: projectId,
      product_type: itemData.productType,
      product_name: itemData.productName,
      description: itemData.productDescription,
      quantity: itemData.quantity,
      unit_cost: itemData.unitPrice,
      total_cost: itemData.unitPrice ? itemData.unitPrice * itemData.quantity : null,
      current_status: 'pending' as const,
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from(this.projectItemsTable)
      .insert([insertData])
      .select('*')
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Update project item
   */
  async updateProjectItem(itemId: string, updates: Partial<ProjectItemFormData>): Promise<ProjectItem> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (updates.productName) updateData.product_name = updates.productName
    if (updates.productDescription) updateData.description = updates.productDescription
    if (updates.quantity) updateData.quantity = updates.quantity
    if (updates.unitPrice) {
      updateData.unit_cost = updates.unitPrice
      updateData.total_cost = updates.unitPrice * (updates.quantity || 1)
    }

    const { data, error } = await supabase
      .from(this.projectItemsTable)
      .update(updateData)
      .eq('id', itemId)
      .select('*')
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * Delete project item
   */
  async deleteProjectItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from(this.projectItemsTable)
      .delete()
      .eq('id', itemId)
    
    if (error) throw error
  }

  /**
   * Find project item by ID
   */
  async findProjectItemById(itemId: string): Promise<ProjectItem | null> {
    const { data, error } = await supabase
      .from(this.projectItemsTable)
      .select('*')
      .eq('id', itemId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  }

  /**
   * Get project items for a project
   */
  async getProjectItems(projectId: string): Promise<ProjectItem[]> {
    const { data, error } = await supabase
      .from(this.projectItemsTable)
      .select(`
        *,
        project_status_history (*),
        project_attachments (*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  /**
   * Get project metrics
   */
  async getMetrics(): Promise<ProjectMetrics> {
    // Get project counts by status
    const { data: projects } = await supabase
      .from(this.projectsTable)
      .select('status')
    
    const projectCounts = projects?.reduce((acc: any, project: any) => {
      acc[project.status] = (acc[project.status] || 0) + 1
      return acc
    }, {}) || {}
    
    // Get item counts by type and status
    const { data: items } = await supabase
      .from(this.projectItemsTable)
      .select('product_type, current_status, is_completed')
    
    const itemMetrics = items?.reduce((acc: any, item: any) => {
      const type = item.product_type.toLowerCase()
      if (!acc[type]) {
        acc[type] = { total: 0, completed: 0, pending: 0 }
      }
      acc[type].total++
      if (item.is_completed) {
        acc[type].completed++
      } else {
        acc[type].pending++
      }
      return acc
    }, {}) || {}
    
    return {
      totalProjects: projects?.length || 0,
      activeProjects: projectCounts.active || 0,
      completedProjects: projectCounts.completed || 0,
      onHoldProjects: projectCounts.on_hold || 0,
      cancelledProjects: projectCounts.cancelled || 0,
      luItems: itemMetrics.lu || { total: 0, completed: 0, pending: 0 },
      clItems: itemMetrics.cl || { total: 0, completed: 0, pending: 0 },
      impItems: itemMetrics.imp || { total: 0, completed: 0, pending: 0 }
    }
  }

  /**
   * Search projects
   */
  async search(query: string, filters?: any): Promise<Project[]> {
    let searchQuery = supabase
      .from(this.projectsTable)
      .select(`
        *,
        project_items (
          id,
          product_type,
          product_name,
          current_status,
          is_completed
        )
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    // Apply additional filters
    if (filters?.status) {
      searchQuery = searchQuery.eq('status', filters.status)
    }
    
    if (filters?.priority) {
      searchQuery = searchQuery.eq('priority', filters.priority)
    }

    const { data, error } = await searchQuery
    
    if (error) throw error
    return data || []
  }

  /**
   * Count projects with filters
   */
  async count(filters?: any): Promise<number> {
    let query = supabase
      .from(this.projectsTable)
      .select('*', { count: 'exact', head: true })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }

    const { count, error } = await query
    
    if (error) throw error
    return count || 0
  }
}

// Export singleton instance
export const projectRepository = new ProjectRepository()
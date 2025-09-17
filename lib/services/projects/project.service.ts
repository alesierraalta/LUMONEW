import { projectRepository } from './project.repository'
import type { Project, ProjectFormData, ProjectItem, ProjectItemFormData, ProjectMetrics } from '../../types'
import type { IProjectService } from './project.types'

/**
 * Project Service - Business logic layer for project management
 * Implements microservice architecture with clear separation of concerns
 */
export class ProjectService implements IProjectService {
  private repository = projectRepository

  /**
   * Get all projects with optional filtering
   */
  async getAll(filters?: any): Promise<Project[]> {
    try {
      return await this.repository.findMany(filters)
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw new Error('Failed to fetch projects')
    }
  }

  /**
   * Get project by ID with full details
   */
  async getById(id: string): Promise<Project | null> {
    try {
      return await this.repository.findById(id)
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error)
      throw new Error('Failed to fetch project')
    }
  }

  /**
   * Create new project
   */
  async create(projectData: ProjectFormData): Promise<Project> {
    try {
      // Validate project data
      await this.validateProject(projectData)
      
      // Create project
      const project = await this.repository.create(projectData)
      
      // Emit project created event
      await this.emitEvent('created', project)
      
      return project
    } catch (error) {
      console.error('Error creating project:', error)
      throw new Error('Failed to create project')
    }
  }

  /**
   * Update existing project
   */
  async update(id: string, updates: Partial<ProjectFormData>): Promise<Project> {
    try {
      // Get current project for comparison
      const currentProject = await this.repository.findById(id)
      if (!currentProject) {
        throw new Error('Project not found')
      }

      // Update project
      const updatedProject = await this.repository.update(id, updates)
      
      // Emit project updated event
      await this.emitEvent('updated', updatedProject)
      
      return updatedProject
    } catch (error) {
      console.error(`Error updating project ${id}:`, error)
      throw new Error('Failed to update project')
    }
  }

  /**
   * Delete project
   */
  async delete(id: string): Promise<void> {
    try {
      // Get project details before deletion
      const project = await this.repository.findById(id)
      if (!project) {
        throw new Error('Project not found')
      }

      // Delete project items first
      await this.repository.deleteProjectItems(id)
      
      // Delete project
      await this.repository.delete(id)
      
      // Emit project deleted event
      await this.emitEvent('deleted', project)
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error)
      throw new Error('Failed to delete project')
    }
  }

  /**
   * Get project metrics
   */
  async getMetrics(): Promise<ProjectMetrics> {
    try {
      return await this.repository.getMetrics()
    } catch (error) {
      console.error('Error fetching project metrics:', error)
      throw new Error('Failed to fetch project metrics')
    }
  }

  /**
   * Add item to project
   */
  async addItem(projectId: string, itemData: ProjectItemFormData): Promise<ProjectItem> {
    try {
      // Validate project exists
      const project = await this.repository.findById(projectId)
      if (!project) {
        throw new Error('Project not found')
      }

      // Create project item
      const item = await this.repository.createProjectItem(projectId, itemData)
      
      // Update project progress
      await this.updateProgress(projectId)
      
      // Emit item added event
      await this.emitEvent('item_added', { projectId, item })
      
      return item
    } catch (error) {
      console.error(`Error adding item to project ${projectId}:`, error)
      throw new Error('Failed to add item to project')
    }
  }

  /**
   * Update project item
   */
  async updateItem(itemId: string, updates: Partial<ProjectItemFormData>): Promise<ProjectItem> {
    try {
      const item = await this.repository.updateProjectItem(itemId, updates)
      
      // Update project progress
      await this.updateProgress(item.projectId)
      
      // Emit item updated event
      await this.emitEvent('item_updated', { itemId, item })
      
      return item
    } catch (error) {
      console.error(`Error updating project item ${itemId}:`, error)
      throw new Error('Failed to update project item')
    }
  }

  /**
   * Delete project item
   */
  async deleteItem(itemId: string): Promise<void> {
    try {
      // Get item details before deletion
      const item = await this.repository.findProjectItemById(itemId)
      if (!item) {
        throw new Error('Project item not found')
      }

      // Delete item
      await this.repository.deleteProjectItem(itemId)
      
      // Update project progress
      await this.updateProgress(item.projectId)
      
      // Emit item deleted event
      await this.emitEvent('item_deleted', { itemId, item })
    } catch (error) {
      console.error(`Error deleting project item ${itemId}:`, error)
      throw new Error('Failed to delete project item')
    }
  }

  /**
   * Update project progress based on items
   */
  async updateProgress(projectId: string): Promise<void> {
    try {
      const items = await this.repository.getProjectItems(projectId)
      const totalItems = items.length
      const completedItems = items.filter(item => item.isCompleted).length
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

      await this.repository.update(projectId, {
        ...({ totalItems, completedItems, progress } as any)
      })
    } catch (error) {
      console.error(`Error updating project progress ${projectId}:`, error)
      throw new Error('Failed to update project progress')
    }
  }

  /**
   * Get project items
   */
  async getProjectItems(projectId: string): Promise<ProjectItem[]> {
    try {
      return await this.repository.getProjectItems(projectId)
    } catch (error) {
      console.error(`Error fetching project items for ${projectId}:`, error)
      throw new Error('Failed to fetch project items')
    }
  }

  /**
   * Search projects
   */
  async search(query: string, filters?: any): Promise<Project[]> {
    try {
      return await this.repository.search(query, filters)
    } catch (error) {
      console.error('Error searching projects:', error)
      throw new Error('Failed to search projects')
    }
  }

  /**
   * Validate project data
   */
  private async validateProject(projectData: ProjectFormData): Promise<void> {
    if (!projectData.name || projectData.name.trim().length === 0) {
      throw new Error('Project name is required')
    }

    if (!projectData.priority || !['low', 'medium', 'high', 'urgent'].includes(projectData.priority)) {
      throw new Error('Valid priority is required')
    }

    if (!projectData.startDate) {
      throw new Error('Start date is required')
    }

    // Validate date ranges
    if (projectData.expectedEndDate && projectData.startDate) {
      const startDate = new Date(projectData.startDate)
      const endDate = new Date(projectData.expectedEndDate)
      
      if (endDate <= startDate) {
        throw new Error('Expected end date must be after start date')
      }
    }
  }

  /**
   * Emit project events for real-time updates
   */
  private async emitEvent(type: string, data: any): Promise<void> {
    try {
      // This would integrate with a real-time system like WebSockets or Server-Sent Events
      console.log(`Project event: ${type}`, data)
      
      // In a real implementation, this would emit to connected clients
      // await realTimeService.emit('project', { type, data })
    } catch (error) {
      console.error('Error emitting project event:', error)
      // Don't throw here as event emission failure shouldn't break the main operation
    }
  }
}

// Export singleton instance
export const projectService = new ProjectService()
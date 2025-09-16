import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { projectService } from '../services/projects/project.service'
import type { Project, ProjectFormData, ProjectItem, ProjectItemFormData, ProjectFilters } from '../types'

interface ProjectsState {
  // Data
  projects: Project[]
  selectedProjects: string[]
  currentProject: Project | null
  projectItems: ProjectItem[]
  filters: ProjectFilters
  loading: boolean
  error: string | null
  
  // Pagination
  currentPage: number
  totalPages: number
  totalCount: number
  itemsPerPage: number
  
  // Cache
  lastFetch: Date | null
  cacheExpiry: number // in milliseconds
  
  // Actions
  fetchProjects: (filters?: ProjectFilters, forceRefresh?: boolean) => Promise<void>
  fetchProject: (id: string) => Promise<Project | null>
  createProject: (projectData: ProjectFormData) => Promise<Project>
  updateProject: (id: string, updates: Partial<ProjectFormData>) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  
  // Project Items
  fetchProjectItems: (projectId: string) => Promise<ProjectItem[]>
  addProjectItem: (projectId: string, itemData: ProjectItemFormData) => Promise<ProjectItem>
  updateProjectItem: (itemId: string, updates: Partial<ProjectItemFormData>) => Promise<ProjectItem>
  deleteProjectItem: (itemId: string) => Promise<void>
  
  // UI State
  setFilters: (filters: Partial<ProjectFilters>) => void
  setSelectedProjects: (ids: string[]) => void
  toggleProjectSelection: (id: string) => void
  clearSelection: () => void
  setCurrentProject: (project: Project | null) => void
  setPage: (page: number) => void
  setItemsPerPage: (count: number) => void
  
  // Cache management
  invalidateCache: () => void
  isCacheValid: () => boolean
  
  // Error handling
  clearError: () => void
  setError: (error: string) => void
}

export const useProjectsStore = create<ProjectsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        projects: [],
        selectedProjects: [],
        currentProject: null,
        projectItems: [],
        filters: {},
        loading: false,
        error: null,
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        itemsPerPage: 20,
        lastFetch: null,
        cacheExpiry: 5 * 60 * 1000, // 5 minutes

        // Actions
        fetchProjects: async (filters = {}, forceRefresh = false) => {
          const state = get()
          
          // Check cache validity
          if (!forceRefresh && state.isCacheValid() && state.projects.length > 0) {
            return
          }

          set({ loading: true, error: null })

          try {
            const mergedFilters = { ...state.filters, ...filters }
            const projects = await projectService.getAll(mergedFilters)
            
            set({
              projects,
              filters: mergedFilters,
              loading: false,
              lastFetch: new Date(),
              totalCount: projects.length,
              totalPages: Math.ceil(projects.length / state.itemsPerPage)
            })
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch projects'
            })
          }
        },

        fetchProject: async (id: string) => {
          set({ loading: true, error: null })

          try {
            const project = await projectService.getById(id)
            
            if (project) {
              // Update project in the list if it exists
              set(state => ({
                projects: state.projects.map(p => p.id === id ? project : p),
                currentProject: state.currentProject?.id === id ? project : state.currentProject,
                loading: false
              }))
            }
            
            return project
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch project'
            })
            return null
          }
        },

        createProject: async (projectData: ProjectFormData) => {
          set({ loading: true, error: null })

          try {
            const newProject = await projectService.create(projectData)
            
            set(state => ({
              projects: [newProject, ...state.projects],
              loading: false,
              totalCount: state.totalCount + 1,
              totalPages: Math.ceil((state.totalCount + 1) / state.itemsPerPage)
            }))
            
            return newProject
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to create project'
            })
            throw error
          }
        },

        updateProject: async (id: string, updates: Partial<ProjectFormData>) => {
          set({ loading: true, error: null })

          try {
            const updatedProject = await projectService.update(id, updates)
            
            set(state => ({
              projects: state.projects.map(project => 
                project.id === id ? updatedProject : project
              ),
              currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
              loading: false
            }))
            
            return updatedProject
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to update project'
            })
            throw error
          }
        },

        deleteProject: async (id: string) => {
          set({ loading: true, error: null })

          try {
            await projectService.delete(id)
            
            set(state => ({
              projects: state.projects.filter(project => project.id !== id),
              selectedProjects: state.selectedProjects.filter(projectId => projectId !== id),
              currentProject: state.currentProject?.id === id ? null : state.currentProject,
              loading: false,
              totalCount: state.totalCount - 1,
              totalPages: Math.ceil((state.totalCount - 1) / state.itemsPerPage)
            }))
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to delete project'
            })
            throw error
          }
        },

        // Project Items
        fetchProjectItems: async (projectId: string) => {
          set({ loading: true, error: null })

          try {
            const items = await projectService.getProjectItems(projectId)
            
            set({
              projectItems: items,
              loading: false
            })
            
            return items
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch project items'
            })
            return []
          }
        },

        addProjectItem: async (projectId: string, itemData: ProjectItemFormData) => {
          set({ loading: true, error: null })

          try {
            const newItem = await projectService.addItem(projectId, itemData)
            
            set(state => ({
              projectItems: [newItem, ...state.projectItems],
              loading: false
            }))
            
            return newItem
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to add project item'
            })
            throw error
          }
        },

        updateProjectItem: async (itemId: string, updates: Partial<ProjectItemFormData>) => {
          set({ loading: true, error: null })

          try {
            const updatedItem = await projectService.updateItem(itemId, updates)
            
            set(state => ({
              projectItems: state.projectItems.map(item => 
                item.id === itemId ? updatedItem : item
              ),
              loading: false
            }))
            
            return updatedItem
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to update project item'
            })
            throw error
          }
        },

        deleteProjectItem: async (itemId: string) => {
          set({ loading: true, error: null })

          try {
            await projectService.deleteItem(itemId)
            
            set(state => ({
              projectItems: state.projectItems.filter(item => item.id !== itemId),
              loading: false
            }))
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to delete project item'
            })
            throw error
          }
        },

        // UI State actions
        setFilters: (newFilters) => {
          set(state => ({
            filters: { ...state.filters, ...newFilters },
            currentPage: 1 // Reset to first page when filters change
          }))
        },

        setSelectedProjects: (ids) => {
          set({ selectedProjects: ids })
        },

        toggleProjectSelection: (id) => {
          set(state => ({
            selectedProjects: state.selectedProjects.includes(id)
              ? state.selectedProjects.filter(projectId => projectId !== id)
              : [...state.selectedProjects, id]
          }))
        },

        clearSelection: () => {
          set({ selectedProjects: [] })
        },

        setCurrentProject: (project) => {
          set({ currentProject: project })
        },

        setPage: (page) => {
          set({ currentPage: page })
        },

        setItemsPerPage: (count) => {
          set(state => ({
            itemsPerPage: count,
            currentPage: 1,
            totalPages: Math.ceil(state.totalCount / count)
          }))
        },

        // Cache management
        invalidateCache: () => {
          set({ lastFetch: null })
        },

        isCacheValid: () => {
          const state = get()
          if (!state.lastFetch) return false
          return Date.now() - state.lastFetch.getTime() < state.cacheExpiry
        },

        // Error handling
        clearError: () => {
          set({ error: null })
        },

        setError: (error) => {
          set({ error })
        }
      }),
      {
        name: 'projects-store',
        partialize: (state) => ({
          filters: state.filters,
          itemsPerPage: state.itemsPerPage,
          cacheExpiry: state.cacheExpiry,
          currentProject: state.currentProject
        })
      }
    ),
    {
      name: 'projects-store'
    }
  )
)

// Selectors for better performance
export const projectsSelectors = {
  getProjects: (state: ProjectsState) => state.projects,
  getSelectedProjects: (state: ProjectsState) => state.selectedProjects,
  getCurrentProject: (state: ProjectsState) => state.currentProject,
  getProjectItems: (state: ProjectsState) => state.projectItems,
  getFilters: (state: ProjectsState) => state.filters,
  getLoading: (state: ProjectsState) => state.loading,
  getError: (state: ProjectsState) => state.error,
  getPagination: (state: ProjectsState) => ({
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    totalCount: state.totalCount,
    itemsPerPage: state.itemsPerPage
  }),
  getSelectedProjectsData: (state: ProjectsState) => 
    state.projects.filter(project => state.selectedProjects.includes(project.id)),
  getActiveProjects: (state: ProjectsState) => 
    state.projects.filter(project => project.status === 'active'),
  getCompletedProjects: (state: ProjectsState) => 
    state.projects.filter(project => project.status === 'completed'),
  getProjectsByPriority: (state: ProjectsState, priority: string) => 
    state.projects.filter(project => project.priority === priority)
}
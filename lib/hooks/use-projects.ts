import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '../services/projects/project.service'
import type { Project, ProjectFormData, ProjectItem, ProjectItemFormData, ProjectFilterOptions } from '../types'

// Query keys for consistent caching
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: ProjectFilterOptions) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  items: (projectId: string) => [...projectKeys.all, 'items', projectId] as const,
  metrics: () => [...projectKeys.all, 'metrics'] as const,
  search: (query: string, filters?: ProjectFilterOptions) => [...projectKeys.all, 'search', query, filters] as const
}

/**
 * Hook to fetch all projects with caching
 */
export function useProjects(filters: ProjectFilterOptions = {}) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => projectService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}

/**
 * Hook to fetch a single project
 */
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  })
}

/**
 * Hook to fetch project items
 */
export function useProjectItems(projectId: string) {
  return useQuery({
    queryKey: projectKeys.items(projectId),
    queryFn: () => projectService.getProjectItems(projectId),
    enabled: !!projectId,
    staleTime: 3 * 60 * 1000, // 3 minutes (more frequent for project items)
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true
  })
}

/**
 * Hook to search projects
 */
export function useProjectSearch(query: string, filters: ProjectFilterOptions = {}) {
  return useQuery({
    queryKey: projectKeys.search(query, filters),
    queryFn: () => projectService.search(query, filters),
    enabled: !!query && query.length >= 2,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1
  })
}

/**
 * Hook to get project metrics
 */
export function useProjectMetrics() {
  return useQuery({
    queryKey: projectKeys.metrics(),
    queryFn: () => projectService.getMetrics(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false
  })
}

/**
 * Hook to create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectData: ProjectFormData) => projectService.create(projectData),
    onSuccess: (newProject) => {
      // Invalidate and refetch project lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      
      // Add the new project to the cache
      queryClient.setQueryData(projectKeys.detail(newProject.id), newProject)
      
      // Invalidate metrics
      queryClient.invalidateQueries({ queryKey: projectKeys.metrics() })
    },
    onError: (error) => {
      console.error('Failed to create project:', error)
    }
  })
}

/**
 * Hook to update a project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ProjectFormData> }) =>
      projectService.update(id, updates),
    onSuccess: (updatedProject, { id }) => {
      // Update the specific project in cache
      queryClient.setQueryData(projectKeys.detail(id), updatedProject)
      
      // Invalidate lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      
      // Invalidate metrics
      queryClient.invalidateQueries({ queryKey: projectKeys.metrics() })
    },
    onError: (error) => {
      console.error('Failed to update project:', error)
    }
  })
}

/**
 * Hook to delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectService.delete(id),
    onSuccess: (_, id) => {
      // Remove the project from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) })
      queryClient.removeQueries({ queryKey: projectKeys.items(id) })
      
      // Invalidate lists to refetch without the deleted project
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.metrics() })
    },
    onError: (error) => {
      console.error('Failed to delete project:', error)
    }
  })
}

/**
 * Hook to add a project item
 */
export function useAddProjectItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, itemData }: { projectId: string; itemData: ProjectItemFormData }) =>
      projectService.addItem(projectId, itemData),
    onSuccess: (newItem, { projectId }) => {
      // Invalidate project items cache
      queryClient.invalidateQueries({ queryKey: projectKeys.items(projectId) })
      
      // Update project cache to reflect new item count
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      
      // Invalidate project lists to update progress
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      
      // Invalidate metrics
      queryClient.invalidateQueries({ queryKey: projectKeys.metrics() })
    },
    onError: (error) => {
      console.error('Failed to add project item:', error)
    }
  })
}

/**
 * Hook to update a project item
 */
export function useUpdateProjectItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: Partial<ProjectItemFormData> }) =>
      projectService.updateItem(itemId, updates),
    onSuccess: (updatedItem, { itemId }) => {
      // Find which project this item belongs to
      const projectId = updatedItem.projectId
      
      // Invalidate project items cache
      queryClient.invalidateQueries({ queryKey: projectKeys.items(projectId) })
      
      // Update project cache to reflect changes
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      
      // Invalidate project lists to update progress
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      
      // Invalidate metrics
      queryClient.invalidateQueries({ queryKey: projectKeys.metrics() })
    },
    onError: (error) => {
      console.error('Failed to update project item:', error)
    }
  })
}

/**
 * Hook to delete a project item
 */
export function useDeleteProjectItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) => projectService.deleteItem(itemId),
    onSuccess: (_, itemId) => {
      // We need to find which project this item belonged to
      // For now, invalidate all project items caches
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      
      // Invalidate metrics
      queryClient.invalidateQueries({ queryKey: projectKeys.metrics() })
    },
    onError: (error) => {
      console.error('Failed to delete project item:', error)
    }
  })
}

/**
 * Hook to prefetch project data
 */
export function usePrefetchProject() {
  const queryClient = useQueryClient()

  const prefetchProject = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: projectKeys.detail(id),
      queryFn: () => projectService.getById(id),
      staleTime: 5 * 60 * 1000
    })
  }

  const prefetchProjectItems = (projectId: string) => {
    queryClient.prefetchQuery({
      queryKey: projectKeys.items(projectId),
      queryFn: () => projectService.getProjectItems(projectId),
      staleTime: 3 * 60 * 1000
    })
  }

  const prefetchMetrics = () => {
    queryClient.prefetchQuery({
      queryKey: projectKeys.metrics(),
      queryFn: () => projectService.getMetrics(),
      staleTime: 10 * 60 * 1000
    })
  }

  return {
    prefetchProject,
    prefetchProjectItems,
    prefetchMetrics
  }
}

/**
 * Hook to update project progress
 */
export function useUpdateProjectProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectId: string) => projectService.updateProgress(projectId),
    onSuccess: (_, projectId) => {
      // Invalidate project cache to reflect updated progress
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.items(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.metrics() })
    },
    onError: (error) => {
      console.error('Failed to update project progress:', error)
    }
  })
}

/**
 * Hook for optimistic updates on project progress
 */
export function useOptimisticProjectUpdate() {
  const queryClient = useQueryClient()

  const optimisticUpdateProgress = (projectId: string, newProgress: number) => {
    // Optimistically update the project in cache
    queryClient.setQueryData(projectKeys.detail(projectId), (oldData: Project | undefined) => {
      if (!oldData) return oldData
      return { ...oldData, progress: newProgress }
    })

    // Also update in lists cache
    queryClient.setQueriesData(
      { queryKey: projectKeys.lists() },
      (oldData: Project[] | undefined) => {
        if (!oldData) return oldData
        return oldData.map(project => 
          project.id === projectId 
            ? { ...project, progress: newProgress }
            : project
        )
      }
    )
  }

  return {
    optimisticUpdateProgress
  }
}
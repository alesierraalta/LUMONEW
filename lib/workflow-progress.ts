import { createClient } from './supabase/client'
import { ProjectItem, WORKFLOW_CONFIGS } from './types'

// ============================================================================
// UNIFIED WORKFLOW PROGRESS CALCULATION
// ============================================================================

export interface WorkflowProgress {
  currentStep: number
  totalSteps: number
  percentage: number
  currentStepKey: string
  currentStepLabel: string
  isCompleted: boolean
  completedSteps: string[]
  // Additional debugging info
  totalTasks?: number
  completedTaskCount?: number
  tasksByStep?: Record<string, any[]>
}

/**
 * Calculate unified workflow progress based on actual task completion
 * This replaces the inconsistent progress calculations across different components
 */
export async function calculateWorkflowProgress(item: ProjectItem): Promise<WorkflowProgress> {
  const supabase = createClient()
  
  // Get all tasks for this workflow item
  let allTasks: any[] = []
  let completedTasks: any[] = []
  let tasksByStep: Record<string, any[]> = {}
  
  if (item.productType === 'CL') {
    const { data: tasks } = await supabase
      .from('cl_tasks')
      .select('id, step_key, status, title')
      .eq('workflow_item_id', item.id)
      .order('created_at', { ascending: true })
    
    allTasks = tasks || []
    completedTasks = allTasks.filter(task => task.status === 'completed')
    
    // Group tasks by step
    tasksByStep = allTasks.reduce((acc: Record<string, any[]>, task) => {
      if (!acc[task.step_key]) acc[task.step_key] = []
      acc[task.step_key].push(task)
      return acc
    }, {})
    
  } else if (item.productType === 'IMP') {
    const { data: tasks } = await supabase
      .from('imp_tasks')
      .select('id, step_key, status, title')
      .eq('workflow_item_id', item.id)
      .order('created_at', { ascending: true })
    
    allTasks = tasks || []
    completedTasks = allTasks.filter(task => task.status === 'completed')
    
    // Group tasks by step
    tasksByStep = allTasks.reduce((acc: Record<string, any[]>, task) => {
      if (!acc[task.step_key]) acc[task.step_key] = []
      acc[task.step_key].push(task)
      return acc
    }, {})
    
  } else if (item.productType === 'LU') {
    // LU items are simpler, just check if completed
    allTasks = [{ step_key: 'inventario_seleccionado', status: item.isCompleted ? 'completed' : 'pending', title: 'Seleccionar del Inventario' }]
    completedTasks = item.isCompleted ? allTasks : []
    tasksByStep = { 'inventario_seleccionado': allTasks }
  }
  
  // Calculate progress based on actual tasks
  const totalTasks = allTasks.length
  const completedCount = completedTasks.length
  const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0
  const isCompleted = completedCount === totalTasks && totalTasks > 0
  
  // Debug logging (uncomment for debugging)
  // console.log(`🔍 Workflow Progress Debug for ${item.productType} item ${item.id}:`)
  // console.log(`📊 Total tasks found: ${totalTasks}`)
  // console.log(`✅ Completed tasks: ${completedCount}`)
  // console.log(`📋 Tasks by step:`, Object.keys(tasksByStep).map(key => `${key}: ${tasksByStep[key].length}`).join(', '))
  // console.log(`🎯 All tasks:`, allTasks.map(t => `${t.title} (${t.status})`).join(', '))
  
  // Find current step (first step with incomplete tasks)
  const workflowConfig = WORKFLOW_CONFIGS[item.productType]
  let currentStepKey = workflowConfig.statuses[workflowConfig.statuses.length - 1].key // Default to last step
  let currentStepLabel = workflowConfig.statuses[workflowConfig.statuses.length - 1].label
  let completedSteps: string[] = []
  
  // Check each step in order
  for (const status of workflowConfig.statuses) {
    const stepTasks = tasksByStep[status.key] || []
    const stepCompleted = stepTasks.length > 0 && stepTasks.every(t => t.status === 'completed')
    
    if (stepCompleted) {
      completedSteps.push(status.key)
    } else if (stepTasks.length > 0) {
      // This is the current step (has tasks but not all completed)
      currentStepKey = status.key
      currentStepLabel = status.label
      break
    }
  }
  
  const currentStep = Math.min(completedSteps.length + 1, workflowConfig.statuses.length)
  
  return {
    currentStep,
    totalSteps: totalTasks, // Use actual task count instead of workflow steps
    percentage,
    currentStepKey,
    currentStepLabel,
    isCompleted,
    completedSteps,
    // Add additional info for debugging
    totalTasks,
    completedTaskCount: completedCount,
    tasksByStep
  }
}

/**
 * Calculate workflow progress purely from an in-memory task list fetched by the UI/API.
 * Avoids client-side RLS issues and stays in sync with the visible tasks.
 */
export function calculateWorkflowProgressFromTasks(
  item: ProjectItem,
  tasks: Array<{ id: string; stepKey: string; status: string; title?: string }>
): WorkflowProgress {
  // Group tasks by step
  const tasksByStep: Record<string, any[]> = tasks.reduce((acc, t) => {
    const key = t.stepKey
    if (!acc[key]) acc[key] = []
    acc[key].push({ id: t.id, title: t.title || '', status: t.status })
    return acc
  }, {} as Record<string, any[]>)

  const allTasks = tasks
  const completedTasks = allTasks.filter(t => t.status === 'completed')
  const totalTasks = allTasks.length
  const completedCount = completedTasks.length
  const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0
  const isCompleted = completedCount === totalTasks && totalTasks > 0

  const workflowConfig = WORKFLOW_CONFIGS[item.productType]
  let currentStepKey = workflowConfig.statuses[workflowConfig.statuses.length - 1].key
  let currentStepLabel = workflowConfig.statuses[workflowConfig.statuses.length - 1].label
  const completedSteps: string[] = []

  for (const status of workflowConfig.statuses) {
    const stepTasks = tasksByStep[status.key] || []
    const stepCompleted = stepTasks.length > 0 && stepTasks.every((t: any) => t.status === 'completed')
    if (stepCompleted) {
      completedSteps.push(status.key)
    } else if (stepTasks.length > 0) {
      currentStepKey = status.key
      currentStepLabel = status.label
      break
    }
  }

  const currentStep = Math.min(completedSteps.length + 1, workflowConfig.statuses.length)

  return {
    currentStep,
    totalSteps: totalTasks,
    percentage,
    currentStepKey,
    currentStepLabel,
    isCompleted,
    completedSteps,
    totalTasks,
    completedTaskCount: completedCount,
    tasksByStep
  }
}

/**
 * Get step status for progress bar rendering
 */
export function getStepStatus(stepKey: string, progress: WorkflowProgress): 'completed' | 'current' | 'pending' {
  if (progress.completedSteps.includes(stepKey)) {
    return 'completed'
  }
  
  if (stepKey === progress.currentStepKey) {
    return 'current'
  }
  
  return 'pending'
}

/**
 * Get step color based on status
 */
export function getStepColor(status: 'completed' | 'current' | 'pending', productType: 'CL' | 'IMP' | 'LU'): string {
  if (status === 'completed') {
    return 'bg-green-600 text-white'
  }
  
  if (status === 'current') {
    switch (productType) {
      case 'CL':
        return 'bg-blue-600 text-white'
      case 'IMP':
        return 'bg-orange-600 text-white'
      case 'LU':
        return 'bg-green-600 text-white'
      default:
        return 'bg-blue-600 text-white'
    }
  }
  
  return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
}

/**
 * Get connection line color for progress bar
 */
export function getConnectionColor(isCompleted: boolean): string {
  return isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
}

/**
 * Update workflow progress incrementally when a task status changes
 * This avoids full recalculation for better performance
 */
export function updateWorkflowProgressIncremental(
  currentProgress: WorkflowProgress,
  taskId: string,
  oldStatus: string,
  newStatus: string
): WorkflowProgress {
  if (!currentProgress.tasksByStep) return currentProgress

  // Find and update the specific task
  let taskFound = false
  const updatedTasksByStep = { ...currentProgress.tasksByStep }
  
  for (const [stepKey, tasks] of Object.entries(updatedTasksByStep)) {
    const taskIndex = tasks.findIndex((t: any) => t.id === taskId)
    if (taskIndex !== -1) {
      // Create a new array with the updated task
      updatedTasksByStep[stepKey] = [...tasks]
      updatedTasksByStep[stepKey][taskIndex] = {
        ...tasks[taskIndex],
        status: newStatus
      }
      taskFound = true
      break
    }
  }
  
  if (!taskFound) {
    // If task not found, return current progress unchanged
    return currentProgress
  }
  
  // Recalculate totals incrementally
  let totalTasks = 0
  let completedCount = 0
  
  for (const tasks of Object.values(updatedTasksByStep)) {
    totalTasks += tasks.length
    completedCount += tasks.filter((t: any) => t.status === 'completed').length
  }
  
  const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0
  const isCompleted = completedCount === totalTasks && totalTasks > 0
  
  // Debug logging for incremental update (uncomment for debugging)
  // console.log(`🔄 Incremental update: Task ${taskId} changed from ${oldStatus} to ${newStatus}`)
  // console.log(`📊 New totals: ${completedCount}/${totalTasks} (${percentage}%)`)
  
  return {
    ...currentProgress,
    tasksByStep: updatedTasksByStep,
    totalTasks,
    completedTaskCount: completedCount,
    percentage,
    isCompleted
  }
}

/**
 * Generate progress bar items based on actual individual tasks (one circle per task)
 * This bypasses workflow step grouping and creates one circle per actual task in database
 */
export function generateIndividualTaskProgressBar(progress: WorkflowProgress): Array<{
  id: string
  title: string
  status: 'completed' | 'current' | 'pending'
  stepKey: string
  stepLabel: string
}> {
  // Instead of using tasksByStep grouping, let's create circles from all individual tasks
  const allTasks: Array<{
    id: string
    title: string
    status: 'completed' | 'current' | 'pending'
    stepKey: string
    stepLabel: string
  }> = []
  
  // If we have tasksByStep, flatten all tasks from all steps
  if (progress.tasksByStep) {
    Object.entries(progress.tasksByStep).forEach(([stepKey, stepTasks]) => {
      stepTasks.forEach((task) => {
        let taskStatus: 'completed' | 'current' | 'pending' = 'pending'
        
        if (task.status === 'completed') {
          taskStatus = 'completed'
        } else if (task.status === 'in_progress') {
          taskStatus = 'current'
        } else {
          taskStatus = 'pending'
        }
        
        allTasks.push({
          id: task.id || `${stepKey}_task_${task.title}`,
          title: task.title || `Task ${allTasks.length + 1}`,
          status: taskStatus,
          stepKey: stepKey,
          stepLabel: stepKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        })
      })
    })
  }

  // Ensure there's a visible "current" task even if none is explicitly in_progress.
  // Pick the first pending task in the currentStepKey as the current one.
  if (allTasks.length > 0 && !allTasks.some(t => t.status === 'current')) {
    const index = allTasks.findIndex(t => t.stepKey === progress.currentStepKey && t.status === 'pending')
    if (index >= 0) {
      allTasks[index] = { ...allTasks[index], status: 'current' }
    }
  }
  
  // Debug logging for color issue (uncomment for debugging)
  // console.log(`🎨 Generated ${allTasks.length} individual task circles:`)
  // console.log(`🎯 Task statuses:`, allTasks.map(t => `${t.title}: ${t.status}`).join(', '))
  
  return allTasks
}

/**
 * Generate progress bar items based on actual tasks (one circle per step showing task count)
 */
export function generateTaskBasedProgressBar(progress: WorkflowProgress): Array<{
  id: string
  label: string
  status: 'completed' | 'current' | 'pending'
  taskCount: number
  completedCount: number
}> {
  if (!progress.tasksByStep) return []
  
  const workflowConfig = WORKFLOW_CONFIGS[progress.currentStepKey.includes('inventario') ? 'LU' : 
                                         progress.currentStepKey.includes('cotizacion') || progress.currentStepKey.includes('coordinar_envio_pagar_flete') ? 'CL' : 'IMP']
  
  return workflowConfig.statuses.map(status => {
    const stepTasks = progress.tasksByStep![status.key] || []
    const completedTasks = stepTasks.filter(t => t.status === 'completed')
    
    let stepStatus: 'completed' | 'current' | 'pending' = 'pending'
    
    if (stepTasks.length === 0) {
      stepStatus = 'pending'
    } else if (completedTasks.length === stepTasks.length) {
      stepStatus = 'completed'
    } else {
      stepStatus = 'current'
    }
    
    return {
      id: status.key,
      label: status.label,
      status: stepStatus,
      taskCount: stepTasks.length,
      completedCount: completedTasks.length
    }
  })
}
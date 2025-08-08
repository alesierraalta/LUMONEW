import { createClient } from './supabase/server'

const supabase = createClient()

// ============================================================================
// TYPES FOR CL TASKS
// ============================================================================
export interface CLTask {
  id: string
  workflowItemId: string
  stepKey: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  assignedTo?: string
  assignedToName?: string
  dueDate?: Date
  completedAt?: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date
  notes?: CLTaskNote[]
  attachments?: CLTaskAttachment[]
  history?: CLTaskHistory[]
}

export interface CLTaskNote {
  id: string
  taskId: string
  content: string
  createdBy: string
  createdByName: string
  createdAt: Date
}

export interface CLTaskAttachment {
  id: string
  taskId: string
  fileName: string
  fileUrl: string
  fileType?: string
  fileSize?: number
  uploadedBy: string
  uploadedByName: string
  uploadedAt: Date
}

export interface CLTaskHistory {
  id: string
  taskId: string
  oldStatus?: string
  newStatus: string
  changedBy: string
  changedByName: string
  notes?: string
  createdAt: Date
}

// ============================================================================
// CL TASKS SERVICE
// ============================================================================
export const clTasksService = {
  // Get all tasks for a workflow item
  async getTasksByWorkflowItem(workflowItemId: string): Promise<CLTask[]> {
    const { data, error } = await supabase
      .from('cl_tasks')
      .select(`
        *,
        notes:cl_task_notes(*),
        attachments:cl_task_attachments(*),
        history:cl_task_history(*)
      `)
      .eq('workflow_item_id', workflowItemId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    return data?.map(task => ({
      id: task.id,
      workflowItemId: task.workflow_item_id,
      stepKey: task.step_key,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignedTo: task.assigned_to,
      assignedToName: task.assigned_to_name,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
      createdBy: task.created_by,
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.updated_at),
      notes: task.notes?.map((note: any) => ({
        id: note.id,
        taskId: note.task_id,
        content: note.content,
        createdBy: note.created_by,
        createdByName: note.created_by_name,
        createdAt: new Date(note.created_at)
      })),
      attachments: task.attachments?.map((att: any) => ({
        id: att.id,
        taskId: att.task_id,
        fileName: att.file_name,
        fileUrl: att.file_url,
        fileType: att.file_type,
        fileSize: att.file_size,
        uploadedBy: att.uploaded_by,
        uploadedByName: att.uploaded_by_name,
        uploadedAt: new Date(att.uploaded_at)
      })),
      history: task.history?.map((hist: any) => ({
        id: hist.id,
        taskId: hist.task_id,
        oldStatus: hist.old_status,
        newStatus: hist.new_status,
        changedBy: hist.changed_by,
        changedByName: hist.changed_by_name,
        notes: hist.notes,
        createdAt: new Date(hist.created_at)
      }))
    })) || []
  },

  // Create a new task
  async createTask(task: {
    workflowItemId: string
    stepKey: string
    title: string
    description?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    assignedTo?: string
    assignedToName?: string
    dueDate?: Date
    createdBy: string
  }): Promise<CLTask> {
    const { data, error } = await supabase
      .from('cl_tasks')
      .insert([{
        workflow_item_id: task.workflowItemId,
        step_key: task.stepKey,
        title: task.title,
        description: task.description,
        priority: task.priority || 'medium',
        assigned_to: task.assignedTo,
        assigned_to_name: task.assignedToName,
        due_date: task.dueDate?.toISOString().split('T')[0],
        created_by: task.createdBy
      }])
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: data.id,
      workflowItemId: data.workflow_item_id,
      stepKey: data.step_key,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      assignedTo: data.assigned_to,
      assignedToName: data.assigned_to_name,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  },

  // Update task
  async updateTask(taskId: string, updates: {
    title?: string
    description?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    status?: 'pending' | 'in_progress' | 'completed' | 'blocked'
    assignedTo?: string
    assignedToName?: string
    dueDate?: Date
  }): Promise<CLTask> {
    const updateData: any = {}
    
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.priority !== undefined) updateData.priority = updates.priority
    if (updates.status !== undefined) {
      updateData.status = updates.status
      if (updates.status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }
    }
    if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo
    if (updates.assignedToName !== undefined) updateData.assigned_to_name = updates.assignedToName
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate?.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('cl_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single()
    
    if (error) throw error

    // If the task was completed, update the workflow item's current_status
    if (updates.status === 'completed') {
      await this.updateWorkflowItemStatus(data.workflow_item_id, data.step_key)
    }
    
    return {
      id: data.id,
      workflowItemId: data.workflow_item_id,
      stepKey: data.step_key,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      assignedTo: data.assigned_to,
      assignedToName: data.assigned_to_name,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  },

  // Update workflow item status based on completed tasks
  async updateWorkflowItemStatus(workflowItemId: string, completedStepKey: string): Promise<void> {
    // Get all tasks for this workflow item to determine the next status
    const tasks = await this.getTasksByWorkflowItem(workflowItemId)
    
    // Define the workflow step order for CL
    const stepOrder = [
      'solicitar_cotizacion',
      'pagar_cotizacion', 
      'coordinar_envio_pagar_flete',
      'recibido'
    ]
    
    // Find the next incomplete step
    let nextStatus = 'recibido' // Default to final status
    
    for (const stepKey of stepOrder) {
      const stepTasks = tasks.filter(t => t.stepKey === stepKey)
      const allStepTasksCompleted = stepTasks.length > 0 && stepTasks.every(t => t.status === 'completed')
      
      if (!allStepTasksCompleted) {
        nextStatus = stepKey
        break
      }
    }
    
    // Update the project item's current_status (workflow_item_id references project_items.id)
    const { error } = await supabase
      .from('project_items')
      .update({ 
        current_status: nextStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowItemId)
    
    if (error) {
      console.error('Error updating workflow item status:', error)
      throw error
    }
  },

  // Delete task
  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('cl_tasks')
      .delete()
      .eq('id', taskId)
    
    if (error) throw error
  },

  // Save work data for a task
  async saveWorkData(taskId: string, workData: {
    executionDate: Date
    executedBy: string
    executedById: string
    notes?: string
    attachments?: any[]
    specificData?: any
  }): Promise<any> {
    // Save work data to cl_task_work_data table
    const { data, error } = await supabase
      .from('cl_task_work_data')
      .upsert([{
        task_id: taskId,
        execution_date: workData.executionDate.toISOString().split('T')[0],
        executed_by: workData.executedBy,
        executed_by_id: workData.executedById,
        notes: workData.notes,
        attachments: workData.attachments || [],
        specific_data: workData.specificData || {}
      }])
      .select()
      .single()
    
    if (error) throw error

    // Also update the task status to completed (this will trigger workflow status update)
    await this.updateTask(taskId, { status: 'completed' })
    
    return {
      id: data.id,
      taskId: data.task_id,
      executionDate: new Date(data.execution_date),
      executedBy: data.executed_by,
      executedById: data.executed_by_id,
      notes: data.notes,
      attachments: data.attachments,
      specificData: data.specific_data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  },

  // Get work data for a task
  async getWorkData(taskId: string): Promise<any> {
    const { data, error } = await supabase
      .from('cl_task_work_data')
      .select('*')
      .eq('task_id', taskId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No work data found
        return null
      }
      throw error
    }
    
    return {
      id: data.id,
      taskId: data.task_id,
      executionDate: new Date(data.execution_date),
      executedBy: data.executed_by,
      executedById: data.executed_by_id,
      notes: data.notes,
      attachments: data.attachments,
      specificData: data.specific_data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
}

// ============================================================================
// CL TASK NOTES SERVICE
// ============================================================================
export const clTaskNotesService = {
  // Add note to task
  async addNote(note: {
    taskId: string
    content: string
    createdBy: string
    createdByName: string
  }): Promise<CLTaskNote> {
    const { data, error } = await supabase
      .from('cl_task_notes')
      .insert([{
        task_id: note.taskId,
        content: note.content,
        created_by: note.createdBy,
        created_by_name: note.createdByName
      }])
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: data.id,
      taskId: data.task_id,
      content: data.content,
      createdBy: data.created_by,
      createdByName: data.created_by_name,
      createdAt: new Date(data.created_at)
    }
  },

  // Get notes for task
  async getNotesByTask(taskId: string): Promise<CLTaskNote[]> {
    const { data, error } = await supabase
      .from('cl_task_notes')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    return data?.map(note => ({
      id: note.id,
      taskId: note.task_id,
      content: note.content,
      createdBy: note.created_by,
      createdByName: note.created_by_name,
      createdAt: new Date(note.created_at)
    })) || []
  },

  // Delete note
  async deleteNote(noteId: string): Promise<void> {
    const { error } = await supabase
      .from('cl_task_notes')
      .delete()
      .eq('id', noteId)
    
    if (error) throw error
  }
}

// ============================================================================
// CL TASK ATTACHMENTS SERVICE
// ============================================================================
export const clTaskAttachmentsService = {
  // Add attachment to task
  async addAttachment(attachment: {
    taskId: string
    fileName: string
    fileUrl: string
    fileType?: string
    fileSize?: number
    uploadedBy: string
    uploadedByName: string
  }): Promise<CLTaskAttachment> {
    const { data, error } = await supabase
      .from('cl_task_attachments')
      .insert([{
        task_id: attachment.taskId,
        file_name: attachment.fileName,
        file_url: attachment.fileUrl,
        file_type: attachment.fileType,
        file_size: attachment.fileSize,
        uploaded_by: attachment.uploadedBy,
        uploaded_by_name: attachment.uploadedByName
      }])
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: data.id,
      taskId: data.task_id,
      fileName: data.file_name,
      fileUrl: data.file_url,
      fileType: data.file_type,
      fileSize: data.file_size,
      uploadedBy: data.uploaded_by,
      uploadedByName: data.uploaded_by_name,
      uploadedAt: new Date(data.uploaded_at)
    }
  },

  // Get attachments for task
  async getAttachmentsByTask(taskId: string): Promise<CLTaskAttachment[]> {
    const { data, error } = await supabase
      .from('cl_task_attachments')
      .select('*')
      .eq('task_id', taskId)
      .order('uploaded_at', { ascending: false })
    
    if (error) throw error
    
    return data?.map(att => ({
      id: att.id,
      taskId: att.task_id,
      fileName: att.file_name,
      fileUrl: att.file_url,
      fileType: att.file_type,
      fileSize: att.file_size,
      uploadedBy: att.uploaded_by,
      uploadedByName: att.uploaded_by_name,
      uploadedAt: new Date(att.uploaded_at)
    })) || []
  },

  // Delete attachment
  async deleteAttachment(attachmentId: string): Promise<void> {
    const { error } = await supabase
      .from('cl_task_attachments')
      .delete()
      .eq('id', attachmentId)
    
    if (error) throw error
  }
}

// ============================================================================
// CL TASK HISTORY SERVICE
// ============================================================================
export const clTaskHistoryService = {
  // Get history for task
  async getHistoryByTask(taskId: string): Promise<CLTaskHistory[]> {
    const { data, error } = await supabase
      .from('cl_task_history')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data?.map(hist => ({
      id: hist.id,
      taskId: hist.task_id,
      oldStatus: hist.old_status,
      newStatus: hist.new_status,
      changedBy: hist.changed_by,
      changedByName: hist.changed_by_name,
      notes: hist.notes,
      createdAt: new Date(hist.created_at)
    })) || []
  }
}
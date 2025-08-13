import { createClient } from './supabase/server'

export interface IMPTask {
  id: string
  workflowItemId: string
  stepKey: string
  title: string
  description?: string
  assignedTo?: string
  assignedToName?: string
  dueDate?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  shippingType?: 'aereo' | 'maritimo'
  completedAt?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy?: string
  notes?: Array<{
    id: string
    content: string
    createdBy: string
    createdAt: string
  }>
  attachments?: Array<{
    id: string
    fileName: string
    filePath: string
    fileSize?: number
    mimeType?: string
    createdBy: string
    createdAt: string
  }>
}

export interface CreateIMPTaskData {
  workflowItemId: string
  stepKey: string
  title: string
  description?: string
  assignedTo?: string
  assignedToName?: string
  dueDate?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  shippingType?: 'aereo' | 'maritimo'
  createdBy: string
}

export interface UpdateIMPTaskData {
  title?: string
  description?: string
  assignedTo?: string
  assignedToName?: string
  dueDate?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked'
  shippingType?: 'aereo' | 'maritimo'
  updatedBy: string
}

export const impTasksService = {
  async getAll(workflowItemId: string): Promise<IMPTask[]> {
    const supabase = createClient()

    const { data: tasks, error } = await supabase
      .from('imp_tasks')
      .select(`
        *,
        notes:imp_task_notes(*),
        attachments:imp_task_attachments(*)
      `)
      .eq('workflow_item_id', workflowItemId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Error fetching IMP tasks: ${error.message}`)
    }

    return tasks.map(task => ({
      id: task.id,
      workflowItemId: task.workflow_item_id,
      stepKey: task.step_key,
      title: task.title,
      description: task.description,
      assignedTo: task.assigned_to,
      assignedToName: task.assigned_to_name,
      dueDate: task.due_date,
      priority: task.priority,
      status: task.status,
      shippingType: task.shipping_type,
      completedAt: task.completed_at,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      createdBy: task.created_by,
      updatedBy: task.updated_by,
      notes: task.notes || [],
      attachments: task.attachments || []
    }))
  },

  async getById(id: string): Promise<IMPTask | null> {
    const supabase = createClient()

    const { data: task, error } = await supabase
      .from('imp_tasks')
      .select(`
        *,
        notes:imp_task_notes(*),
        attachments:imp_task_attachments(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Error fetching IMP task: ${error.message}`)
    }

    return {
      id: task.id,
      workflowItemId: task.workflow_item_id,
      stepKey: task.step_key,
      title: task.title,
      description: task.description,
      assignedTo: task.assigned_to,
      assignedToName: task.assigned_to_name,
      dueDate: task.due_date,
      priority: task.priority,
      status: task.status,
      shippingType: task.shipping_type,
      completedAt: task.completed_at,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      createdBy: task.created_by,
      updatedBy: task.updated_by,
      notes: task.notes || [],
      attachments: task.attachments || []
    }
  },

  async create(data: CreateIMPTaskData): Promise<IMPTask> {
    const supabase = createClient()

    const { data: task, error } = await supabase
      .from('imp_tasks')
      .insert({
        workflow_item_id: data.workflowItemId,
        step_key: data.stepKey,
        title: data.title,
        description: data.description,
        assigned_to: data.assignedTo,
        assigned_to_name: data.assignedToName,
        due_date: data.dueDate,
        priority: data.priority,
        shipping_type: data.shippingType,
        created_by: data.createdBy
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating IMP task: ${error.message}`)
    }

    return {
      id: task.id,
      workflowItemId: task.workflow_item_id,
      stepKey: task.step_key,
      title: task.title,
      description: task.description,
      assignedTo: task.assigned_to,
      assignedToName: task.assigned_to_name,
      dueDate: task.due_date,
      priority: task.priority,
      status: task.status,
      shippingType: task.shipping_type,
      completedAt: task.completed_at,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      createdBy: task.created_by,
      updatedBy: task.updated_by,
      notes: [],
      attachments: []
    }
  },

  async update(id: string, data: UpdateIMPTaskData): Promise<IMPTask> {
    const supabase = createClient()

    const updateData: any = {
      updated_by: data.updatedBy
    }

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.assignedTo !== undefined) updateData.assigned_to = data.assignedTo
    if (data.assignedToName !== undefined) updateData.assigned_to_name = data.assignedToName
    if (data.dueDate !== undefined) updateData.due_date = data.dueDate
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.shippingType !== undefined) updateData.shipping_type = data.shippingType
    
    if (data.status !== undefined) {
      updateData.status = data.status
      if (data.status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }
    }

    const { data: task, error } = await supabase
      .from('imp_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating IMP task: ${error.message}`)
    }

    // If the task was completed, update the workflow item's current_status
    if (data.status === 'completed') {
      await this.updateWorkflowItemStatus(task.workflow_item_id, task.step_key)
    }

    return {
      id: task.id,
      workflowItemId: task.workflow_item_id,
      stepKey: task.step_key,
      title: task.title,
      description: task.description,
      assignedTo: task.assigned_to,
      assignedToName: task.assigned_to_name,
      dueDate: task.due_date,
      priority: task.priority,
      status: task.status,
      shippingType: task.shipping_type,
      completedAt: task.completed_at,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      createdBy: task.created_by,
      updatedBy: task.updated_by,
      notes: [],
      attachments: []
    }
  },

  // Update workflow item status based on completed tasks
  async updateWorkflowItemStatus(workflowItemId: string, completedStepKey: string): Promise<void> {
    const supabase = createClient()
    
    // Get all tasks for this workflow item to determine the next status
    const tasks = await this.getAll(workflowItemId)
    
    // Define the workflow step order for IMP (según contexto)
    // 1 Pagar PI -> 2 Enviar etiqueta -> 3 Coordinar envío (aéreo/marítimo) -> 4 Pagar arancel -> 5 Recibido
    const stepOrder = [
      'pagar_pi_proveedor',
      'enviar_etiqueta_envio',
      'coordinar_envio',
      'pagar_arancel_aduanas',
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

  async deleteTask(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('imp_tasks')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Error deleting IMP task: ${error.message}`)
    }
  },

  async addNote(taskId: string, content: string, createdBy: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('imp_task_notes')
      .insert({
        task_id: taskId,
        content,
        created_by: createdBy
      })

    if (error) {
      throw new Error(`Error adding note to IMP task: ${error.message}`)
    }
  },

  async addAttachment(taskId: string, fileName: string, filePath: string, fileSize: number, mimeType: string, createdBy: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('imp_task_attachments')
      .insert({
        task_id: taskId,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        mime_type: mimeType,
        created_by: createdBy
      })

    if (error) {
      throw new Error(`Error adding attachment to IMP task: ${error.message}`)
    }
  },

  async addHistoryEntry(taskId: string, action: string, oldValue: string | null, newValue: string | null, notes: string | null, createdBy: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('imp_task_history')
      .insert({
        task_id: taskId,
        action,
        old_value: oldValue,
        new_value: newValue,
        notes,
        created_by: createdBy
      })

    if (error) {
      throw new Error(`Error adding history entry to IMP task: ${error.message}`)
    }
  },

  async updateWorkData(taskId: string, workData: {
    executionDate: string,
    executedBy: string,
    executedById: string,
    notes: string,
    specificData: any,
    completedAt: string
  }): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('imp_tasks')
      .update({
        status: 'completed',
        completed_at: workData.completedAt,
        execution_date: workData.executionDate,
        executed_by: workData.executedBy,
        executed_by_id: workData.executedById,
        work_notes: workData.notes,
        specific_data: workData.specificData,
        updated_by: workData.executedById
      })
      .eq('id', taskId)

    if (error) {
      throw new Error(`Error updating work data for IMP task: ${error.message}`)
    }
  }
}
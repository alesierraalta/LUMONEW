import { NextRequest, NextResponse } from 'next/server'
import { impTasksService, CreateIMPTaskData } from '@/lib/imp-tasks-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workflowItemId = searchParams.get('workflowItemId')

    if (!workflowItemId) {
      return NextResponse.json(
        { success: false, error: 'workflowItemId is required' },
        { status: 400 }
      )
    }

    const tasks = await impTasksService.getAll(workflowItemId)

    return NextResponse.json({
      success: true,
      data: tasks
    })

  } catch (error) {
    console.error('Error in IMP tasks GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      workflowItemId,
      stepKey,
      title,
      description,
      assignedTo,
      assignedToName,
      dueDate,
      priority = 'medium',
      shippingType,
      createdBy
    } = body

    if (!workflowItemId || !stepKey || !title || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'workflowItemId, stepKey, title, and createdBy are required' },
        { status: 400 }
      )
    }

    const taskData: CreateIMPTaskData = {
      workflowItemId,
      stepKey,
      title,
      description,
      assignedTo,
      assignedToName,
      dueDate,
      priority,
      shippingType,
      createdBy
    }

    const task = await impTasksService.create(taskData)

    // Add initial note if provided
    if (body.notes && body.notes.trim()) {
      await impTasksService.addNote(task.id, `Tarea creada: ${body.notes}`, createdBy)
    }

    // Add history entry
    await impTasksService.addHistoryEntry(
      task.id,
      'created',
      null,
      'pending',
      `Tarea creada: ${title}`,
      createdBy
    )

    return NextResponse.json({
      success: true,
      data: task
    })

  } catch (error) {
    console.error('Error in IMP tasks POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
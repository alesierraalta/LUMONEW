import { NextRequest, NextResponse } from 'next/server'
import { impTasksService, UpdateIMPTaskData } from '@/lib/imp-tasks-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await impTasksService.getById(params.id)

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'IMP task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: task
    })

  } catch (error) {
    console.error('Error in IMP task GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const {
      title,
      description,
      assignedTo,
      assignedToName,
      dueDate,
      priority,
      status,
      shippingType,
      updatedBy
    } = body

    if (!updatedBy) {
      return NextResponse.json(
        { success: false, error: 'updatedBy is required' },
        { status: 400 }
      )
    }

    // Get current task for history
    const currentTask = await impTasksService.getById(params.id)
    if (!currentTask) {
      return NextResponse.json(
        { success: false, error: 'IMP task not found' },
        { status: 404 }
      )
    }

    const updateData: UpdateIMPTaskData = {
      title,
      description,
      assignedTo,
      assignedToName,
      dueDate,
      priority,
      status,
      shippingType,
      updatedBy
    }

    const updatedTask = await impTasksService.update(params.id, updateData)

    // Add history entry for status change
    if (status && status !== currentTask.status) {
      await impTasksService.addHistoryEntry(
        params.id,
        'status_changed',
        currentTask.status,
        status,
        `Estado cambiado de ${currentTask.status} a ${status}`,
        updatedBy
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedTask
    })

  } catch (error) {
    console.error('Error in IMP task PUT:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await impTasksService.deleteTask(params.id)

    return NextResponse.json({
      success: true,
      message: 'IMP task deleted successfully'
    })

  } catch (error) {
    console.error('Error in IMP task DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
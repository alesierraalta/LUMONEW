import { NextRequest, NextResponse } from 'next/server'
import { clTasksService } from '@/lib/cl-tasks-service'

// PUT /api/cl-tasks/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      priority,
      status,
      assignedTo,
      assignedToName,
      dueDate
    } = body

    const task = await clTasksService.updateTask(params.id, {
      title,
      description,
      priority,
      status,
      assignedTo,
      assignedToName,
      dueDate: dueDate ? new Date(dueDate) : undefined
    })

    return NextResponse.json({
      success: true,
      data: task
    })
  } catch (error) {
    console.error('Error updating CL task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update CL task' },
      { status: 500 }
    )
  }
}

// DELETE /api/cl-tasks/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await clTasksService.deleteTask(params.id)

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting CL task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete CL task' },
      { status: 500 }
    )
  }
}
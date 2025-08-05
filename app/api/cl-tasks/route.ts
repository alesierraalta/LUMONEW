import { NextRequest, NextResponse } from 'next/server'
import { clTasksService } from '@/lib/cl-tasks-service'

// GET /api/cl-tasks?workflowItemId=xxx
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

    const tasks = await clTasksService.getTasksByWorkflowItem(workflowItemId)

    return NextResponse.json({
      success: true,
      data: tasks
    })
  } catch (error) {
    console.error('Error fetching CL tasks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CL tasks' },
      { status: 500 }
    )
  }
}

// POST /api/cl-tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      workflowItemId,
      stepKey,
      title,
      description,
      priority,
      assignedTo,
      assignedToName,
      dueDate,
      createdBy
    } = body

    if (!workflowItemId || !stepKey || !title || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const task = await clTasksService.createTask({
      workflowItemId,
      stepKey,
      title,
      description,
      priority,
      assignedTo,
      assignedToName,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdBy
    })

    return NextResponse.json({
      success: true,
      data: task
    })
  } catch (error) {
    console.error('Error creating CL task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create CL task' },
      { status: 500 }
    )
  }
}
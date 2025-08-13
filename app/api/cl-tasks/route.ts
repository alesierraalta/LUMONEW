import { NextRequest, NextResponse } from 'next/server'
import { clTasksService } from '@/lib/cl-tasks-service'
import { getServiceRoleClient } from '@/lib/supabase/service-role'

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

    // Map provided IDs to auth.users.id to satisfy FK constraints
    const supabaseAdmin = getServiceRoleClient()

    // Resolve creator to an auth user id
    let createdByAuthId: string | null = createdBy
    try {
      const { data: creatorLookup } = await supabaseAdmin.auth.admin.getUserById(createdBy)
      if (!creatorLookup?.user) {
        // Treat provided createdBy as public.users.id and map to auth_user_id
        const { data: publicUser } = await supabaseAdmin
          .from('users')
          .select('auth_user_id')
          .eq('id', createdBy)
          .single()
        if (publicUser?.auth_user_id) {
          createdByAuthId = publicUser.auth_user_id as string
        } else {
          // Fallback to first auth user
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
          createdByAuthId = authUsers?.users?.[0]?.id || null
        }
      }
    } catch {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
      createdByAuthId = authUsers?.users?.[0]?.id || null
    }

    if (!createdByAuthId) {
      return NextResponse.json(
        { success: false, error: 'No valid creator could be resolved' },
        { status: 400 }
      )
    }

    // Resolve assignedTo to an auth user id if provided
    let assignedToAuthId: string | undefined = assignedTo
    if (assignedToAuthId) {
      try {
        const { data: assignedLookup } = await supabaseAdmin.auth.admin.getUserById(assignedToAuthId)
        if (!assignedLookup?.user) {
          const { data: publicAssignee } = await supabaseAdmin
            .from('users')
            .select('auth_user_id')
            .eq('id', assignedToAuthId)
            .single()
          if (publicAssignee?.auth_user_id) {
            assignedToAuthId = publicAssignee.auth_user_id as string
          } else {
            assignedToAuthId = undefined
          }
        }
      } catch {
        assignedToAuthId = undefined
      }
    }

    const task = await clTasksService.createTask({
      workflowItemId,
      stepKey,
      title,
      description,
      priority,
      assignedTo: assignedToAuthId,
      assignedToName,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdBy: createdByAuthId
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
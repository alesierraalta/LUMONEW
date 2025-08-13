import { NextRequest, NextResponse } from 'next/server'
import { impTasksService, CreateIMPTaskData } from '@/lib/imp-tasks-service'
import { getServiceRoleClient } from '@/lib/supabase/service-role'

// GET /api/imp-tasks?workflowItemId=xxx
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

// POST /api/imp-tasks
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

    const taskData: CreateIMPTaskData = {
      workflowItemId,
      stepKey,
      title,
      description,
      assignedTo: assignedToAuthId,
      assignedToName,
      dueDate,
      priority,
      shippingType,
      createdBy: createdByAuthId
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
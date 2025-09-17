import { NextRequest, NextResponse } from 'next/server'
import { workflowItemService } from '@/lib/database'
import { getServiceRoleClient } from '@/lib/supabase/service-role'
import { ensureUserExists } from '@/lib/auth/user-sync'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    const supabaseAdmin = getServiceRoleClient()
    let query = supabaseAdmin.from('workflow_items').select('*')
    if (projectId) query = query.eq('project_id', projectId)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching workflow items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflow items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[workflow-items][POST] Incoming request body:', {
      projectId: body?.projectId,
      productType: body?.productType,
      productName: body?.productName,
      currentStep: body?.currentStep,
      stepDataKeys: body?.stepData ? Object.keys(body.stepData) : [],
      createdBy: body?.createdBy,
    })
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrlMask = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').slice(0, 25) + '...'
    console.log('[workflow-items][POST] Env check:', { supabaseUrl: supabaseUrlMask, hasServiceKey })
    const {
      projectId,
      productType,
      productName,
      currentStep,
      stepData,
      createdBy
    } = body

    if (!projectId || !productType || !productName || !currentStep) {
      console.warn('[workflow-items][POST] Missing required fields', { projectId, productType, productName, currentStep })
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate product type
    if (!['CL', 'IMP'].includes(productType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product type. Must be CL or IMP' },
        { status: 400 }
      )
    }

    // Use service role client on the server to avoid RLS/session context issues
    const supabaseAdmin = getServiceRoleClient()
    console.log('[workflow-items][POST] Using service role client')

    // Determine effective creator in public.users
    let effectiveCreatedBy: string | null = createdBy
    const isZeroGuid = typeof effectiveCreatedBy === 'string' && effectiveCreatedBy.startsWith('00000000-0000-0000-0000-000000000000')

    // Validate that the provided createdBy exists in public.users
    let validPublicUser = false
    if (effectiveCreatedBy && !isZeroGuid) {
      console.log('[workflow-items][POST] Validating provided createdBy in public.users:', effectiveCreatedBy)
      const { data: existingUser, error: existingUserError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', effectiveCreatedBy)
        .single()
      validPublicUser = !!existingUser && !existingUserError
      console.log('[workflow-items][POST] Provided createdBy valid?', validPublicUser, existingUserError ? existingUserError : '')
    }

    if (!validPublicUser) {
      // Try mapping from project creator (auth.users) to public.users.auth_user_id
      try {
        console.log('[workflow-items][POST] Attempting to map createdBy from project created_by → users.auth_user_id')
        const { data: projectRow } = await supabaseAdmin
          .from('projects')
          .select('created_by')
          .eq('id', projectId)
          .single()
        console.log('[workflow-items][POST] Project lookup result:', { hasProject: !!projectRow, created_by: (projectRow as any)?.created_by })
        if ((projectRow as any)?.created_by) {
          const { data: mappedUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('auth_user_id', (projectRow as any).created_by)
            .single()
          if ((mappedUser as any)?.id) {
            effectiveCreatedBy = (mappedUser as any).id
            console.log('[workflow-items][POST] Mapped createdBy from auth_user_id to public.users:', effectiveCreatedBy)
          }
        }
      } catch {
        // ignore mapping failure and fallback below
        console.warn('[workflow-items][POST] Mapping from project creator failed, will fallback to first user or sync')
      }

      // Fallback to first available public user or sync from auth if users table is empty
      if (!effectiveCreatedBy || isZeroGuid) {
        console.log('[workflow-items][POST] Falling back to first public user or syncing from auth...')
        const { data: firstUser, error: firstUserError } = await supabaseAdmin
          .from('users')
          .select('id')
          .limit(1)
          .single()

        if ((firstUser as any)?.id) {
          effectiveCreatedBy = (firstUser as any).id
          console.log('[workflow-items][POST] Fallback to first public user:', effectiveCreatedBy)
        } else {
          // Try to sync from Supabase Auth when users table has no rows
          const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
          if (!authError && authUsers?.users?.length) {
            const candidate = authUsers.users[0]
            const synced = await ensureUserExists(candidate.id)
            if (synced) {
              effectiveCreatedBy = candidate.id
              console.log('[workflow-items][POST] Synced from auth and set createdBy:', effectiveCreatedBy)
            }
          }
        }
      }
    }

    if (!effectiveCreatedBy) {
      console.error('[workflow-items][POST] Could not resolve a valid createdBy, aborting')
      return NextResponse.json(
        { success: false, error: 'No valid creator could be resolved for workflow item' },
        { status: 400 }
      )
    }

    // Generate unique workflow item ID (keeps existing format)
    const workflowId = `${productType.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log('[workflow-items][POST] Prepared insert payload:', {
      id: workflowId,
      project_id: projectId,
      product_type: productType,
      product_name: productName,
      current_step: currentStep,
      step_data_keys: stepData ? Object.keys(stepData) : [],
      created_by: effectiveCreatedBy,
    })

    const { data, error } = await (supabaseAdmin as any)
      .from('workflow_items')
      .insert([
        {
          id: workflowId,
          project_id: projectId,
          product_type: productType,
          product_name: productName,
          current_step: currentStep,
          step_data: stepData || {},
          created_by: effectiveCreatedBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[workflow-items][POST] Error inserting workflow item:', {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
      })
      return NextResponse.json(
        { success: false, error: 'Failed to create workflow item', details: (error as any)?.message || (error as any)?.hint || (error as any)?.details || 'unknown' },
        { status: 500 }
      )
    }

    console.log('[workflow-items][POST] Insert success:', { id: data?.id })
    return NextResponse.json({ success: true, data: data })
  } catch (error) {
    console.error('[workflow-items][POST] Unhandled error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create workflow item' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, currentStep, stepData, ...otherUpdates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Workflow item ID is required' },
        { status: 400 }
      )
    }

    const updates: any = { ...otherUpdates }
    
    if (currentStep) {
      updates.current_step = currentStep
    }
    
    if (stepData) {
      updates.step_data = stepData
    }

    const supabaseAdmin = getServiceRoleClient()
    const { data, error } = await (supabaseAdmin as any)
      .from('workflow_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating workflow item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update workflow item' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Workflow item ID is required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getServiceRoleClient()
    const { error } = await supabaseAdmin
      .from('workflow_items')
      .delete()
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workflow item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete workflow item' },
      { status: 500 }
    )
  }
} 
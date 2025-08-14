import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function mapClStepToStatus(stepId?: string):
  | 'solicitar_cotizacion'
  | 'pagar_cotizacion'
  | 'coordinar_envio_pagar_flete'
  | 'recibido' {
  switch (stepId) {
    case 'cl_step1':
      return 'solicitar_cotizacion'
    case 'cl_step2':
      return 'pagar_cotizacion'
    case 'cl_step3':
      return 'coordinar_envio_pagar_flete'
    case 'cl_step4':
      return 'recibido'
    default:
      return 'solicitar_cotizacion'
  }
}

function mapImpStepToStatus(stepId?: string):
  | 'pagar_pi_proveedor'
  | 'enviar_etiqueta_envio'
  | 'pagar_arancel_aduanas'
  | 'coordinar_envio'
  | 'recibido' {
  switch (stepId) {
    case 'imp_step1':
      return 'pagar_pi_proveedor'
    case 'imp_step2':
      return 'enviar_etiqueta_envio'
    case 'imp_step3':
      return 'pagar_arancel_aduanas'
    case 'imp_step4a':
    case 'imp_step4b':
    case 'imp_step5':
      return 'coordinar_envio'
    case 'imp_step6':
    case 'imp_step7':
      return 'recibido'
    default:
      return 'pagar_pi_proveedor'
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Fetch project_items (for LU) and workflow_items (for CL/IMP)
    const [projectItemsRes, workflowItemsRes] = await Promise.all([
      supabase
        .from('project_items')
        .select(`id, project_id, product_type, is_completed`)
        .eq('project_id', projectId),
      supabase
        .from('workflow_items')
        .select(`id, project_id, product_type, current_step`)
        .eq('project_id', projectId),
    ])

    if ((projectItemsRes as any)?.error) {
      console.error('Database error [project_items]:', (projectItemsRes as any).error)
      return NextResponse.json(
        { success: false, message: 'Error fetching project inventory metrics' },
        { status: 500 }
      )
    }
    if ((workflowItemsRes as any)?.error) {
      console.error('Database error [workflow_items]:', (workflowItemsRes as any).error)
      return NextResponse.json(
        { success: false, message: 'Error fetching project workflow metrics' },
        { status: 500 }
      )
    }

    const projectItems = projectItemsRes.data || []
    const workflowItems = workflowItemsRes.data || []

    // LU metrics from project_items
    const luItems = projectItems.filter((it: any) => it.product_type === 'LU')
    const luCompleted = luItems.filter((it: any) => it.is_completed).length

    // CL metrics from workflow_items
    const clWorkflows = workflowItems.filter((wf: any) => wf.product_type === 'CL')
    const clTotal = clWorkflows.length
    const clCompleted = clWorkflows.filter(
      (wf: any) => mapClStepToStatus(wf.current_step) === 'recibido'
    ).length
    const clQuotationPending = clWorkflows.filter(
      (wf: any) => mapClStepToStatus(wf.current_step) === 'solicitar_cotizacion'
    ).length
    const clPaymentPending = clWorkflows.filter(
      (wf: any) => mapClStepToStatus(wf.current_step) === 'pagar_cotizacion'
    ).length
    const clShippingPending = clWorkflows.filter(
      (wf: any) => mapClStepToStatus(wf.current_step) === 'coordinar_envio_pagar_flete'
    ).length

    // IMP metrics from workflow_items
    const impWorkflows = workflowItems.filter((wf: any) => wf.product_type === 'IMP')
    const impTotal = impWorkflows.length
    const impCompleted = impWorkflows.filter(
      (wf: any) => mapImpStepToStatus(wf.current_step) === 'recibido'
    ).length
    const impPiPaymentPending = impWorkflows.filter(
      (wf: any) => mapImpStepToStatus(wf.current_step) === 'pagar_pi_proveedor'
    ).length
    const impShippingPending = impWorkflows.filter(
      (wf: any) => mapImpStepToStatus(wf.current_step) === 'enviar_etiqueta_envio'
    ).length
    const impCustomsPending = impWorkflows.filter(
      (wf: any) => mapImpStepToStatus(wf.current_step) === 'pagar_arancel_aduanas'
    ).length
    const impCoordinationPending = impWorkflows.filter(
      (wf: any) => mapImpStepToStatus(wf.current_step) === 'coordinar_envio'
    ).length

    const metrics = {
      lu: {
        total: luItems.length,
        selected: luCompleted, // kept for compatibility; UI uses only total
        percentage: luItems.length > 0 ? Math.round((luCompleted / luItems.length) * 100) : 0,
      },
      cl: {
        total: clTotal,
        quotationPending: clQuotationPending,
        paymentPending: clPaymentPending,
        shippingPending: clShippingPending,
        completed: clCompleted,
        percentage: clTotal > 0 ? Math.round((clCompleted / clTotal) * 100) : 0,
      },
      imp: {
        total: impTotal,
        piPaymentPending: impPiPaymentPending,
        shippingPending: impShippingPending,
        customsPending: impCustomsPending,
        coordinationPending: impCoordinationPending,
        completed: impCompleted,
        percentage: impTotal > 0 ? Math.round((impCompleted / impTotal) * 100) : 0,
      },
    }

    return NextResponse.json({
      success: true,
      data: metrics
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
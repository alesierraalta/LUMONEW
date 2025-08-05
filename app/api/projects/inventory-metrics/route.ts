import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get global inventory metrics across all projects
    const { data: projectItems, error } = await supabase
      .from('project_items')
      .select(`
        id,
        product_type,
        current_status,
        is_completed,
        quantity
      `)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, message: 'Error fetching inventory metrics' },
        { status: 500 }
      )
    }

    // Calculate metrics for each product type
    const luItems = projectItems?.filter(item => item.product_type === 'LU') || []
    const clItems = projectItems?.filter(item => item.product_type === 'CL') || []
    const impItems = projectItems?.filter(item => item.product_type === 'IMP') || []

    const metrics = {
      lu: {
        total: luItems.length,
        available: luItems.filter(item => item.current_status === 'seleccionar_inventario').length,
        selected: luItems.filter(item => item.current_status === 'inventario_seleccionado').length,
        percentage: luItems.length > 0 ? Math.round((luItems.filter(item => item.is_completed).length / luItems.length) * 100) : 0
      },
      cl: {
        total: clItems.length,
        quotationPending: clItems.filter(item => item.current_status === 'solicitar_cotizacion').length,
        paymentPending: clItems.filter(item => item.current_status === 'pagar_cotizacion').length,
        shippingPending: clItems.filter(item => item.current_status === 'coordinar_envio_pagar_flete').length,
        completed: clItems.filter(item => item.current_status === 'recibido').length,
        percentage: clItems.length > 0 ? Math.round((clItems.filter(item => item.is_completed).length / clItems.length) * 100) : 0
      },
      imp: {
        total: impItems.length,
        piPaymentPending: impItems.filter(item => item.current_status === 'pagar_pi_proveedor').length,
        shippingPending: impItems.filter(item => item.current_status === 'enviar_etiqueta_envio').length,
        customsPending: impItems.filter(item => item.current_status === 'pagar_arancel_aduanas').length,
        coordinationPending: impItems.filter(item => item.current_status === 'coordinar_envio').length,
        completed: impItems.filter(item => item.current_status === 'recibido').length,
        percentage: impItems.length > 0 ? Math.round((impItems.filter(item => item.is_completed).length / impItems.length) * 100) : 0
      }
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
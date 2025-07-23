import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters for date filtering
    const date_from = searchParams.get('date_from') || undefined
    const date_to = searchParams.get('date_to') || undefined

    const stats = await auditService.getAuditStats(date_from, date_to)

    if (!stats) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch audit statistics' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Audit stats API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
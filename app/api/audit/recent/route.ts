import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10

    const result = await auditService.getRecentActivity(limit)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Recent activity API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
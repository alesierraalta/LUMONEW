import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/lib/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const { userId } = params
    
    // Parse query parameters
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const result = await auditService.getUserActivity(userId, limit)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('User activity API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
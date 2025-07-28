import { NextRequest, NextResponse } from 'next/server'
import { projectAnalyticsService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const metrics = await projectAnalyticsService.getProjectMetrics()
    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    console.error('Error fetching project metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project metrics' },
      { status: 500 }
    )
  }
} 
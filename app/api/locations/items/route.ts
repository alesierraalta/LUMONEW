import { NextRequest, NextResponse } from 'next/server'
import { auditedLocationService } from '@/lib/database-with-audit'

export async function GET(request: NextRequest) {
  try {
    const locations = await auditedLocationService.getAll()
    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}
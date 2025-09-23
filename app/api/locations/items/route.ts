import { NextRequest, NextResponse } from 'next/server'
import { serverLocationService } from '@/lib/services/server-location-service'

export async function GET(request: NextRequest) {
  try {
    const locations = await serverLocationService.getAll()
    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}
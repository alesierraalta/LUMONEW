import { NextRequest, NextResponse } from 'next/server'
import { auditedLocationService } from '@/lib/database-with-audit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body
    
    if (!name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Location name is required' 
        },
        { status: 400 }
      )
    }

    // Get all locations
    const locations = await auditedLocationService.getAll()
    
    if (!locations || locations.length === 0) {
      return NextResponse.json({
        success: true,
        location: null
      })
    }

    // Search for exact match first
    let foundLocation = locations.find((loc: any) => 
      loc.name.toLowerCase() === name.toLowerCase()
    )

    // If no exact match, search for partial match
    if (!foundLocation) {
      foundLocation = locations.find((loc: any) => 
        loc.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(loc.name.toLowerCase())
      )
    }

    return NextResponse.json({
      success: true,
      location: foundLocation || null
    })

  } catch (error) {
    console.error('Locations search API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search locations',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
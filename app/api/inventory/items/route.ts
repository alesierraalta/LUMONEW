import { NextRequest, NextResponse } from 'next/server'
import { serverInventoryService } from '@/lib/services/server-inventory-service'
import { createCachedResponse, getCacheConfig } from '@/lib/cache/api-cache-manager'
import { PaginationHelper } from '@/lib/utils/pagination'
import { createClient } from '@/lib/supabase/server-with-retry'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Check if this is a "get all" request (limit >= 999999)
    const limit = parseInt(searchParams.get('limit') || '20')
    const isGetAllRequest = limit >= 999999
    
    if (isGetAllRequest) {
      // For "get all" requests, return a simple array without pagination
      const filters = {
        category: searchParams.get('category') || undefined,
        location: searchParams.get('location') || undefined,
        status: searchParams.get('status') || undefined,
        search: searchParams.get('search') || undefined,
        minQuantity: searchParams.get('minQuantity') ? parseInt(searchParams.get('minQuantity')!) : undefined,
        maxQuantity: searchParams.get('maxQuantity') ? parseInt(searchParams.get('maxQuantity')!) : undefined,
        lowStock: searchParams.get('lowStock') === 'true',
        outOfStock: searchParams.get('outOfStock') === 'true'
      }
      
      // Handle legacy withStock parameter
      const withStock = searchParams.get('withStock') === 'true'
      if (withStock) {
        filters.minQuantity = 1
      }
      
      // Get all inventory items without pagination
      const result = await serverInventoryService.getAll({ limit: 999999, page: 1 }, filters)
      
      // Return simple array response (backward compatible with old format)
      return createCachedResponse(
        request,
        result.data, // Return just the data array, not the pagination object
        'inventory',
        'list-all',
        {
          'X-Total-Count': result.pagination.total.toString(),
          'X-Response-Type': 'simple-array'
        }
      )
    }
    
    // For normal pagination requests, use the existing logic
    const paginationParams = PaginationHelper.parseParams(searchParams)
    
    // Parse filters
    const filters = {
      category: searchParams.get('category') || undefined,
      location: searchParams.get('location') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      minQuantity: searchParams.get('minQuantity') ? parseInt(searchParams.get('minQuantity')!) : undefined,
      maxQuantity: searchParams.get('maxQuantity') ? parseInt(searchParams.get('maxQuantity')!) : undefined,
      lowStock: searchParams.get('lowStock') === 'true',
      outOfStock: searchParams.get('outOfStock') === 'true'
    }
    
    // Handle legacy withStock parameter
    const withStock = searchParams.get('withStock') === 'true'
    if (withStock) {
      filters.minQuantity = 1
    }
    
    // Validate pagination parameters
    const validation = PaginationHelper.validateParams(paginationParams)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters', details: validation.errors },
        { status: 400 }
      )
    }
    
    // Get paginated inventory items with filters
    const result = await serverInventoryService.getAll(paginationParams, filters)
    
    // Generate pagination links
    const baseUrl = new URL(request.url).origin + new URL(request.url).pathname
    const links = PaginationHelper.generateLinks(baseUrl, result.pagination, {
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== undefined)),
      withStock: withStock.toString()
    })
    
    // Add pagination links to response
    const responseData = {
      ...result,
      links
    }
    
    // Return cached response with appropriate headers
    return createCachedResponse(
      request,
      responseData,
      'inventory',
      'list',
      {
        'X-Total-Count': result.pagination.total.toString(),
        'X-Page': result.pagination.page.toString(),
        'X-Per-Page': result.pagination.limit.toString(),
        'X-Total-Pages': result.pagination.totalPages.toString()
      }
    )
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch inventory items',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle both single item and bulk creation
    if (Array.isArray(body)) {
      // Bulk creation
      const items = body.map(item => ({
        sku: item.sku,
        name: item.name,
        category_id: item.category_id || item.categoryId,
        location_id: item.location_id || item.locationId,
        unit_price: parseFloat(item.unit_price || item.price || 0),
        quantity: parseInt(item.quantity || item.currentStock || 0),
        min_stock: parseInt(item.min_stock || item.minimumLevel || 0),
        max_stock: parseInt(item.max_stock || item.maximumLevel || item.quantity * 2 || 0),
        status: item.status || 'active',
        images: item.images || []
      }))
      
      // Validate required fields for each item
      const invalidItems = items.filter((item, index) => !item.sku || !item.name)
      if (invalidItems.length > 0) {
        return NextResponse.json(
          { 
            error: 'Some items are missing required fields (SKU and name)',
            invalidItems: invalidItems.length
          },
          { status: 400 }
        )
      }
      
      // Get authenticated user information
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.warn('Could not get authenticated user for audit:', authError)
      }

      const createdItems = await serverInventoryService.createMany(items, user)
      
      return NextResponse.json({
        success: true,
        created: createdItems.length,
        items: createdItems
      }, { status: 201 })
    } else {
      // Single item creation
      // Validate required fields
      if (!body.sku || !body.name) {
        return NextResponse.json(
          { 
            error: 'Missing required fields',
            required: ['sku', 'name'],
            received: Object.keys(body)
          },
          { status: 400 }
        )
      }
      
      // Get authenticated user information
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.warn('Could not get authenticated user for audit:', authError)
      }

      // Create single inventory item
      const newItem = await serverInventoryService.create({
        sku: body.sku,
        name: body.name,
        category_id: body.category_id || body.categoryId,
        location_id: body.location_id || body.locationId,
        unit_price: parseFloat(body.unit_price || body.price || 0),
        quantity: parseInt(body.quantity || body.currentStock || 0),
        min_stock: parseInt(body.min_stock || body.minimumLevel || 0),
        max_stock: parseInt(body.max_stock || body.maximumLevel || body.quantity * 2 || 0),
        status: body.status || 'active',
        images: body.images || []
      }, user) // Pass user context for audit
      
      return NextResponse.json({
        success: true,
        item: newItem
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating inventory item(s):', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { 
            error: 'SKU already exists',
            message: 'An item with this SKU already exists in the system'
          },
          { status: 409 }
        )
      }
      
      if (error.message.includes('foreign key')) {
        return NextResponse.json(
          { 
            error: 'Invalid category or location',
            message: 'The specified category or location does not exist'
          },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create inventory item(s)',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
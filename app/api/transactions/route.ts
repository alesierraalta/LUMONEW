import { NextRequest, NextResponse } from 'next/server'
import { transactionService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type') as 'sale' | 'stock_addition' | null
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let transactions

    if (startDate && endDate) {
      transactions = await transactionService.getByDateRange(
        new Date(startDate),
        new Date(endDate)
      )
    } else if (type) {
      transactions = await transactionService.getByType(type, limit)
    } else if (userId) {
      transactions = await transactionService.getByUser(userId, limit)
    } else {
      transactions = await transactionService.getAll(limit)
    }

    // Transform the data to match the frontend interface
    const transformedTransactions = transactions?.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      lineItems: transaction.transaction_items?.map((item: any) => ({
        id: item.id,
        product: {
          id: item.product_id,
          sku: item.product_sku,
          name: item.product_name,
          description: '', // Not stored in transaction items
          price: item.unit_price,
          cost: item.unit_price // Assuming cost equals price for now
        },
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        notes: item.notes
      })) || [],
      subtotal: transaction.subtotal,
      tax: transaction.tax,
      taxRate: transaction.tax_rate,
      total: transaction.total,
      notes: transaction.notes,
      createdAt: new Date(transaction.created_at),
      createdBy: transaction.created_by,
      status: transaction.status
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedTransactions
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transactions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.type || !body.lineItems || !Array.isArray(body.lineItems) || body.lineItems.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid transaction data',
          message: 'Transaction type and line items are required'
        },
        { status: 400 }
      )
    }

    // Transform frontend data to database format
    const transactionData = {
      type: body.type,
      subtotal: body.subtotal || 0,
      tax: body.tax || 0,
      tax_rate: body.taxRate || 0,
      total: body.total || 0,
      notes: body.notes,
      created_by: body.createdBy || 'system',
      status: body.status || 'completed',
      line_items: body.lineItems.map((item: any) => ({
        product_id: item.product?.id || item.productId,
        product_sku: item.product?.sku || item.productSku,
        product_name: item.product?.name || item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        notes: item.notes
      }))
    }

    const newTransaction = await transactionService.create(transactionData)

    // Transform back to frontend format
    const transformedTransaction = {
      id: newTransaction.id,
      type: newTransaction.type,
      lineItems: newTransaction.transaction_items?.map((item: any) => ({
        id: item.id,
        product: {
          id: item.product_id,
          sku: item.product_sku,
          name: item.product_name,
          description: '',
          price: item.unit_price,
          cost: item.unit_price
        },
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        notes: item.notes
      })) || [],
      subtotal: newTransaction.subtotal,
      tax: newTransaction.tax,
      taxRate: newTransaction.tax_rate,
      total: newTransaction.total,
      notes: newTransaction.notes,
      createdAt: new Date(newTransaction.created_at),
      createdBy: newTransaction.created_by,
      status: newTransaction.status
    }

    return NextResponse.json({
      success: true,
      data: transformedTransaction
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create transaction',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Reset all transaction history
    await transactionService.deleteAll()

    return NextResponse.json({
      success: true,
      message: 'Transaction history has been reset successfully'
    })
  } catch (error) {
    console.error('Error resetting transaction history:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset transaction history',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
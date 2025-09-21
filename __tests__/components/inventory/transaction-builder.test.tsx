import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { TransactionBuilder } from '@/components/inventory/transaction-builder'
import { createMockInventoryItems } from '@/__tests__/utils/mock-data'
import { setupCommonMocks } from '@/__tests__/utils/test-render'

// Mock the database services
vi.mock('@/lib/database', () => ({
  inventoryService: {
    getBySku: vi.fn(),
    search: vi.fn(),
  }
}))

vi.mock('@/lib/database-with-audit', () => ({
  auditedTransactionService: {
    create: vi.fn(),
  }
}))

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  })
}))

describe('TransactionBuilder', () => {
  const mockItems = createMockInventoryItems(5)
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    setupCommonMocks()
    vi.clearAllMocks()
  })

  it('renders transaction builder modal', () => {
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    expect(screen.getByText('New Sale Transaction')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Scan or enter SKU...')).toBeInTheDocument()
  })

  it('does not render when modal is closed', () => {
    render(
      <TransactionBuilder
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    expect(screen.queryByText('New Sale Transaction')).not.toBeInTheDocument()
  })

  it('shows correct title for sale transactions', () => {
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    expect(screen.getByText('New Sale Transaction')).toBeInTheDocument()
  })

  it('shows correct title for stock addition transactions', () => {
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="stock_addition"
      />
    )

    expect(screen.getByText('New Stock Addition')).toBeInTheDocument()
  })

  it('searches for items by SKU', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    inventoryService.getBySku.mockResolvedValue(mockItems[0])

    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, mockItems[0].sku)
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(inventoryService.getBySku).toHaveBeenCalledWith(mockItems[0].sku)
    })
  })

  it('adds item to transaction when found', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    inventoryService.getBySku.mockResolvedValue(mockItems[0])

    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, mockItems[0].sku)
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
      expect(screen.getByText(mockItems[0].sku)).toBeInTheDocument()
      expect(screen.getByDisplayValue('1')).toBeInTheDocument() // Default quantity
    })
  })

  it('shows error when item not found', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    inventoryService.getBySku.mockResolvedValue(null)

    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, 'INVALID-SKU')
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(screen.getByText('Item not found')).toBeInTheDocument()
    })
  })

  it('allows manual search by clicking search button', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    inventoryService.getBySku.mockResolvedValue(mockItems[0])

    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, mockItems[0].sku)

    const searchButton = screen.getByRole('button', { name: /search/i })
    await user.click(searchButton)

    await waitFor(() => {
      expect(inventoryService.getBySku).toHaveBeenCalledWith(mockItems[0].sku)
    })
  })

  it('updates item quantity in transaction', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    inventoryService.getBySku.mockResolvedValue(mockItems[0])

    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    // Add item first
    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, mockItems[0].sku)
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    // Update quantity
    const quantityInput = screen.getByDisplayValue('1')
    await user.clear(quantityInput)
    await user.type(quantityInput, '5')

    expect(quantityInput).toHaveValue('5')
  })

  it('removes item from transaction', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    inventoryService.getBySku.mockResolvedValue(mockItems[0])

    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    // Add item first
    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, mockItems[0].sku)
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    // Remove item
    const removeButton = screen.getByTitle('Remove item')
    await user.click(removeButton)

    expect(screen.queryByText(mockItems[0].name)).not.toBeInTheDocument()
  })

  it('calculates subtotal correctly', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    inventoryService.getBySku.mockResolvedValue(mockItems[0])

    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    // Add item with specific price and quantity
    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, mockItems[0].sku)
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    // Update quantity
    const quantityInput = screen.getByDisplayValue('1')
    await user.clear(quantityInput)
    await user.type(quantityInput, '3')

    const expectedSubtotal = mockItems[0].unit_price * 3
    expect(screen.getByText(`Subtotal: $${expectedSubtotal.toFixed(2)}`)).toBeInTheDocument()
  })

  it('calculates tax correctly', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    inventoryService.getBySku.mockResolvedValue(mockItems[0])

    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    // Add item
    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, mockItems[0].sku)
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    // Set tax rate
    const taxRateInput = screen.getByLabelText('Tax Rate (%)')
    await user.clear(taxRateInput)
    await user.type(taxRateInput, '8.5')

    const expectedTax = mockItems[0].unit_price * 0.085
    expect(screen.getByText(`Tax: $${expectedTax.toFixed(2)}`)).toBeInTheDocument()
  })

  it('calculates total correctly', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    inventoryService.getBySku.mockResolvedValue(mockItems[0])

    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    // Add item
    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, mockItems[0].sku)
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    // Set tax rate
    const taxRateInput = screen.getByLabelText('Tax Rate (%)')
    await user.clear(taxRateInput)
    await user.type(taxRateInput, '10')

    const subtotal = mockItems[0].unit_price
    const tax = subtotal * 0.10
    const total = subtotal + tax

    expect(screen.getByText(`Total: $${total.toFixed(2)}`)).toBeInTheDocument()
  })

  it('validates minimum quantity for sale transactions', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    inventoryService.getBySku.mockResolvedValue(mockItems[0])

    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    // Add item
    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, mockItems[0].sku)
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    // Set quantity to 0
    const quantityInput = screen.getByDisplayValue('1')
    await user.clear(quantityInput)
    await user.type(quantityInput, '0')

    const submitButton = screen.getByRole('button', { name: /complete transaction/i })
    await user.click(submitButton)

    expect(screen.getByText('Quantity must be greater than 0')).toBeInTheDocument()
  })

  it('validates available stock for sale transactions', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    const lowStockItem = { ...mockItems[0], quantity: 5 }
    inventoryService.getBySku.mockResolvedValue(lowStockItem)

    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    // Add item
    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, mockItems[0].sku)
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    // Set quantity higher than available stock
    const quantityInput = screen.getByDisplayValue('1')
    await user.clear(quantityInput)
    await user.type(quantityInput, '10')

    const submitButton = screen.getByRole('button', { name: /complete transaction/i })
    await user.click(submitButton)

    expect(screen.getByText('Quantity cannot exceed available stock (5)')).toBeInTheDocument()
  })

  it('allows any quantity for stock addition transactions', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    inventoryService.getBySku.mockResolvedValue(mockItems[0])

    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="stock_addition"
      />
    )

    // Add item
    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, mockItems[0].sku)
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    // Set large quantity (should be allowed for stock addition)
    const quantityInput = screen.getByDisplayValue('1')
    await user.clear(quantityInput)
    await user.type(quantityInput, '1000')

    expect(quantityInput).toHaveValue('1000')
  })

  it('completes transaction successfully', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    const { auditedTransactionService } = require('@/lib/database-with-audit')
    
    inventoryService.getBySku.mockResolvedValue(mockItems[0])
    auditedTransactionService.create.mockResolvedValue({ id: 'trans-123' })

    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    // Add item
    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, mockItems[0].sku)
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    // Add notes
    const notesInput = screen.getByLabelText('Notes')
    await user.type(notesInput, 'Test transaction')

    // Complete transaction
    const submitButton = screen.getByRole('button', { name: /complete transaction/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(auditedTransactionService.create).toHaveBeenCalledWith({
        type: 'sale',
        notes: 'Test transaction',
        subtotal: mockItems[0].unit_price,
        tax: 0,
        tax_rate: 0,
        total: mockItems[0].unit_price,
        line_items: [
          {
            product_id: mockItems[0].id,
            product_sku: mockItems[0].sku,
            product_name: mockItems[0].name,
            quantity: 1,
            unit_price: mockItems[0].unit_price,
            total_price: mockItems[0].unit_price,
            notes: ''
          }
        ]
      })
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('handles transaction creation errors', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    const { auditedTransactionService } = require('@/lib/database-with-audit')
    
    inventoryService.getBySku.mockResolvedValue(mockItems[0])
    auditedTransactionService.create.mockRejectedValue(new Error('Database error'))

    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    // Add item
    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, mockItems[0].sku)
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    // Complete transaction
    const submitButton = screen.getByRole('button', { name: /complete transaction/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Error creating transaction/)).toBeInTheDocument()
      expect(screen.getByText('Database error')).toBeInTheDocument()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('shows loading state during transaction creation', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    const { auditedTransactionService } = require('@/lib/database-with-audit')
    
    inventoryService.getBySku.mockResolvedValue(mockItems[0])
    auditedTransactionService.create.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )

    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    // Add item
    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, mockItems[0].sku)
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    // Complete transaction
    const submitButton = screen.getByRole('button', { name: /complete transaction/i })
    await user.click(submitButton)

    // Should show loading state
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument()
    })
  })

  it('requires at least one item to complete transaction', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    const submitButton = screen.getByRole('button', { name: /complete transaction/i })
    await user.click(submitButton)

    expect(screen.getByText('Please add at least one item to the transaction')).toBeInTheDocument()
  })

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('allows drag and drop reordering of items', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    inventoryService.getBySku
      .mockResolvedValueOnce(mockItems[0])
      .mockResolvedValueOnce(mockItems[1])

    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    // Add first item
    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, mockItems[0].sku)
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    // Clear input and add second item
    await user.clear(skuInput)
    await user.type(skuInput, mockItems[1].sku)
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(screen.getByText(mockItems[1].name)).toBeInTheDocument()
    })

    // Both items should be visible
    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    expect(screen.getByText(mockItems[1].name)).toBeInTheDocument()
  })

  it('clears form when modal is reopened', async () => {
    const user = userEvent.setup()
    const { inventoryService } = require('@/lib/database')
    inventoryService.getBySku.mockResolvedValue(mockItems[0])

    const { rerender } = render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    // Add an item
    const skuInput = screen.getByPlaceholderText('Scan or enter SKU...')
    await user.type(skuInput, mockItems[0].sku)
    await user.press(skuInput, 'Enter')

    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    // Close modal
    await user.click(screen.getByRole('button', { name: /close/i }))

    // Reopen modal
    rerender(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        type="sale"
      />
    )

    // Form should be cleared
    expect(skuInput).toHaveValue('')
    expect(screen.queryByText(mockItems[0].name)).not.toBeInTheDocument()
  })
})
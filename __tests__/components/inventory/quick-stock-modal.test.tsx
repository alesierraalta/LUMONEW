import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { QuickStockModal } from '@/components/inventory/quick-stock-modal'
import { createMockInventoryItems } from '@/__tests__/utils/mock-data'
import { setupCommonMocks } from '@/__tests__/utils/test-render'

// Mock the database service
vi.mock('@/lib/database-with-audit', () => ({
  auditedInventoryService: {
    update: vi.fn(),
  }
}))

describe('QuickStockModal', () => {
  const mockItem = createMockInventoryItems(1)[0]
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    setupCommonMocks()
    vi.clearAllMocks()
  })

  it('renders modal with item information', () => {
    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    expect(screen.getByText('Quick Stock Adjustment')).toBeInTheDocument()
    expect(screen.getByText(mockItem.name)).toBeInTheDocument()
    expect(screen.getByText(`Current Stock: ${mockItem.quantity}`)).toBeInTheDocument()
    expect(screen.getByText(`SKU: ${mockItem.sku}`)).toBeInTheDocument()
  })

  it('does not render when modal is closed', () => {
    render(
      <QuickStockModal
        isOpen={false}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    expect(screen.queryByText('Quick Stock Adjustment')).not.toBeInTheDocument()
  })

  it('shows add operation by default', () => {
    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    const addRadio = screen.getByLabelText('Add Stock')
    expect(addRadio).toBeChecked()
    
    const subtractRadio = screen.getByLabelText('Subtract Stock')
    expect(subtractRadio).not.toBeChecked()
  })

  it('shows subtract operation when specified', () => {
    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="subtract"
      />
    )

    const addRadio = screen.getByLabelText('Add Stock')
    expect(addRadio).not.toBeChecked()
    
    const subtractRadio = screen.getByLabelText('Subtract Stock')
    expect(subtractRadio).toBeChecked()
  })

  it('allows switching between add and subtract operations', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    const subtractRadio = screen.getByLabelText('Subtract Stock')
    await user.click(subtractRadio)

    expect(subtractRadio).toBeChecked()
    
    const addRadio = screen.getByLabelText('Add Stock')
    expect(addRadio).not.toBeChecked()
  })

  it('shows predefined reasons for stock changes', () => {
    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    expect(screen.getByLabelText('Purchase')).toBeInTheDocument()
    expect(screen.getByLabelText('Return')).toBeInTheDocument()
    expect(screen.getByLabelText('Adjustment')).toBeInTheDocument()
    expect(screen.getByLabelText('Sale')).toBeInTheDocument()
    expect(screen.getByLabelText('Damaged')).toBeInTheDocument()
    expect(screen.getByLabelText('Theft')).toBeInTheDocument()
    expect(screen.getByLabelText('Other')).toBeInTheDocument()
  })

  it('allows custom reason input', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    const otherRadio = screen.getByLabelText('Other')
    await user.click(otherRadio)

    const customReasonInput = screen.getByLabelText('Custom Reason')
    await user.type(customReasonInput, 'Custom adjustment reason')

    expect(customReasonInput).toHaveValue('Custom adjustment reason')
  })

  it('validates quantity input', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    const quantityInput = screen.getByLabelText('Quantity')
    
    // Try negative quantity
    await user.type(quantityInput, '-5')
    
    const submitButton = screen.getByRole('button', { name: /update stock/i })
    await user.click(submitButton)

    expect(screen.getByText('Quantity must be a positive number')).toBeInTheDocument()
  })

  it('validates that quantity is required', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    const submitButton = screen.getByRole('button', { name: /update stock/i })
    await user.click(submitButton)

    expect(screen.getByText('Quantity is required')).toBeInTheDocument()
  })

  it('validates that reason is required', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    const quantityInput = screen.getByLabelText('Quantity')
    await user.type(quantityInput, '10')

    const submitButton = screen.getByRole('button', { name: /update stock/i })
    await user.click(submitButton)

    expect(screen.getByText('Please select a reason for this adjustment')).toBeInTheDocument()
  })

  it('prevents negative stock when subtracting', async () => {
    const user = userEvent.setup()
    const itemWithLowStock = { ...mockItem, quantity: 5 }
    
    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={itemWithLowStock}
        onStockUpdated={mockOnSuccess}
        initialOperation="subtract"
      />
    )

    const subtractRadio = screen.getByLabelText('Subtract Stock')
    await user.click(subtractRadio)

    const quantityInput = screen.getByLabelText('Quantity')
    await user.type(quantityInput, '10') // More than current stock

    const purchaseReason = screen.getByLabelText('Purchase')
    await user.click(purchaseReason)

    const submitButton = screen.getByRole('button', { name: /update stock/i })
    await user.click(submitButton)

    expect(screen.getByText('Cannot subtract more stock than currently available')).toBeInTheDocument()
  })

  it('shows preview of stock change', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    const quantityInput = screen.getByLabelText('Quantity')
    await user.type(quantityInput, '25')

    const newStock = mockItem.quantity + 25
    expect(screen.getByText(`New Stock: ${newStock}`)).toBeInTheDocument()
  })

  it('shows preview for subtract operation', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="subtract"
      />
    )

    const subtractRadio = screen.getByLabelText('Subtract Stock')
    await user.click(subtractRadio)

    const quantityInput = screen.getByLabelText('Quantity')
    await user.type(quantityInput, '10')

    const newStock = mockItem.quantity - 10
    expect(screen.getByText(`New Stock: ${newStock}`)).toBeInTheDocument()
  })

  it('successfully updates stock', async () => {
    const user = userEvent.setup()
    const { auditedInventoryService } = require('@/lib/database-with-audit')
    auditedInventoryService.update.mockResolvedValue({})

    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    const quantityInput = screen.getByLabelText('Quantity')
    await user.type(quantityInput, '10')

    const purchaseReason = screen.getByLabelText('Purchase')
    await user.click(purchaseReason)

    const submitButton = screen.getByRole('button', { name: /update stock/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(auditedInventoryService.update).toHaveBeenCalledWith(mockItem.id, {
        quantity: mockItem.quantity + 10
      })
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('successfully subtracts stock', async () => {
    const user = userEvent.setup()
    const { auditedInventoryService } = require('@/lib/database-with-audit')
    auditedInventoryService.update.mockResolvedValue({})

    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="subtract"
      />
    )

    const subtractRadio = screen.getByLabelText('Subtract Stock')
    await user.click(subtractRadio)

    const quantityInput = screen.getByLabelText('Quantity')
    await user.type(quantityInput, '5')

    const saleReason = screen.getByLabelText('Sale')
    await user.click(saleReason)

    const submitButton = screen.getByRole('button', { name: /update stock/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(auditedInventoryService.update).toHaveBeenCalledWith(mockItem.id, {
        quantity: mockItem.quantity - 5
      })
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('handles update errors gracefully', async () => {
    const user = userEvent.setup()
    const { auditedInventoryService } = require('@/lib/database-with-audit')
    auditedInventoryService.update.mockRejectedValue(new Error('Database error'))

    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    const quantityInput = screen.getByLabelText('Quantity')
    await user.type(quantityInput, '10')

    const purchaseReason = screen.getByLabelText('Purchase')
    await user.click(purchaseReason)

    const submitButton = screen.getByRole('button', { name: /update stock/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Error updating stock/)).toBeInTheDocument()
      expect(screen.getByText('Database error')).toBeInTheDocument()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('shows loading state during update', async () => {
    const user = userEvent.setup()
    const { auditedInventoryService } = require('@/lib/database-with-audit')
    
    // Make the update take some time
    auditedInventoryService.update.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )

    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    const quantityInput = screen.getByLabelText('Quantity')
    await user.type(quantityInput, '10')

    const purchaseReason = screen.getByLabelText('Purchase')
    await user.click(purchaseReason)

    const submitButton = screen.getByRole('button', { name: /update stock/i })
    await user.click(submitButton)

    // Should show loading state
    expect(screen.getByText('Updating...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.queryByText('Updating...')).not.toBeInTheDocument()
    })
  })

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('resets form when modal is reopened', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    // Fill some data
    const quantityInput = screen.getByLabelText('Quantity')
    await user.type(quantityInput, '10')

    const purchaseReason = screen.getByLabelText('Purchase')
    await user.click(purchaseReason)

    // Close modal
    await user.click(screen.getByRole('button', { name: /close/i }))

    // Reopen modal
    rerender(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    // Form should be reset
    expect(quantityInput).toHaveValue('')
    expect(purchaseReason).not.toBeChecked()
  })

  it('shows stock warnings for low stock items', () => {
    const lowStockItem = { ...mockItem, quantity: 2, min_stock: 10 }
    
    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={lowStockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    expect(screen.getByText('⚠️ Low Stock Warning')).toBeInTheDocument()
    expect(screen.getByText(/Current stock \(2\) is below minimum level \(10\)/)).toBeInTheDocument()
  })

  it('shows out of stock warning for zero stock items', () => {
    const outOfStockItem = { ...mockItem, quantity: 0, min_stock: 5 }
    
    render(
      <QuickStockModal
        isOpen={true}
        onClose={mockOnClose}
        item={outOfStockItem}
        onStockUpdated={mockOnSuccess}
        initialOperation="add"
      />
    )

    expect(screen.getByText('🚨 Out of Stock')).toBeInTheDocument()
    expect(screen.getByText(/This item is currently out of stock/)).toBeInTheDocument()
  })
})
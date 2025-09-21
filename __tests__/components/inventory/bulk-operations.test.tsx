import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { BulkOperations } from '@/components/inventory/bulk-operations'
import { createMockInventoryItems } from '@/__tests__/utils/mock-data'
import { setupCommonMocks } from '@/__tests__/utils/test-render'

// Mock the database service
vi.mock('@/lib/database-with-audit', () => ({
  auditedInventoryService: {
    update: vi.fn(),
    delete: vi.fn(),
    createMany: vi.fn(),
  }
}))

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  })
}))

describe('BulkOperations', () => {
  const mockItems = createMockInventoryItems(5)
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    setupCommonMocks()
    vi.clearAllMocks()
  })

  it('renders bulk operations modal with selected items', () => {
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems.slice(0, 3)}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByText('Bulk Operations')).toBeInTheDocument()
    expect(screen.getByText('3 items selected')).toBeInTheDocument()
    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    expect(screen.getByText(mockItems[1].name)).toBeInTheDocument()
    expect(screen.getByText(mockItems[2].name)).toBeInTheDocument()
  })

  it('does not render when modal is closed', () => {
    render(
      <BulkOperations
        isOpen={false}
        onClose={mockOnClose}
        selectedItems={mockItems}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.queryByText('Bulk Operations')).not.toBeInTheDocument()
  })

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems}
        onSuccess={mockOnSuccess}
      />
    )

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows update price operation', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems}
        onSuccess={mockOnSuccess}
      />
    )

    const updatePriceButton = screen.getByText('Update Prices')
    await user.click(updatePriceButton)

    expect(screen.getByText('Update Prices')).toBeInTheDocument()
    expect(screen.getByLabelText('Price Update Type')).toBeInTheDocument()
  })

  it('shows change category operation', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems}
        onSuccess={mockOnSuccess}
      />
    )

    const changeCategoryButton = screen.getByText('Change Category')
    await user.click(changeCategoryButton)

    expect(screen.getByText('Change Category')).toBeInTheDocument()
    expect(screen.getByLabelText('New Category')).toBeInTheDocument()
  })

  it('shows change location operation', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems}
        onSuccess={mockOnSuccess}
      />
    )

    const changeLocationButton = screen.getByText('Change Location')
    await user.click(changeLocationButton)

    expect(screen.getByText('Change Location')).toBeInTheDocument()
    expect(screen.getByLabelText('New Location')).toBeInTheDocument()
  })

  it('shows change status operation', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems}
        onSuccess={mockOnSuccess}
      />
    )

    const changeStatusButton = screen.getByText('Change Status')
    await user.click(changeStatusButton)

    expect(screen.getByText('Change Status')).toBeInTheDocument()
    expect(screen.getByLabelText('New Status')).toBeInTheDocument()
  })

  it('shows delete operation with confirmation', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems}
        onSuccess={mockOnSuccess}
      />
    )

    const deleteButton = screen.getByText('Delete Items')
    await user.click(deleteButton)

    expect(screen.getByText('Delete Items')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
    expect(screen.getByText(`${mockItems.length} items`)).toBeInTheDocument()
  })

  it('performs fixed price update operation', async () => {
    const user = userEvent.setup()
    const { auditedInventoryService } = require('@/lib/database-with-audit')
    auditedInventoryService.update.mockResolvedValue({})

    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems.slice(0, 2)}
        onSuccess={mockOnSuccess}
      />
    )

    // Select update prices operation
    await user.click(screen.getByText('Update Prices'))
    
    // Select fixed price update
    const priceTypeSelect = screen.getByLabelText('Price Update Type')
    await user.selectOptions(priceTypeSelect, 'fixed')

    // Enter new price
    const priceInput = screen.getByLabelText('New Price')
    await user.type(priceInput, '29.99')

    // Submit the operation
    const submitButton = screen.getByRole('button', { name: /apply/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(auditedInventoryService.update).toHaveBeenCalledTimes(2)
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('performs percentage price update operation', async () => {
    const user = userEvent.setup()
    const { auditedInventoryService } = require('@/lib/database-with-audit')
    auditedInventoryService.update.mockResolvedValue({})

    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems.slice(0, 2)}
        onSuccess={mockOnSuccess}
      />
    )

    // Select update prices operation
    await user.click(screen.getByText('Update Prices'))
    
    // Select percentage price update
    const priceTypeSelect = screen.getByLabelText('Price Update Type')
    await user.selectOptions(priceTypeSelect, 'percentage')

    // Enter percentage
    const percentageInput = screen.getByLabelText('Price Change (%)')
    await user.type(percentageInput, '10')

    // Submit the operation
    const submitButton = screen.getByRole('button', { name: /apply/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(auditedInventoryService.update).toHaveBeenCalledTimes(2)
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('performs category change operation', async () => {
    const user = userEvent.setup()
    const { auditedInventoryService } = require('@/lib/database-with-audit')
    auditedInventoryService.update.mockResolvedValue({})

    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems.slice(0, 2)}
        onSuccess={mockOnSuccess}
      />
    )

    // Select change category operation
    await user.click(screen.getByText('Change Category'))
    
    // Select new category
    const categorySelect = screen.getByLabelText('New Category')
    await user.selectOptions(categorySelect, 'cat-2')

    // Submit the operation
    const submitButton = screen.getByRole('button', { name: /apply/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(auditedInventoryService.update).toHaveBeenCalledTimes(2)
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('performs location change operation', async () => {
    const user = userEvent.setup()
    const { auditedInventoryService } = require('@/lib/database-with-audit')
    auditedInventoryService.update.mockResolvedValue({})

    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems.slice(0, 2)}
        onSuccess={mockOnSuccess}
      />
    )

    // Select change location operation
    await user.click(screen.getByText('Change Location'))
    
    // Select new location
    const locationSelect = screen.getByLabelText('New Location')
    await user.selectOptions(locationSelect, 'loc-2')

    // Submit the operation
    const submitButton = screen.getByRole('button', { name: /apply/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(auditedInventoryService.update).toHaveBeenCalledTimes(2)
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('performs status change operation', async () => {
    const user = userEvent.setup()
    const { auditedInventoryService } = require('@/lib/database-with-audit')
    auditedInventoryService.update.mockResolvedValue({})

    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems.slice(0, 2)}
        onSuccess={mockOnSuccess}
      />
    )

    // Select change status operation
    await user.click(screen.getByText('Change Status'))
    
    // Select new status
    const statusSelect = screen.getByLabelText('New Status')
    await user.selectOptions(statusSelect, 'inactive')

    // Submit the operation
    const submitButton = screen.getByRole('button', { name: /apply/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(auditedInventoryService.update).toHaveBeenCalledTimes(2)
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('performs delete operation with confirmation', async () => {
    const user = userEvent.setup()
    const { auditedInventoryService } = require('@/lib/database-with-audit')
    auditedInventoryService.delete.mockResolvedValue({})

    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems.slice(0, 2)}
        onSuccess={mockOnSuccess}
      />
    )

    // Select delete operation
    await user.click(screen.getByText('Delete Items'))
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /delete/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(auditedInventoryService.delete).toHaveBeenCalledTimes(2)
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('cancels delete operation when cancel is clicked', async () => {
    const user = userEvent.setup()
    const { auditedInventoryService } = require('@/lib/database-with-audit')

    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems.slice(0, 2)}
        onSuccess={mockOnSuccess}
      />
    )

    // Select delete operation
    await user.click(screen.getByText('Delete Items'))
    
    // Cancel deletion
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(auditedInventoryService.delete).not.toHaveBeenCalled()
    expect(screen.getByText('Bulk Operations')).toBeInTheDocument() // Back to main view
  })

  it('shows loading state during operation', async () => {
    const user = userEvent.setup()
    const { auditedInventoryService } = require('@/lib/database-with-audit')
    
    // Make the update take some time
    auditedInventoryService.update.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )

    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems.slice(0, 1)}
        onSuccess={mockOnSuccess}
      />
    )

    // Start an operation
    await user.click(screen.getByText('Update Prices'))
    await user.selectOptions(screen.getByLabelText('Price Update Type'), 'fixed')
    await user.type(screen.getByLabelText('New Price'), '25.00')
    
    const submitButton = screen.getByRole('button', { name: /apply/i })
    await user.click(submitButton)

    // Should show loading state
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument()
    })
  })

  it('handles operation errors gracefully', async () => {
    const user = userEvent.setup()
    const { auditedInventoryService } = require('@/lib/database-with-audit')
    auditedInventoryService.update.mockRejectedValue(new Error('Database error'))

    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems.slice(0, 1)}
        onSuccess={mockOnSuccess}
      />
    )

    // Start an operation
    await user.click(screen.getByText('Update Prices'))
    await user.selectOptions(screen.getByLabelText('Price Update Type'), 'fixed')
    await user.type(screen.getByLabelText('New Price'), '25.00')
    
    const submitButton = screen.getByRole('button', { name: /apply/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Error occurred/)).toBeInTheDocument()
      expect(screen.getByText('Database error')).toBeInTheDocument()
    })
  })

  it('validates required fields before submission', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems.slice(0, 1)}
        onSuccess={mockOnSuccess}
      />
    )

    // Start update prices operation
    await user.click(screen.getByText('Update Prices'))
    
    // Try to submit without entering price
    const submitButton = screen.getByRole('button', { name: /apply/i })
    await user.click(submitButton)

    expect(screen.getByText('Price is required')).toBeInTheDocument()
  })

  it('validates numeric inputs', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems.slice(0, 1)}
        onSuccess={mockOnSuccess}
      />
    )

    // Start update prices operation
    await user.click(screen.getByText('Update Prices'))
    await user.selectOptions(screen.getByLabelText('Price Update Type'), 'fixed')
    
    // Enter invalid price
    const priceInput = screen.getByLabelText('New Price')
    await user.type(priceInput, 'invalid')
    
    const submitButton = screen.getByRole('button', { name: /apply/i })
    await user.click(submitButton)

    expect(screen.getByText('Price must be a valid number')).toBeInTheDocument()
  })

  it('shows operation summary before execution', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems.slice(0, 3)}
        onSuccess={mockOnSuccess}
      />
    )

    // Start an operation
    await user.click(screen.getByText('Update Prices'))
    await user.selectOptions(screen.getByLabelText('Price Update Type'), 'fixed')
    await user.type(screen.getByLabelText('New Price'), '25.00')

    // Should show summary
    expect(screen.getByText(/will update 3 items/)).toBeInTheDocument()
    expect(screen.getByText(/Set price to \$25.00/)).toBeInTheDocument()
  })

  it('allows operation cancellation', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={mockItems.slice(0, 1)}
        onSuccess={mockOnSuccess}
      />
    )

    // Start an operation
    await user.click(screen.getByText('Update Prices'))
    
    // Cancel the operation
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    // Should return to main operations view
    expect(screen.getByText('Bulk Operations')).toBeInTheDocument()
    expect(screen.getByText('Update Prices')).toBeInTheDocument()
  })
})
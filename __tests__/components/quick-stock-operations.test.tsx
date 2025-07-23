import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { QuickStockOperations } from '@/components/inventory/quick-stock-operations'
import { setupCommonMocks } from '@/__tests__/utils/test-render'
import { createMockInventoryItems } from '@/__tests__/utils/mock-data'

describe('QuickStockOperations', () => {
  const mockOnClose = vi.fn()
  const mockOnStockUpdate = vi.fn()
  const mockItem = createMockInventoryItems(1)[0]

  beforeEach(() => {
    setupCommonMocks()
    vi.clearAllMocks()
  })

  it('renders modal with item information', () => {
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    expect(screen.getByText('Ajuste Rápido de Stock')).toBeInTheDocument()
    expect(screen.getByText(mockItem.name)).toBeInTheDocument()
    expect(screen.getByText(`Stock Actual:`)).toBeInTheDocument()
    expect(screen.getByText(mockItem.currentStock.toString())).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(
      <QuickStockOperations
        isOpen={false}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    expect(screen.queryByText('Ajuste Rápido de Stock')).not.toBeInTheDocument()
  })

  it('renders add and subtract operation buttons', () => {
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    expect(screen.getByText('Sumar Stock')).toBeInTheDocument()
    expect(screen.getByText('Restar Stock')).toBeInTheDocument()
  })

  it('shows add stock form by default', () => {
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    expect(screen.getByText('Cantidad a sumar')).toBeInTheDocument()
    expect(screen.getByText('Razón del ajuste *')).toBeInTheDocument()
  })

  it('switches to subtract stock form when Restar Stock is clicked', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    const subtractButton = screen.getByText('Restar Stock')
    await user.click(subtractButton)
    
    expect(screen.getByText('Cantidad a restar')).toBeInTheDocument()
    expect(screen.getByText(`Máximo disponible: ${mockItem.currentStock}`)).toBeInTheDocument()
  })

  it('closes modal when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    const cancelButton = screen.getByText('Cancelar')
    await user.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('validates quantity input for add operation', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    // Clear the quantity input (default is 1)
    const quantityInput = screen.getByLabelText('Cantidad a sumar')
    await user.clear(quantityInput)
    await user.type(quantityInput, '0')
    
    // Try to submit
    const submitButton = screen.getByRole('button', { name: /sumar stock/i })
    await user.click(submitButton)
    
    expect(screen.getByText('La cantidad debe ser mayor a 0')).toBeInTheDocument()
  })

  it('validates reason input', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    // Try to submit without reason
    const submitButton = screen.getByRole('button', { name: /sumar stock/i })
    await user.click(submitButton)
    
    expect(screen.getByText('Debe proporcionar una razón para el ajuste')).toBeInTheDocument()
  })

  it('prevents subtracting more than available stock', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    const subtractButton = screen.getByText('Restar Stock')
    await user.click(subtractButton)
    
    // Try to subtract more than available
    const quantityInput = screen.getByLabelText('Cantidad a restar')
    await user.clear(quantityInput)
    await user.type(quantityInput, (mockItem.currentStock + 10).toString())
    
    const reasonInput = screen.getByLabelText('Razón del ajuste *')
    await user.type(reasonInput, 'Test reason')
    
    const submitButton = screen.getByRole('button', { name: /restar stock/i })
    await user.click(submitButton)
    
    expect(screen.getByText(`No se puede restar ${mockItem.currentStock + 10}. Stock disponible: ${mockItem.currentStock}`)).toBeInTheDocument()
  })

  it('shows projected stock preview for add operation', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    const quantityInput = screen.getByLabelText('Cantidad a sumar')
    await user.clear(quantityInput)
    await user.type(quantityInput, '5')
    
    const projectedStock = mockItem.currentStock + 5
    expect(screen.getByText('Vista Previa del Cambio')).toBeInTheDocument()
    expect(screen.getByText('Stock después del ajuste:')).toBeInTheDocument()
    expect(screen.getByText(projectedStock.toString())).toBeInTheDocument()
  })

  it('shows projected stock preview for subtract operation', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    const subtractButton = screen.getByText('Restar Stock')
    await user.click(subtractButton)
    
    const quantityInput = screen.getByLabelText('Cantidad a restar')
    await user.clear(quantityInput)
    await user.type(quantityInput, '3')
    
    const projectedStock = mockItem.currentStock - 3
    expect(screen.getByText('Vista Previa del Cambio')).toBeInTheDocument()
    expect(screen.getByText(projectedStock.toString())).toBeInTheDocument()
  })

  it('submits add stock operation successfully', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    // Fill form
    const quantityInput = screen.getByLabelText('Cantidad a sumar')
    await user.clear(quantityInput)
    await user.type(quantityInput, '5')
    
    const reasonInput = screen.getByLabelText('Razón del ajuste *')
    await user.type(reasonInput, 'Recepción de mercancía')
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /sumar stock/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnStockUpdate).toHaveBeenCalledWith(
        mockItem.id,
        mockItem.currentStock + 5,
        expect.objectContaining({
          operation: 'add',
          quantity: 5,
          previousStock: mockItem.currentStock,
          newStock: mockItem.currentStock + 5
        })
      )
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('submits subtract stock operation successfully', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    const subtractButton = screen.getByText('Restar Stock')
    await user.click(subtractButton)
    
    // Fill form
    const quantityInput = screen.getByLabelText('Cantidad a restar')
    await user.clear(quantityInput)
    await user.type(quantityInput, '3')
    
    const reasonInput = screen.getByLabelText('Razón del ajuste *')
    await user.type(reasonInput, 'Venta directa')
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /restar stock/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnStockUpdate).toHaveBeenCalledWith(
        mockItem.id,
        mockItem.currentStock - 3,
        expect.objectContaining({
          operation: 'subtract',
          quantity: 3,
          previousStock: mockItem.currentStock,
          newStock: mockItem.currentStock - 3
        })
      )
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('shows loading state during operation', async () => {
    const user = userEvent.setup()
    
    // Mock delayed onStockUpdate
    const delayedOnStockUpdate = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )
    
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={delayedOnStockUpdate}
      />
    )
    
    // Fill form
    const quantityInput = screen.getByLabelText('Cantidad a sumar')
    await user.clear(quantityInput)
    await user.type(quantityInput, '5')
    
    const reasonInput = screen.getByLabelText('Razón del ajuste *')
    await user.type(reasonInput, 'Test reason')
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /sumar stock/i })
    await user.click(submitButton)
    
    // Should show loading state
    expect(screen.getByText('Procesando...')).toBeInTheDocument()
  })

  it('allows adding notes to the operation', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    const notesTextarea = screen.getByLabelText('Notas adicionales (opcional)')
    await user.type(notesTextarea, 'Test notes for stock adjustment')
    
    expect(notesTextarea).toHaveValue('Test notes for stock adjustment')
  })

  it('resets form when switching between operations', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    // Fill add form
    const quantityInput = screen.getByLabelText('Cantidad a sumar')
    await user.clear(quantityInput)
    await user.type(quantityInput, '5')
    
    const reasonInput = screen.getByLabelText('Razón del ajuste *')
    await user.type(reasonInput, 'Test reason')
    
    // Switch to subtract
    const subtractButton = screen.getByText('Restar Stock')
    await user.click(subtractButton)
    
    // Form should be reset
    const resetQuantityInput = screen.getByLabelText('Cantidad a restar')
    expect(resetQuantityInput).toHaveValue(1) // Default value
    
    const resetReasonInput = screen.getByLabelText('Razón del ajuste *')
    expect(resetReasonInput).toHaveValue('')
  })

  it('shows current stock information', () => {
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    expect(screen.getByText('Stock Actual:')).toBeInTheDocument()
    expect(screen.getByText(`Nivel Mínimo: ${mockItem.minimumLevel}`)).toBeInTheDocument()
    expect(screen.getByText(/Precio:/)).toBeInTheDocument()
  })

  it('shows warning when projected stock will be low', async () => {
    const user = userEvent.setup()
    
    // Create item with stock close to minimum
    const lowStockItem = {
      ...mockItem,
      currentStock: 5,
      minimumLevel: 10
    }
    
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={lowStockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    const subtractButton = screen.getByText('Restar Stock')
    await user.click(subtractButton)
    
    const quantityInput = screen.getByLabelText('Cantidad a restar')
    await user.clear(quantityInput)
    await user.type(quantityInput, '2')
    
    expect(screen.getByText('⚠️ El stock resultante estará por debajo del nivel mínimo')).toBeInTheDocument()
  })

  it('shows warning when stock will be zero', async () => {
    const user = userEvent.setup()
    
    // Create item with low stock
    const lowStockItem = {
      ...mockItem,
      currentStock: 3
    }
    
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={lowStockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    const subtractButton = screen.getByText('Restar Stock')
    await user.click(subtractButton)
    
    const quantityInput = screen.getByLabelText('Cantidad a restar')
    await user.clear(quantityInput)
    await user.type(quantityInput, '3')
    
    expect(screen.getByText('⚠️ El producto quedará agotado')).toBeInTheDocument()
  })

  it('disables submit button during processing', async () => {
    const user = userEvent.setup()
    
    // Mock delayed onStockUpdate
    const delayedOnStockUpdate = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )
    
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={delayedOnStockUpdate}
      />
    )
    
    // Fill form
    const quantityInput = screen.getByLabelText('Cantidad a sumar')
    await user.clear(quantityInput)
    await user.type(quantityInput, '5')
    
    const reasonInput = screen.getByLabelText('Razón del ajuste *')
    await user.type(reasonInput, 'Test reason')
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /sumar stock/i })
    await user.click(submitButton)
    
    // Button should be disabled during processing
    expect(submitButton).toBeDisabled()
  })

  it('shows correct button styling for add operation', () => {
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    const addButton = screen.getByText('Sumar Stock').closest('button')
    expect(addButton).toHaveClass('bg-primary') // Default variant when selected
  })

  it('shows correct button styling for subtract operation', async () => {
    const user = userEvent.setup()
    render(
      <QuickStockOperations
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        onStockUpdate={mockOnStockUpdate}
      />
    )
    
    const subtractButton = screen.getByText('Restar Stock')
    await user.click(subtractButton)
    
    const subtractButtonElement = subtractButton.closest('button')
    expect(subtractButtonElement).toHaveClass('bg-primary') // Default variant when selected
  })
})
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { BulkOperations } from '@/components/inventory/bulk-operations'
import { setupCommonMocks } from '@/__tests__/utils/test-render'
import { createMockInventoryItems, createMockCategories, createMockLocations } from '@/__tests__/utils/mock-data'

describe('BulkOperations', () => {
  const mockOnClose = vi.fn()
  const mockOnBulkOperation = vi.fn()
  const selectedItems = createMockInventoryItems(2)
  const mockCategories = createMockCategories(3)
  const mockLocations = createMockLocations(3)

  beforeEach(() => {
    setupCommonMocks()
    vi.clearAllMocks()
  })

  it('renders modal with title and selected items count', () => {
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    expect(screen.getByText('Operaciones Masivas')).toBeInTheDocument()
    expect(screen.getByText('Realizar operaciones en 2 elementos seleccionados')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(
      <BulkOperations
        isOpen={false}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    expect(screen.queryByText('Operaciones Masivas')).not.toBeInTheDocument()
  })

  it('renders all operation buttons', () => {
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    expect(screen.getByText('Actualizar')).toBeInTheDocument()
    expect(screen.getByText('Eliminar')).toBeInTheDocument()
    expect(screen.getByText('Archivar')).toBeInTheDocument()
  })

  it('shows update form when Actualizar is clicked', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    const updateButton = screen.getByText('Actualizar')
    await user.click(updateButton)
    
    expect(screen.getByText('Tipo de Actualización')).toBeInTheDocument()
    expect(screen.getByText('Razón de la Operación *')).toBeInTheDocument()
  })

  it('shows delete form when Eliminar is clicked', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    const deleteButton = screen.getByText('Eliminar')
    await user.click(deleteButton)
    
    expect(screen.getByText('Advertencia: Eliminación Permanente')).toBeInTheDocument()
    expect(screen.getByText('Razón de la Eliminación *')).toBeInTheDocument()
    expect(screen.getByText('Confirmo que deseo eliminar permanentemente estos elementos')).toBeInTheDocument()
  })

  it('shows archive form when Archivar is clicked', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    const archiveButton = screen.getByText('Archivar')
    await user.click(archiveButton)
    
    expect(screen.getByText('Archivar Elementos')).toBeInTheDocument()
    expect(screen.getByText('Razón del Archivado *')).toBeInTheDocument()
  })

  it('closes modal when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    const cancelButton = screen.getByText('Cancelar')
    await user.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('displays selected items summary', () => {
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    expect(screen.getByText('Elementos Seleccionados (2)')).toBeInTheDocument()
    expect(screen.getByText('Valor Total:')).toBeInTheDocument()
    expect(screen.getByText('Stock Total:')).toBeInTheDocument()
  })

  it('shows price update fields when price_update is selected', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    // Click Actualizar to show update form
    const updateButton = screen.getByText('Actualizar')
    await user.click(updateButton)
    
    // Select price update option
    const typeSelect = screen.getByRole('combobox')
    await user.click(typeSelect)
    
    const priceUpdateOption = screen.getByText('Actualizar Precios')
    await user.click(priceUpdateOption)
    
    await waitFor(() => {
      expect(screen.getByText('Tipo de Ajuste')).toBeInTheDocument()
      expect(screen.getByText('Aplicar a')).toBeInTheDocument()
    })
  })

  it('shows category change fields when category_change is selected', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    // Click Actualizar to show update form
    const updateButton = screen.getByText('Actualizar')
    await user.click(updateButton)
    
    // Select category change option
    const typeSelect = screen.getByRole('combobox')
    await user.click(typeSelect)
    
    const categoryChangeOption = screen.getByText('Cambiar Categoría')
    await user.click(categoryChangeOption)
    
    await waitFor(() => {
      expect(screen.getByText('Nueva Categoría')).toBeInTheDocument()
    })
  })

  it('shows status change fields when status_change is selected', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    // Click Actualizar to show update form
    const updateButton = screen.getByText('Actualizar')
    await user.click(updateButton)
    
    // Select status change option
    const typeSelect = screen.getByRole('combobox')
    await user.click(typeSelect)
    
    const statusChangeOption = screen.getByText('Cambiar Estado')
    await user.click(statusChangeOption)
    
    await waitFor(() => {
      expect(screen.getByText('Nuevo Estado')).toBeInTheDocument()
    })
  })

  it('shows location transfer fields when location_transfer is selected', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    // Click Actualizar to show update form
    const updateButton = screen.getByText('Actualizar')
    await user.click(updateButton)
    
    // Select location transfer option
    const typeSelect = screen.getByRole('combobox')
    await user.click(typeSelect)
    
    const locationTransferOption = screen.getByText('Transferir Ubicación')
    await user.click(locationTransferOption)
    
    await waitFor(() => {
      expect(screen.getByText('Nueva Ubicación')).toBeInTheDocument()
    })
  })

  it('calls onBulkOperation when update form is submitted', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    // Click Actualizar to show update form
    const updateButton = screen.getByText('Actualizar')
    await user.click(updateButton)
    
    // Fill required reason field
    const reasonInput = screen.getByPlaceholderText(/Actualización de precios por inflación/i)
    await user.type(reasonInput, 'Test reason')
    
    // Submit form
    const submitButton = screen.getByText('Actualizar Elementos')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnBulkOperation).toHaveBeenCalled()
    })
  })

  it('requires confirmation checkbox for delete operation', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    // Click Eliminar to show delete form
    const deleteButton = screen.getByText('Eliminar')
    await user.click(deleteButton)
    
    // Submit button should be disabled initially
    const submitButton = screen.getByText('Eliminar Elementos')
    expect(submitButton).toBeDisabled()
    
    // Fill reason field
    const reasonInput = screen.getByPlaceholderText(/Productos obsoletos/i)
    await user.type(reasonInput, 'Test delete reason')
    
    // Submit button should still be disabled without confirmation
    expect(submitButton).toBeDisabled()
    
    // Check confirmation checkbox
    const confirmCheckbox = screen.getByRole('checkbox')
    await user.click(confirmCheckbox)
    
    // Now submit button should be enabled
    expect(submitButton).not.toBeDisabled()
  })

  it('shows progress bar during operation processing', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    // Click Actualizar to show update form
    const updateButton = screen.getByText('Actualizar')
    await user.click(updateButton)
    
    // Fill required reason field
    const reasonInput = screen.getByPlaceholderText(/Actualización de precios por inflación/i)
    await user.type(reasonInput, 'Test reason')
    
    // Submit form
    const submitButton = screen.getByText('Actualizar Elementos')
    await user.click(submitButton)
    
    // Should show processing state
    await waitFor(() => {
      expect(screen.getByText('Procesando operación...')).toBeInTheDocument()
    })
  })

  it('shows success message after operation completion', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    // Click Actualizar to show update form
    const updateButton = screen.getByText('Actualizar')
    await user.click(updateButton)
    
    // Fill required reason field
    const reasonInput = screen.getByPlaceholderText(/Actualización de precios por inflación/i)
    await user.type(reasonInput, 'Test reason')
    
    // Submit form
    const submitButton = screen.getByText('Actualizar Elementos')
    await user.click(submitButton)
    
    // Should eventually show success message
    await waitFor(() => {
      expect(screen.getByText('Operación completada exitosamente')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('disables buttons during processing', async () => {
    const user = userEvent.setup()
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    // Click Actualizar to show update form
    const updateButton = screen.getByText('Actualizar')
    await user.click(updateButton)
    
    // Fill required reason field
    const reasonInput = screen.getByPlaceholderText(/Actualización de precios por inflación/i)
    await user.type(reasonInput, 'Test reason')
    
    // Submit form
    const submitButton = screen.getByText('Actualizar Elementos')
    await user.click(submitButton)
    
    // Buttons should be disabled during processing
    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeDisabled()
    })
  })

  it('shows item badges for selected items', () => {
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={selectedItems}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    // Should show badges for selected items
    selectedItems.forEach(item => {
      expect(screen.getByText(item.name)).toBeInTheDocument()
    })
  })

  it('handles empty selected items array', () => {
    render(
      <BulkOperations
        isOpen={true}
        onClose={mockOnClose}
        selectedItems={[]}
        onBulkOperation={mockOnBulkOperation}
        categories={mockCategories}
        locations={mockLocations}
      />
    )
    
    expect(screen.getByText('Realizar operaciones en 0 elementos seleccionados')).toBeInTheDocument()
    expect(screen.getByText('Elementos Seleccionados (0)')).toBeInTheDocument()
  })
})
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { InventoryFilters } from '@/components/inventory/inventory-filters'
import { setupCommonMocks } from '@/__tests__/utils/test-render'

describe('InventoryFilters', () => {
  const mockOnFiltersChange = vi.fn()
  const defaultFilters = {}

  beforeEach(() => {
    setupCommonMocks()
    vi.clearAllMocks()
  })

  it('renders filter section with title and icon', () => {
    render(<InventoryFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)
    
    expect(screen.getByText('Filters')).toBeInTheDocument()
    // Filter icon should be present
    const filterIcon = document.querySelector('svg')
    expect(filterIcon).toBeInTheDocument()
  })

  it('shows no active filters badge when no filters are applied', () => {
    render(<InventoryFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)
    
    // Should not show active filters count badge
    expect(screen.queryByText('1')).not.toBeInTheDocument()
    expect(screen.queryByText('Clear')).not.toBeInTheDocument()
  })

  it('shows active filters count badge when filters are applied', () => {
    const filtersWithStatus = { status: 'active' as const }
    render(<InventoryFilters filters={filtersWithStatus} onFiltersChange={mockOnFiltersChange} />)
    
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })

  it('renders all filter buttons', () => {
    render(<InventoryFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)
    
    expect(screen.getByText('Active Items')).toBeInTheDocument()
    expect(screen.getByText('Inactive Items')).toBeInTheDocument()
    expect(screen.getByText('Buen Stock')).toBeInTheDocument()
    expect(screen.getByText('Stock Bajo')).toBeInTheDocument()
    expect(screen.getByText('Agotado')).toBeInTheDocument()
  })

  it('applies active status filter when Active Items button is clicked', async () => {
    const user = userEvent.setup()
    render(<InventoryFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)
    
    const activeButton = screen.getByText('Active Items')
    await user.click(activeButton)
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({ status: 'active' })
  })

  it('removes active status filter when Active Items button is clicked again', async () => {
    const user = userEvent.setup()
    const filtersWithActive = { status: 'active' as const }
    render(<InventoryFilters filters={filtersWithActive} onFiltersChange={mockOnFiltersChange} />)
    
    const activeButton = screen.getByText('Active Items')
    await user.click(activeButton)
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({ status: undefined })
  })

  it('applies inactive status filter when Inactive Items button is clicked', async () => {
    const user = userEvent.setup()
    render(<InventoryFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)
    
    const inactiveButton = screen.getByText('Inactive Items')
    await user.click(inactiveButton)
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({ status: 'inactive' })
  })

  it('applies good stock filter when Buen Stock button is clicked', async () => {
    const user = userEvent.setup()
    render(<InventoryFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)
    
    const goodStockButton = screen.getByText('Buen Stock')
    await user.click(goodStockButton)
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({ stockStatus: 'good_stock' })
  })

  it('applies low stock filter when Stock Bajo button is clicked', async () => {
    const user = userEvent.setup()
    render(<InventoryFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)
    
    const lowStockButton = screen.getByText('Stock Bajo')
    await user.click(lowStockButton)
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({ stockStatus: 'low_stock' })
  })

  it('applies out of stock filter when Agotado button is clicked', async () => {
    const user = userEvent.setup()
    render(<InventoryFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)
    
    const outOfStockButton = screen.getByText('Agotado')
    await user.click(outOfStockButton)
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({ stockStatus: 'out_of_stock' })
  })

  it('removes stock status filter when same stock button is clicked again', async () => {
    const user = userEvent.setup()
    const filtersWithLowStock = { stockStatus: 'low_stock' as const }
    render(<InventoryFilters filters={filtersWithLowStock} onFiltersChange={mockOnFiltersChange} />)
    
    const lowStockButton = screen.getByText('Stock Bajo')
    await user.click(lowStockButton)
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({ stockStatus: undefined })
  })

  it('shows active filter badges when filters are applied', () => {
    const filtersWithMultiple = {
      status: 'active' as const,
      stockStatus: 'low_stock' as const,
      category: 'Electronics',
      location: 'Warehouse A'
    }
    render(<InventoryFilters filters={filtersWithMultiple} onFiltersChange={mockOnFiltersChange} />)
    
    expect(screen.getByText('Status: active')).toBeInTheDocument()
    expect(screen.getByText('Stock: Stock Bajo')).toBeInTheDocument()
    expect(screen.getByText('Category: Electronics')).toBeInTheDocument()
    expect(screen.getByText('Location: Warehouse A')).toBeInTheDocument()
  })

  it('shows correct stock status labels in badges', () => {
    const filtersWithGoodStock = { stockStatus: 'good_stock' as const }
    render(<InventoryFilters filters={filtersWithGoodStock} onFiltersChange={mockOnFiltersChange} />)
    
    expect(screen.getByText('Stock: Buen Stock')).toBeInTheDocument()
  })

  it('shows correct stock status labels for out of stock', () => {
    const filtersWithOutOfStock = { stockStatus: 'out_of_stock' as const }
    render(<InventoryFilters filters={filtersWithOutOfStock} onFiltersChange={mockOnFiltersChange} />)
    
    expect(screen.getByText('Stock: Agotado')).toBeInTheDocument()
  })

  it('shows low stock badge when lowStock filter is applied', () => {
    const filtersWithLowStock = { lowStock: true }
    render(<InventoryFilters filters={filtersWithLowStock} onFiltersChange={mockOnFiltersChange} />)
    
    expect(screen.getByText('Low Stock')).toBeInTheDocument()
  })

  it('removes status filter when X is clicked on status badge', async () => {
    const user = userEvent.setup()
    const filtersWithStatus = { status: 'active' as const }
    render(<InventoryFilters filters={filtersWithStatus} onFiltersChange={mockOnFiltersChange} />)
    
    const statusBadge = screen.getByText('Status: active')
    const removeButton = statusBadge.parentElement?.querySelector('svg')
    expect(removeButton).toBeInTheDocument()
    
    if (removeButton) {
      await user.click(removeButton)
      expect(mockOnFiltersChange).toHaveBeenCalledWith({ status: undefined })
    }
  })

  it('removes stock status filter when X is clicked on stock status badge', async () => {
    const user = userEvent.setup()
    const filtersWithStockStatus = { stockStatus: 'low_stock' as const }
    render(<InventoryFilters filters={filtersWithStockStatus} onFiltersChange={mockOnFiltersChange} />)
    
    const stockBadge = screen.getByText('Stock: Stock Bajo')
    const removeButton = stockBadge.parentElement?.querySelector('svg')
    expect(removeButton).toBeInTheDocument()
    
    if (removeButton) {
      await user.click(removeButton)
      expect(mockOnFiltersChange).toHaveBeenCalledWith({ stockStatus: undefined })
    }
  })

  it('removes low stock filter when X is clicked on low stock badge', async () => {
    const user = userEvent.setup()
    const filtersWithLowStock = { lowStock: true }
    render(<InventoryFilters filters={filtersWithLowStock} onFiltersChange={mockOnFiltersChange} />)
    
    const lowStockBadge = screen.getByText('Low Stock')
    const removeButton = lowStockBadge.parentElement?.querySelector('svg')
    expect(removeButton).toBeInTheDocument()
    
    if (removeButton) {
      await user.click(removeButton)
      expect(mockOnFiltersChange).toHaveBeenCalledWith({ lowStock: false })
    }
  })

  it('removes category filter when X is clicked on category badge', async () => {
    const user = userEvent.setup()
    const filtersWithCategory = { category: 'Electronics' }
    render(<InventoryFilters filters={filtersWithCategory} onFiltersChange={mockOnFiltersChange} />)
    
    const categoryBadge = screen.getByText('Category: Electronics')
    const removeButton = categoryBadge.parentElement?.querySelector('svg')
    expect(removeButton).toBeInTheDocument()
    
    if (removeButton) {
      await user.click(removeButton)
      expect(mockOnFiltersChange).toHaveBeenCalledWith({ category: undefined })
    }
  })

  it('removes location filter when X is clicked on location badge', async () => {
    const user = userEvent.setup()
    const filtersWithLocation = { location: 'Warehouse A' }
    render(<InventoryFilters filters={filtersWithLocation} onFiltersChange={mockOnFiltersChange} />)
    
    const locationBadge = screen.getByText('Location: Warehouse A')
    const removeButton = locationBadge.parentElement?.querySelector('svg')
    expect(removeButton).toBeInTheDocument()
    
    if (removeButton) {
      await user.click(removeButton)
      expect(mockOnFiltersChange).toHaveBeenCalledWith({ location: undefined })
    }
  })

  it('clears all filters when Clear button is clicked', async () => {
    const user = userEvent.setup()
    const filtersWithMultiple = {
      status: 'active' as const,
      stockStatus: 'low_stock' as const,
      category: 'Electronics'
    }
    render(<InventoryFilters filters={filtersWithMultiple} onFiltersChange={mockOnFiltersChange} />)
    
    const clearButton = screen.getByText('Clear')
    await user.click(clearButton)
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({})
  })

  it('shows correct active filters count with multiple filters', () => {
    const filtersWithMultiple = {
      status: 'active' as const,
      stockStatus: 'low_stock' as const,
      category: 'Electronics',
      lowStock: true
    }
    render(<InventoryFilters filters={filtersWithMultiple} onFiltersChange={mockOnFiltersChange} />)
    
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('applies correct CSS classes to stock status buttons', () => {
    render(<InventoryFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)
    
    const goodStockButton = screen.getByText('Buen Stock')
    const lowStockButton = screen.getByText('Stock Bajo')
    const outOfStockButton = screen.getByText('Agotado')
    
    expect(goodStockButton).toHaveClass('bg-green-50', 'text-green-700', 'border-green-200')
    expect(lowStockButton).toHaveClass('bg-yellow-50', 'text-yellow-700', 'border-yellow-200')
    expect(outOfStockButton).toHaveClass('bg-red-50', 'text-red-700', 'border-red-200')
  })

  it('shows default variant for active status button when not selected', () => {
    render(<InventoryFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)
    
    const activeButton = screen.getByText('Active Items')
    // Should have outline variant (not default)
    expect(activeButton).not.toHaveClass('bg-primary')
  })

  it('shows default variant for active status button when selected', () => {
    const filtersWithActive = { status: 'active' as const }
    render(<InventoryFilters filters={filtersWithActive} onFiltersChange={mockOnFiltersChange} />)
    
    const activeButton = screen.getByText('Active Items')
    // Should have default variant when selected
    expect(activeButton).toHaveClass('bg-primary')
  })

  it('shows default variant for stock status button when selected', () => {
    const filtersWithLowStock = { stockStatus: 'low_stock' as const }
    render(<InventoryFilters filters={filtersWithLowStock} onFiltersChange={mockOnFiltersChange} />)
    
    const lowStockButton = screen.getByText('Stock Bajo')
    // Should have default variant when selected
    expect(lowStockButton).toHaveClass('bg-primary')
  })

  it('preserves other filters when applying a new filter', async () => {
    const user = userEvent.setup()
    const existingFilters = { category: 'Electronics' }
    render(<InventoryFilters filters={existingFilters} onFiltersChange={mockOnFiltersChange} />)
    
    const activeButton = screen.getByText('Active Items')
    await user.click(activeButton)
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      category: 'Electronics',
      status: 'active'
    })
  })

  it('handles undefined filters gracefully', () => {
    const undefinedFilters = undefined as any
    render(<InventoryFilters filters={undefinedFilters} onFiltersChange={mockOnFiltersChange} />)
    
    expect(screen.getByText('Filters')).toBeInTheDocument()
    expect(screen.queryByText('Clear')).not.toBeInTheDocument()
  })

  it('handles null filters gracefully', () => {
    const nullFilters = null as any
    render(<InventoryFilters filters={nullFilters} onFiltersChange={mockOnFiltersChange} />)
    
    expect(screen.getByText('Filters')).toBeInTheDocument()
    expect(screen.queryByText('Clear')).not.toBeInTheDocument()
  })

  it('does not show active filters section when no filters are applied', () => {
    render(<InventoryFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)
    
    // Should not show the active filters badges section
    expect(screen.queryByText('Status:')).not.toBeInTheDocument()
    expect(screen.queryByText('Stock:')).not.toBeInTheDocument()
  })
})
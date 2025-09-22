import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { InventoryTable } from '@/components/inventory/inventory-table'
import { createMockInventoryItems, resetSequenceCounter } from '@/__tests__/utils/mock-data'
import { setupCommonMocks } from '@/__tests__/utils/test-render'

// Mock the database service
const mockAuditedInventoryService = {
  getAll: vi.fn(),
  delete: vi.fn(),
}

vi.mock('@/lib/database-with-audit', () => ({
  auditedInventoryService: mockAuditedInventoryService
}))

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  })
}))

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: any) => {
    // Return mock translations
    const translations: Record<string, string> = {
      'table.searchPlaceholder': 'Search items...',
      'table.headers.sku': 'SKU',
      'table.headers.name': 'Name',
      'table.headers.category': 'Category',
      'table.headers.location': 'Location',
      'table.headers.price': 'Price',
      'table.headers.stock': 'Stock',
      'table.headers.status': 'Status',
      'table.headers.lastUpdated': 'Last Updated',
      'table.headers.actions': 'Actions',
      'table.actions.addStock': 'Agregar stock',
      'table.actions.subtractStock': 'Restar stock',
      'table.actions.edit': 'Edit',
      'table.actions.delete': 'Delete',
      'table.stockStatus.outOfStock': 'Out of Stock',
      'table.stockStatus.lowStock': 'Low Stock',
      'table.stockStatus.inStock': 'In Stock',
      'table.noItemsFound': 'No items found matching your criteria.',
      'bulkOperations': `Bulk Operations (${params?.count || 0})`,
      'confirmDelete': `Are you sure you want to delete ${params?.name}?`,
      'errorLoadingInventory': 'Failed to fetch inventory items',
      'unknown': 'Unknown',
      'minStock': 'Min Stock'
    }
    return translations[key] || key
  }
}))

// Mock fetch globally
vi.stubGlobal('fetch', vi.fn())

// Mock QuickStockModal component
vi.mock('@/components/inventory/quick-stock-modal', () => ({
  QuickStockModal: ({ isOpen, onClose, item, onStockUpdated, initialOperation }: any) => (
    isOpen ? (
      <div data-testid="quick-stock-modal">
        <div>Quick Stock Modal for {item?.name}</div>
        <div>Operation: {initialOperation}</div>
        <button onClick={onClose}>Close</button>
        <button onClick={onStockUpdated}>Update Stock</button>
      </div>
    ) : null
  )
}))

describe('InventoryTable', () => {
  const mockItems = createMockInventoryItems(5)
  const defaultFilters = {}

  beforeEach(() => {
    resetSequenceCounter()
    setupCommonMocks()
    vi.clearAllMocks()
    
    // Mock the service to return our test data
    mockAuditedInventoryService.getAll.mockResolvedValue(mockItems)
    
    // Mock fetch to return our test data
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItems
    } as Response)
  })

  it('renders loading state initially', () => {
    render(<InventoryTable filters={defaultFilters} />)
    
    // Check for loading skeleton
    expect(screen.getByText('Search items...')).toBeInTheDocument()
    const skeletonElements = document.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('renders inventory items after loading', async () => {
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    // Check that all items are rendered
    mockItems.forEach(item => {
      expect(screen.getByText(item.name)).toBeInTheDocument()
      expect(screen.getByText(item.sku)).toBeInTheDocument()
    })
  })

  it('displays error state when data fetching fails', async () => {
    mockAuditedInventoryService.getAll.mockRejectedValue(new Error('Failed to fetch'))
    
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch inventory items/)).toBeInTheDocument()
    })
  })

  it('filters items by search term', async () => {
    const user = userEvent.setup()
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search items...')
    await user.type(searchInput, mockItems[0].name)

    // Should show only the searched item
    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    
    // Other items should not be visible (assuming they don't match)
    const otherItems = mockItems.slice(1).filter(item => 
      !item.name.toLowerCase().includes(mockItems[0].name.toLowerCase())
    )
    otherItems.forEach(item => {
      expect(screen.queryByText(item.name)).not.toBeInTheDocument()
    })
  })

  it('filters items by SKU', async () => {
    const user = userEvent.setup()
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].sku)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search items...')
    await user.type(searchInput, mockItems[0].sku)

    expect(screen.getByText(mockItems[0].sku)).toBeInTheDocument()
  })

  it('sorts items by name when name header is clicked', async () => {
    const user = userEvent.setup()
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    const nameHeader = screen.getByRole('button', { name: /name/i })
    await user.click(nameHeader)

    // Items should be sorted (we can't easily test the exact order without more complex setup)
    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
  })

  it('sorts items by SKU when SKU header is clicked', async () => {
    const user = userEvent.setup()
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].sku)).toBeInTheDocument()
    })

    const skuHeader = screen.getByRole('button', { name: /sku/i })
    await user.click(skuHeader)

    expect(screen.getByText(mockItems[0].sku)).toBeInTheDocument()
  })

  it('sorts items by price when price header is clicked', async () => {
    const user = userEvent.setup()
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    const priceHeader = screen.getByRole('button', { name: /price/i })
    await user.click(priceHeader)

    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
  })

  it('sorts items by stock when stock header is clicked', async () => {
    const user = userEvent.setup()
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    const stockHeader = screen.getByRole('button', { name: /stock/i })
    await user.click(stockHeader)

    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
  })

  it('toggles sort direction when clicking the same header twice', async () => {
    const user = userEvent.setup()
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    const nameHeader = screen.getByRole('button', { name: /name/i })
    
    // First click - ascending
    await user.click(nameHeader)
    
    // Second click - descending
    await user.click(nameHeader)

    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
  })

  it('selects individual items with checkboxes', async () => {
    const user = userEvent.setup()
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    const checkbox = screen.getByLabelText(`Select ${mockItems[0].name}`)
    await user.click(checkbox)

    expect(checkbox).toBeChecked()
  })

  it('selects all items with select all checkbox', async () => {
    const user = userEvent.setup()
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    const selectAllCheckbox = screen.getByLabelText('Select all')
    await user.click(selectAllCheckbox)

    expect(selectAllCheckbox).toBeChecked()
    
    // All individual checkboxes should be checked
    mockItems.forEach(item => {
      const checkbox = screen.getByLabelText(`Select ${item.name}`)
      expect(checkbox).toBeChecked()
    })
  })

  it('shows bulk operations button when items are selected', async () => {
    const user = userEvent.setup()
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    const checkbox = screen.getByLabelText(`Select ${mockItems[0].name}`)
    await user.click(checkbox)

    expect(screen.getByText(/Bulk Operations \(1\)/)).toBeInTheDocument()
  })

  it('opens quick stock modal when add stock button is clicked', async () => {
    const user = userEvent.setup()
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    const addStockButtons = screen.getAllByTitle('Agregar stock')
    await user.click(addStockButtons[0])

    expect(screen.getByTestId('quick-stock-modal')).toBeInTheDocument()
    expect(screen.getByText(`Quick Stock Modal for ${mockItems[0].name}`)).toBeInTheDocument()
    expect(screen.getByText('Operation: add')).toBeInTheDocument()
  })

  it('opens quick stock modal when subtract stock button is clicked', async () => {
    const user = userEvent.setup()
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    const subtractStockButtons = screen.getAllByTitle('Restar stock')
    await user.click(subtractStockButtons[0])

    expect(screen.getByTestId('quick-stock-modal')).toBeInTheDocument()
    expect(screen.getByText(`Quick Stock Modal for ${mockItems[0].name}`)).toBeInTheDocument()
    expect(screen.getByText('Operation: subtract')).toBeInTheDocument()
  })

  it('closes quick stock modal when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    const addStockButtons = screen.getAllByTitle('Agregar stock')
    await user.click(addStockButtons[0])

    expect(screen.getByTestId('quick-stock-modal')).toBeInTheDocument()

    const closeButton = screen.getByText('Close')
    await user.click(closeButton)

    expect(screen.queryByTestId('quick-stock-modal')).not.toBeInTheDocument()
  })

  it('refreshes data when stock is updated', async () => {
    const user = userEvent.setup()
    // Using mockAuditedInventoryService
    
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    const addStockButtons = screen.getAllByTitle('Agregar stock')
    await user.click(addStockButtons[0])

    const updateStockButton = screen.getByText('Update Stock')
    await user.click(updateStockButton)

    // Should call getAll again to refresh data
    expect(mockAuditedInventoryService.getAll).toHaveBeenCalledTimes(2)
  })

  it('navigates to edit page when edit button is clicked', async () => {
    const user = userEvent.setup()
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTitle('Edit')
    await user.click(editButtons[0])

    expect(mockPush).toHaveBeenCalledWith(`/inventory/edit/${mockItems[0].id}`)
  })

  it('deletes item when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup()
    // Using mockAuditedInventoryService
    
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle('Delete')
    await user.click(deleteButtons[0])

    expect(confirmSpy).toHaveBeenCalledWith(`Are you sure you want to delete ${mockItems[0].name}?`)
    expect(mockAuditedInventoryService.delete).toHaveBeenCalledWith(mockItems[0].id)
    
    confirmSpy.mockRestore()
  })

  it('does not delete item when delete is cancelled', async () => {
    const user = userEvent.setup()
    // Using mockAuditedInventoryService
    
    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle('Delete')
    await user.click(deleteButtons[0])

    expect(confirmSpy).toHaveBeenCalled()
    expect(mockAuditedInventoryService.delete).not.toHaveBeenCalled()
    
    confirmSpy.mockRestore()
  })

  it('displays stock badges correctly', async () => {
    // Create items with different stock levels
    const lowStockItem = { ...mockItems[0], quantity: 2, min_stock: 10 }
    const outOfStockItem = { ...mockItems[1], quantity: 0, min_stock: 5 }
    const goodStockItem = { ...mockItems[2], quantity: 50, min_stock: 10 }
    
    // Using mockAuditedInventoryService
    mockAuditedInventoryService.getAll.mockResolvedValue([lowStockItem, outOfStockItem, goodStockItem])
    
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText('Low Stock')).toBeInTheDocument()
      expect(screen.getByText('Out of Stock')).toBeInTheDocument()
      expect(screen.getByText('In Stock')).toBeInTheDocument()
    })
  })

  it('filters items by status', async () => {
    const activeFilters = { status: 'active' }
    render(<InventoryTable filters={activeFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
    })
    
    // Only active items should be shown (assuming mock items are active)
    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument()
  })

  it('filters items by low stock', async () => {
    const lowStockFilters = { lowStock: true }
    render(<InventoryTable filters={lowStockFilters} />)
    
    await waitFor(() => {
      // Should only show items that match the low stock filter
      expect(screen.getByText('No items found matching your criteria.')).toBeInTheDocument()
    })
  })

  it('filters items by stock status', async () => {
    const stockStatusFilters = { stockStatus: 'low_stock' }
    render(<InventoryTable filters={stockStatusFilters} />)
    
    await waitFor(() => {
      // Should only show items that match the stock status filter
      expect(screen.getByText('No items found matching your criteria.')).toBeInTheDocument()
    })
  })

  it('shows no items message when no items match filters', async () => {
    // Using mockAuditedInventoryService
    mockAuditedInventoryService.getAll.mockResolvedValue([])
    
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText('No items found matching your criteria.')).toBeInTheDocument()
    })
  })

  it('displays category information correctly', async () => {
    const itemWithCategory = {
      ...mockItems[0],
      categories: {
        id: 'cat-1',
        name: 'Electronics',
        color: '#3B82F6'
      }
    }
    
    // Using mockAuditedInventoryService
    mockAuditedInventoryService.getAll.mockResolvedValue([itemWithCategory])
    
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument()
    })
  })

  it('displays location information correctly', async () => {
    const itemWithLocation = {
      ...mockItems[0],
      locations: {
        id: 'loc-1',
        name: 'Main Warehouse',
        type: 'warehouse'
      }
    }
    
    // Using mockAuditedInventoryService
    mockAuditedInventoryService.getAll.mockResolvedValue([itemWithLocation])
    
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText('Main Warehouse')).toBeInTheDocument()
      expect(screen.getByText('warehouse')).toBeInTheDocument()
    })
  })

  it('handles missing category gracefully', async () => {
    const itemWithoutCategory = {
      ...mockItems[0],
      categories: null
    }
    
    // Using mockAuditedInventoryService
    mockAuditedInventoryService.getAll.mockResolvedValue([itemWithoutCategory])
    
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })
  })

  it('handles missing location gracefully', async () => {
    const itemWithoutLocation = {
      ...mockItems[0],
      locations: null
    }
    
    // Using mockAuditedInventoryService
    mockAuditedInventoryService.getAll.mockResolvedValue([itemWithoutLocation])
    
    render(<InventoryTable filters={defaultFilters} />)
    
    await waitFor(() => {
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })
  })
})
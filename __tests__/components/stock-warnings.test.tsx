import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { StockWarnings } from '@/components/inventory/stock-warnings'
import { setupCommonMocks } from '@/__tests__/utils/test-render'
import { createMockInventoryItems } from '@/__tests__/utils/mock-data'

describe('StockWarnings', () => {
  beforeEach(() => {
    setupCommonMocks()
  })

  it('renders nothing when all items have good stock', () => {
    const goodStockItems = createMockInventoryItems(3).map(item => ({
      ...item,
      currentStock: 50,
      minimumLevel: 10
    }))

    const { container } = render(<StockWarnings items={goodStockItems} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows out of stock warning when items have zero stock', () => {
    const outOfStockItems = createMockInventoryItems(2).map(item => ({
      ...item,
      currentStock: 0,
      minimumLevel: 10
    }))

    render(<StockWarnings items={outOfStockItems} />)
    
    expect(screen.getByText('Productos Agotados:')).toBeInTheDocument()
    expect(screen.getByText('2 productos sin stock')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // Badge count
  })

  it('shows low stock warning when items are below minimum level', () => {
    const lowStockItems = createMockInventoryItems(3).map(item => ({
      ...item,
      currentStock: 5,
      minimumLevel: 10
    }))

    render(<StockWarnings items={lowStockItems} />)
    
    expect(screen.getByText('Stock Bajo:')).toBeInTheDocument()
    expect(screen.getByText('3 productos con poco stock')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // Badge count
  })

  it('displays item details for out of stock items', () => {
    const outOfStockItems = createMockInventoryItems(2).map((item, index) => ({
      ...item,
      name: `Out of Stock Item ${index + 1}`,
      currentStock: 0,
      minimumLevel: 10
    }))

    render(<StockWarnings items={outOfStockItems} />)
    
    expect(screen.getByText('Out of Stock Item 1')).toBeInTheDocument()
    expect(screen.getByText('Out of Stock Item 2')).toBeInTheDocument()
    expect(screen.getAllByText('Stock: 0')).toHaveLength(2)
  })

  it('displays item details for low stock items', () => {
    const lowStockItems = createMockInventoryItems(2).map((item, index) => ({
      ...item,
      name: `Low Stock Item ${index + 1}`,
      currentStock: 5,
      minimumLevel: 10
    }))

    render(<StockWarnings items={lowStockItems} />)
    
    expect(screen.getByText('Low Stock Item 1')).toBeInTheDocument()
    expect(screen.getByText('Low Stock Item 2')).toBeInTheDocument()
    expect(screen.getAllByText('Stock: 5 / Min: 10')).toHaveLength(2)
  })

  it('shows both out of stock and low stock warnings', () => {
    const mixedItems = [
      ...createMockInventoryItems(2).map((item, index) => ({
        ...item,
        name: `Out of Stock Item ${index + 1}`,
        currentStock: 0,
        minimumLevel: 10
      })),
      ...createMockInventoryItems(3).map((item, index) => ({
        ...item,
        name: `Low Stock Item ${index + 1}`,
        currentStock: 5,
        minimumLevel: 10
      }))
    ]

    render(<StockWarnings items={mixedItems} />)
    
    expect(screen.getByText('Productos Agotados:')).toBeInTheDocument()
    expect(screen.getByText('2 productos sin stock')).toBeInTheDocument()
    expect(screen.getByText('Stock Bajo:')).toBeInTheDocument()
    expect(screen.getByText('3 productos con poco stock')).toBeInTheDocument()
  })

  it('limits displayed items to 3 and shows overflow count', () => {
    const manyOutOfStockItems = createMockInventoryItems(5).map((item, index) => ({
      ...item,
      name: `Out of Stock Item ${index + 1}`,
      currentStock: 0,
      minimumLevel: 10
    }))

    render(<StockWarnings items={manyOutOfStockItems} />)
    
    // Should show first 3 items
    expect(screen.getByText('Out of Stock Item 1')).toBeInTheDocument()
    expect(screen.getByText('Out of Stock Item 2')).toBeInTheDocument()
    expect(screen.getByText('Out of Stock Item 3')).toBeInTheDocument()
    
    // Should not show 4th and 5th items
    expect(screen.queryByText('Out of Stock Item 4')).not.toBeInTheDocument()
    expect(screen.queryByText('Out of Stock Item 5')).not.toBeInTheDocument()
    
    // Should show overflow count
    expect(screen.getByText('+2 productos más')).toBeInTheDocument()
  })

  it('shows stock summary with correct counts', () => {
    const mixedItems = [
      // 2 good stock items
      ...createMockInventoryItems(2).map(item => ({
        ...item,
        currentStock: 50,
        minimumLevel: 10
      })),
      // 3 low stock items
      ...createMockInventoryItems(3).map(item => ({
        ...item,
        currentStock: 5,
        minimumLevel: 10
      })),
      // 1 out of stock item
      ...createMockInventoryItems(1).map(item => ({
        ...item,
        currentStock: 0,
        minimumLevel: 10
      }))
    ]

    render(<StockWarnings items={mixedItems} />)
    
    expect(screen.getByText('Buen Stock: 2')).toBeInTheDocument()
    expect(screen.getByText('Stock Bajo: 3')).toBeInTheDocument()
    expect(screen.getByText('Agotado: 1')).toBeInTheDocument()
  })

  it('uses correct styling for out of stock alert', () => {
    const outOfStockItems = createMockInventoryItems(1).map(item => ({
      ...item,
      currentStock: 0,
      minimumLevel: 10
    }))

    render(<StockWarnings items={outOfStockItems} />)
    
    const alert = screen.getByText('Productos Agotados:').closest('[role="alert"]')
    expect(alert).toHaveClass('border-red-200', 'bg-red-50')
  })

  it('uses correct styling for low stock alert', () => {
    const lowStockItems = createMockInventoryItems(1).map(item => ({
      ...item,
      currentStock: 5,
      minimumLevel: 10
    }))

    render(<StockWarnings items={lowStockItems} />)
    
    const alert = screen.getByText('Stock Bajo:').closest('[role="alert"]')
    expect(alert).toHaveClass('border-yellow-200', 'bg-yellow-50')
  })

  it('shows correct icons for each alert type', () => {
    const mixedItems = [
      ...createMockInventoryItems(1).map(item => ({
        ...item,
        currentStock: 0,
        minimumLevel: 10
      })),
      ...createMockInventoryItems(1).map(item => ({
        ...item,
        currentStock: 5,
        minimumLevel: 10
      }))
    ]

    render(<StockWarnings items={mixedItems} />)
    
    // Should have XCircle icon for out of stock
    const outOfStockIcon = screen.getByText('Productos Agotados:').parentElement?.querySelector('svg')
    expect(outOfStockIcon).toHaveClass('text-red-600')
    
    // Should have AlertTriangle icon for low stock
    const lowStockIcon = screen.getByText('Stock Bajo:').parentElement?.querySelector('svg')
    expect(lowStockIcon).toHaveClass('text-yellow-600')
  })

  it('shows correct badge variants', () => {
    const mixedItems = [
      ...createMockInventoryItems(1).map(item => ({
        ...item,
        currentStock: 0,
        minimumLevel: 10
      })),
      ...createMockInventoryItems(1).map(item => ({
        ...item,
        currentStock: 5,
        minimumLevel: 10
      }))
    ]

    render(<StockWarnings items={mixedItems} />)
    
    const outOfStockBadge = screen.getByText('Productos Agotados:').parentElement?.querySelector('[class*="destructive"]')
    expect(outOfStockBadge).toBeInTheDocument()
    
    const lowStockBadge = screen.getByText('Stock Bajo:').parentElement?.querySelector('[class*="bg-yellow-100"]')
    expect(lowStockBadge).toBeInTheDocument()
  })

  it('handles edge case where item has stock equal to minimum level', () => {
    const edgeCaseItems = createMockInventoryItems(1).map(item => ({
      ...item,
      currentStock: 10,
      minimumLevel: 10
    }))

    render(<StockWarnings items={edgeCaseItems} />)
    
    // Should be considered good stock (not low stock)
    expect(screen.getByText('Buen Stock: 1')).toBeInTheDocument()
    expect(screen.queryByText('Stock Bajo:')).not.toBeInTheDocument()
  })

  it('handles empty items array', () => {
    const { container } = render(<StockWarnings items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('correctly categorizes items with different stock levels', () => {
    const items = [
      // Out of stock
      { ...createMockInventoryItems(1)[0], currentStock: 0, minimumLevel: 10 },
      // Low stock
      { ...createMockInventoryItems(1)[0], currentStock: 5, minimumLevel: 10 },
      // At minimum (good stock)
      { ...createMockInventoryItems(1)[0], currentStock: 10, minimumLevel: 10 },
      // Above minimum (good stock)
      { ...createMockInventoryItems(1)[0], currentStock: 20, minimumLevel: 10 }
    ]

    render(<StockWarnings items={items} />)
    
    expect(screen.getByText('Buen Stock: 2')).toBeInTheDocument()
    expect(screen.getByText('Stock Bajo: 1')).toBeInTheDocument()
    expect(screen.getByText('Agotado: 1')).toBeInTheDocument()
  })

  it('shows summary icons with correct colors', () => {
    const mixedItems = [
      ...createMockInventoryItems(1).map(item => ({
        ...item,
        currentStock: 50,
        minimumLevel: 10
      })),
      ...createMockInventoryItems(1).map(item => ({
        ...item,
        currentStock: 5,
        minimumLevel: 10
      })),
      ...createMockInventoryItems(1).map(item => ({
        ...item,
        currentStock: 0,
        minimumLevel: 10
      }))
    ]

    render(<StockWarnings items={mixedItems} />)
    
    const summarySection = screen.getByText('Buen Stock: 1').parentElement
    
    // Check for correct icon colors in summary
    const greenIcon = summarySection?.querySelector('.text-green-600')
    const yellowIcon = summarySection?.querySelector('.text-yellow-600')
    const redIcon = summarySection?.querySelector('.text-red-600')
    
    expect(greenIcon).toBeInTheDocument()
    expect(yellowIcon).toBeInTheDocument()
    expect(redIcon).toBeInTheDocument()
  })
})
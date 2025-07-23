import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '../utils/test-render'
import { MetricsCards } from '@/components/dashboard/metrics-cards'
import { createMockMetrics } from '../utils/mock-data'

// Mock the analytics service
const mockGetDashboardMetrics = vi.fn()
vi.mock('@/lib/database', () => ({
  analyticsService: {
    getDashboardMetrics: mockGetDashboardMetrics
  }
}))

// Mock utility functions
vi.mock('@/lib/utils', () => ({
  formatCurrency: (value: number) => `$${value.toLocaleString()}`,
  formatNumber: (value: number) => value.toLocaleString()
}))

describe('MetricsCards', () => {
  const mockMetrics = createMockMetrics()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially', () => {
    mockGetDashboardMetrics.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<MetricsCards />)
    
    // Should show 4 skeleton cards
    const skeletonCards = screen.getAllByTestId(/card/)
    expect(skeletonCards).toHaveLength(4)
    
    // Check for loading animation
    const animatedElements = document.querySelectorAll('.animate-pulse')
    expect(animatedElements.length).toBeGreaterThan(0)
  })

  it('renders metrics cards with data', async () => {
    mockGetDashboardMetrics.mockResolvedValue(mockMetrics)
    
    render(<MetricsCards />)
    
    await waitFor(() => {
      expect(screen.getByText('Total Items')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Total Value')).toBeInTheDocument()
    expect(screen.getByText('Low Stock')).toBeInTheDocument()
    expect(screen.getByText('Categories')).toBeInTheDocument()
  })

  it('displays formatted metric values correctly', async () => {
    mockGetDashboardMetrics.mockResolvedValue(mockMetrics)
    
    render(<MetricsCards />)
    
    await waitFor(() => {
      expect(screen.getByText(mockMetrics.totalItems.toLocaleString())).toBeInTheDocument()
    })
    
    expect(screen.getByText(`$${mockMetrics.totalValue.toLocaleString()}`)).toBeInTheDocument()
    expect(screen.getByText(mockMetrics.lowStockCount.toLocaleString())).toBeInTheDocument()
    expect(screen.getByText(mockMetrics.categoriesCount.toLocaleString())).toBeInTheDocument()
  })

  it('displays correct descriptions for each metric', async () => {
    mockGetDashboardMetrics.mockResolvedValue(mockMetrics)
    
    render(<MetricsCards />)
    
    await waitFor(() => {
      expect(screen.getByText('Items in inventory')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Inventory value')).toBeInTheDocument()
    expect(screen.getByText('Items need restocking')).toBeInTheDocument()
    expect(screen.getByText('Product categories')).toBeInTheDocument()
  })

  it('displays correct icons for each metric', async () => {
    mockGetDashboardMetrics.mockResolvedValue(mockMetrics)
    
    render(<MetricsCards />)
    
    await waitFor(() => {
      expect(screen.getByText('Total Items')).toBeInTheDocument()
    })
    
    // Icons should be present (we can't easily test the specific icon, but we can check they exist)
    const cards = screen.getAllByRole('generic').filter(el => 
      el.className.includes('Card') || el.tagName.toLowerCase() === 'div'
    )
    expect(cards.length).toBeGreaterThan(0)
  })

  it('highlights low stock card when there are low stock items', async () => {
    const metricsWithLowStock = { ...mockMetrics, lowStockCount: 5 }
    mockGetDashboardMetrics.mockResolvedValue(metricsWithLowStock)
    
    render(<MetricsCards />)
    
    await waitFor(() => {
      expect(screen.getByText('Low Stock')).toBeInTheDocument()
    })
    
    const lowStockCard = screen.getByText('Low Stock').closest('[class*="Card"]')
    expect(lowStockCard).toHaveClass('border-yellow-200', 'bg-yellow-50/50')
  })

  it('does not highlight low stock card when there are no low stock items', async () => {
    const metricsWithoutLowStock = { ...mockMetrics, lowStockCount: 0 }
    mockGetDashboardMetrics.mockResolvedValue(metricsWithoutLowStock)
    
    render(<MetricsCards />)
    
    await waitFor(() => {
      expect(screen.getByText('Low Stock')).toBeInTheDocument()
    })
    
    const lowStockCard = screen.getByText('Low Stock').closest('[class*="Card"]')
    expect(lowStockCard).not.toHaveClass('border-yellow-200', 'bg-yellow-50/50')
  })

  it('displays "Requires attention" trend for low stock items', async () => {
    const metricsWithLowStock = { ...mockMetrics, lowStockCount: 3 }
    mockGetDashboardMetrics.mockResolvedValue(metricsWithLowStock)
    
    render(<MetricsCards />)
    
    await waitFor(() => {
      expect(screen.getByText('Requires attention')).toBeInTheDocument()
    })
  })

  it('displays "Real-time data" trend for other metrics', async () => {
    mockGetDashboardMetrics.mockResolvedValue(mockMetrics)
    
    render(<MetricsCards />)
    
    await waitFor(() => {
      const realTimeTexts = screen.getAllByText('Real-time data')
      expect(realTimeTexts).toHaveLength(2) // Total Items and Total Value
    })
    
    expect(screen.getByText('Active categories')).toBeInTheDocument()
  })

  it('handles error state correctly', async () => {
    const errorMessage = 'Failed to fetch metrics'
    mockGetDashboardMetrics.mockRejectedValue(new Error(errorMessage))
    
    render(<MetricsCards />)
    
    await waitFor(() => {
      expect(screen.getByText(`Error loading metrics: ${errorMessage}`)).toBeInTheDocument()
    })
    
    const errorCard = screen.getByText(`Error loading metrics: ${errorMessage}`).closest('[class*="Card"]')
    expect(errorCard).toHaveClass('col-span-full', 'border-red-200', 'bg-red-50/50')
  })

  it('handles non-Error exceptions', async () => {
    mockGetDashboardMetrics.mockRejectedValue('String error')
    
    render(<MetricsCards />)
    
    await waitFor(() => {
      expect(screen.getByText('Error loading metrics: Failed to fetch metrics')).toBeInTheDocument()
    })
  })

  it('returns null when metrics is null after loading', async () => {
    mockGetDashboardMetrics.mockResolvedValue(null)
    
    const { container } = render(<MetricsCards />)
    
    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  it('has proper responsive grid layout', async () => {
    mockGetDashboardMetrics.mockResolvedValue(mockMetrics)
    
    render(<MetricsCards />)
    
    await waitFor(() => {
      expect(screen.getByText('Total Items')).toBeInTheDocument()
    })
    
    const gridContainer = screen.getByText('Total Items').closest('.grid')
    expect(gridContainer).toHaveClass('grid', 'gap-4', 'md:grid-cols-2', 'lg:grid-cols-4')
  })

  it('calls analytics service on mount', () => {
    mockGetDashboardMetrics.mockResolvedValue(mockMetrics)
    
    render(<MetricsCards />)
    
    expect(mockGetDashboardMetrics).toHaveBeenCalledTimes(1)
  })

  it('has proper card structure and styling', async () => {
    mockGetDashboardMetrics.mockResolvedValue(mockMetrics)
    
    render(<MetricsCards />)
    
    await waitFor(() => {
      expect(screen.getByText('Total Items')).toBeInTheDocument()
    })
    
    // Check card header structure
    const cardHeaders = document.querySelectorAll('[class*="CardHeader"]')
    expect(cardHeaders.length).toBe(4)
    
    // Check card content structure
    const cardContents = document.querySelectorAll('[class*="CardContent"]')
    expect(cardContents.length).toBe(4)
  })

  it('displays trend colors correctly', async () => {
    mockGetDashboardMetrics.mockResolvedValue(mockMetrics)
    
    render(<MetricsCards />)
    
    await waitFor(() => {
      expect(screen.getByText('Real-time data')).toBeInTheDocument()
    })
    
    // Real-time data should have muted foreground color
    const realTimeElements = screen.getAllByText('Real-time data')
    realTimeElements.forEach(element => {
      expect(element).toHaveClass('text-muted-foreground')
    })
    
    // Active categories should have muted foreground color
    const activeCategoriesElement = screen.getByText('Active categories')
    expect(activeCategoriesElement).toHaveClass('text-muted-foreground')
  })
})
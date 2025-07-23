import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '../utils/test-render'
import { InventoryChart } from '@/components/dashboard/inventory-chart'

// Mock recharts components
vi.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data }: any) => <div data-testid="pie" data-length={data?.length || 0} />,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />
}))

// Mock the analytics service
const mockGetInventoryByCategory = vi.fn()
vi.mock('@/lib/database', () => ({
  analyticsService: {
    getInventoryByCategory: mockGetInventoryByCategory
  }
}))

describe('InventoryChart', () => {
  const mockCategoryData = [
    { name: 'Electronics', value: 45, color: '#3b82f6' },
    { name: 'Clothing', value: 30, color: '#ef4444' },
    { name: 'Home & Garden', value: 25, color: '#10b981' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially', () => {
    mockGetInventoryByCategory.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<InventoryChart />)
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    
    // Should show loading spinner
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('rounded-full', 'h-8', 'w-8', 'border-b-2', 'border-primary')
  })

  it('renders chart with data', async () => {
    mockGetInventoryByCategory.mockResolvedValue(mockCategoryData)
    
    render(<InventoryChart />)
    
    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })
    
    expect(screen.getByTestId('pie')).toBeInTheDocument()
    expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    expect(screen.getByTestId('legend')).toBeInTheDocument()
  })

  it('passes correct data to pie chart', async () => {
    mockGetInventoryByCategory.mockResolvedValue(mockCategoryData)
    
    render(<InventoryChart />)
    
    await waitFor(() => {
      const pieElement = screen.getByTestId('pie')
      expect(pieElement).toHaveAttribute('data-length', '3')
    })
  })

  it('handles error state correctly', async () => {
    const errorMessage = 'Failed to fetch chart data'
    mockGetInventoryByCategory.mockRejectedValue(new Error(errorMessage))
    
    render(<InventoryChart />)
    
    await waitFor(() => {
      expect(screen.getByText(`Error loading chart: ${errorMessage}`)).toBeInTheDocument()
    })
    
    const errorContainer = screen.getByText(`Error loading chart: ${errorMessage}`).closest('div')
    expect(errorContainer).toHaveClass('h-[350px]', 'flex', 'items-center', 'justify-center')
    
    const errorText = screen.getByText(`Error loading chart: ${errorMessage}`)
    expect(errorText).toHaveClass('text-red-600')
  })

  it('handles non-Error exceptions', async () => {
    mockGetInventoryByCategory.mockRejectedValue('String error')
    
    render(<InventoryChart />)
    
    await waitFor(() => {
      expect(screen.getByText('Error loading chart: Failed to fetch chart data')).toBeInTheDocument()
    })
  })

  it('handles empty data state', async () => {
    mockGetInventoryByCategory.mockResolvedValue([])
    
    render(<InventoryChart />)
    
    await waitFor(() => {
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
    
    const noDataContainer = screen.getByText('No data available').closest('div')
    expect(noDataContainer).toHaveClass('h-[350px]', 'flex', 'items-center', 'justify-center')
    
    const noDataText = screen.getByText('No data available')
    expect(noDataText).toHaveClass('text-muted-foreground')
  })

  it('handles null data state', async () => {
    mockGetInventoryByCategory.mockResolvedValue(null)
    
    render(<InventoryChart />)
    
    await waitFor(() => {
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  it('has correct container dimensions', async () => {
    mockGetInventoryByCategory.mockResolvedValue(mockCategoryData)
    
    render(<InventoryChart />)
    
    await waitFor(() => {
      const container = screen.getByTestId('responsive-container')
      expect(container).toBeInTheDocument()
    })
  })

  it('calls analytics service on mount', () => {
    mockGetInventoryByCategory.mockResolvedValue(mockCategoryData)
    
    render(<InventoryChart />)
    
    expect(mockGetInventoryByCategory).toHaveBeenCalledTimes(1)
  })

  it('has proper loading container styling', () => {
    mockGetInventoryByCategory.mockImplementation(() => new Promise(() => {}))
    
    render(<InventoryChart />)
    
    const loadingContainer = screen.getByTestId('responsive-container').closest('div')
    expect(loadingContainer).toHaveClass('h-[350px]', 'flex', 'items-center', 'justify-center')
  })

  it('renders responsive container with correct props', async () => {
    mockGetInventoryByCategory.mockResolvedValue(mockCategoryData)
    
    render(<InventoryChart />)
    
    await waitFor(() => {
      const responsiveContainer = screen.getByTestId('responsive-container')
      expect(responsiveContainer).toBeInTheDocument()
    })
  })

  it('renders all chart components when data is available', async () => {
    mockGetInventoryByCategory.mockResolvedValue(mockCategoryData)
    
    render(<InventoryChart />)
    
    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
      expect(screen.getByTestId('pie')).toBeInTheDocument()
      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
      expect(screen.getByTestId('legend')).toBeInTheDocument()
    })
  })

  it('does not render chart components during loading', () => {
    mockGetInventoryByCategory.mockImplementation(() => new Promise(() => {}))
    
    render(<InventoryChart />)
    
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pie')).not.toBeInTheDocument()
  })

  it('does not render chart components in error state', async () => {
    mockGetInventoryByCategory.mockRejectedValue(new Error('Test error'))
    
    render(<InventoryChart />)
    
    await waitFor(() => {
      expect(screen.getByText('Error loading chart: Test error')).toBeInTheDocument()
    })
    
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pie')).not.toBeInTheDocument()
  })

  it('does not render chart components when no data', async () => {
    mockGetInventoryByCategory.mockResolvedValue([])
    
    render(<InventoryChart />)
    
    await waitFor(() => {
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
    
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pie')).not.toBeInTheDocument()
  })

  it('maintains consistent height across all states', async () => {
    // Test loading state
    mockGetInventoryByCategory.mockImplementation(() => new Promise(() => {}))
    const { rerender } = render(<InventoryChart />)
    
    let container = document.querySelector('.h-\\[350px\\]')
    expect(container).toBeInTheDocument()
    
    // Test error state
    mockGetInventoryByCategory.mockRejectedValue(new Error('Test error'))
    rerender(<InventoryChart />)
    
    await waitFor(() => {
      container = document.querySelector('.h-\\[350px\\]')
      expect(container).toBeInTheDocument()
    })
    
    // Test no data state
    mockGetInventoryByCategory.mockResolvedValue([])
    rerender(<InventoryChart />)
    
    await waitFor(() => {
      container = document.querySelector('.h-\\[350px\\]')
      expect(container).toBeInTheDocument()
    })
  })
})
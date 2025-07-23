import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '../utils/test-render'
import userEvent from '@testing-library/user-event'
import { Dashboard } from '@/components/dashboard/dashboard'

// Mock all dashboard sub-components
vi.mock('@/components/dashboard/metrics-cards', () => ({
  MetricsCards: () => <div data-testid="metrics-cards">Metrics Cards</div>
}))

vi.mock('@/components/dashboard/inventory-chart', () => ({
  InventoryChart: () => <div data-testid="inventory-chart">Inventory Chart</div>
}))

vi.mock('@/components/dashboard/recent-activities', () => ({
  default: () => <div data-testid="recent-activities">Recent Activities</div>
}))

vi.mock('@/components/dashboard/quick-actions', () => ({
  QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>
}))

vi.mock('@/components/dashboard/inventory-turnover-chart', () => ({
  InventoryTurnoverChart: () => <div data-testid="inventory-turnover-chart">Inventory Turnover Chart</div>
}))

vi.mock('@/components/dashboard/sales-velocity-metrics', () => ({
  SalesVelocityMetrics: () => <div data-testid="sales-velocity-metrics">Sales Velocity Metrics</div>
}))

vi.mock('@/components/dashboard/location-performance', () => ({
  LocationPerformance: () => <div data-testid="location-performance">Location Performance</div>
}))

vi.mock('@/components/dashboard/financial-kpis', () => ({
  FinancialKPIs: () => <div data-testid="financial-kpis">Financial KPIs</div>
}))

vi.mock('@/components/dashboard/alerts-panel', () => ({
  AlertsPanel: () => <div data-testid="alerts-panel">Alerts Panel</div>
}))

vi.mock('@/components/cards/card-container', () => ({
  DashboardCards: () => <div data-testid="dashboard-cards">Dashboard Cards</div>
}))

vi.mock('@/components/cards/card-provider', () => ({
  usePageCards: vi.fn()
}))

describe('Dashboard', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders dashboard with main title', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Business Intelligence Dashboard')).toBeInTheDocument()
  })

  it('renders all main dashboard components', () => {
    render(<Dashboard />)
    
    expect(screen.getByTestId('dashboard-cards')).toBeInTheDocument()
    expect(screen.getByTestId('metrics-cards')).toBeInTheDocument()
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument()
  })

  it('renders tabs navigation with all tabs', () => {
    render(<Dashboard />)
    
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Inventory' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Sales' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Locations' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Financial' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Alerts' })).toBeInTheDocument()
  })

  it('shows overview tab content by default', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Inventory Overview')).toBeInTheDocument()
    expect(screen.getByText('Total inventory value and stock levels over time')).toBeInTheDocument()
    expect(screen.getByTestId('inventory-chart')).toBeInTheDocument()
    expect(screen.getByTestId('recent-activities')).toBeInTheDocument()
  })

  it('switches to inventory tab and shows inventory content', async () => {
    render(<Dashboard />)
    
    const inventoryTab = screen.getByRole('tab', { name: 'Inventory' })
    await user.click(inventoryTab)
    
    await waitFor(() => {
      expect(screen.getByTestId('inventory-turnover-chart')).toBeInTheDocument()
    })
  })

  it('switches to sales tab and shows sales content', async () => {
    render(<Dashboard />)
    
    const salesTab = screen.getByRole('tab', { name: 'Sales' })
    await user.click(salesTab)
    
    await waitFor(() => {
      expect(screen.getByTestId('sales-velocity-metrics')).toBeInTheDocument()
    })
  })

  it('switches to locations tab and shows location content', async () => {
    render(<Dashboard />)
    
    const locationsTab = screen.getByRole('tab', { name: 'Locations' })
    await user.click(locationsTab)
    
    await waitFor(() => {
      expect(screen.getByTestId('location-performance')).toBeInTheDocument()
    })
  })

  it('switches to financial tab and shows financial content', async () => {
    render(<Dashboard />)
    
    const financialTab = screen.getByRole('tab', { name: 'Financial' })
    await user.click(financialTab)
    
    await waitFor(() => {
      expect(screen.getByTestId('financial-kpis')).toBeInTheDocument()
    })
  })

  it('switches to alerts tab and shows alerts content', async () => {
    render(<Dashboard />)
    
    const alertsTab = screen.getByRole('tab', { name: 'Alerts' })
    await user.click(alertsTab)
    
    await waitFor(() => {
      expect(screen.getByTestId('alerts-panel')).toBeInTheDocument()
    })
  })

  it('has proper responsive layout classes', () => {
    render(<Dashboard />)
    
    const mainContainer = screen.getByText('Business Intelligence Dashboard').closest('div')
    expect(mainContainer).toHaveClass('flex-1', 'space-y-4', 'p-4', 'md:p-8', 'pt-6')
  })

  it('has proper grid layout for overview content', () => {
    render(<Dashboard />)
    
    const overviewGrid = screen.getByText('Inventory Overview').closest('.grid')
    expect(overviewGrid).toHaveClass('grid', 'gap-4', 'md:grid-cols-2', 'lg:grid-cols-7')
  })

  it('calls usePageCards hook with correct parameters', () => {
    const mockUsePageCards = vi.mocked(require('@/components/cards/card-provider').usePageCards)
    
    render(<Dashboard />)
    
    expect(mockUsePageCards).toHaveBeenCalledWith('dashboard', expect.objectContaining({
      lowStockItems: expect.any(Array),
      recentActivity: expect.any(Array),
      totalItems: 150,
      categories: expect.any(Array),
      criticalAlerts: 3
    }))
  })

  it('has accessible tab navigation', async () => {
    render(<Dashboard />)
    
    const tabList = screen.getByRole('tablist')
    expect(tabList).toBeInTheDocument()
    
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(6)
    
    // Test keyboard navigation
    tabs[0].focus()
    expect(tabs[0]).toHaveFocus()
    
    await user.keyboard('{ArrowRight}')
    expect(tabs[1]).toHaveFocus()
  })

  it('maintains tab state when switching between tabs', async () => {
    render(<Dashboard />)
    
    // Switch to inventory tab
    const inventoryTab = screen.getByRole('tab', { name: 'Inventory' })
    await user.click(inventoryTab)
    
    expect(inventoryTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'false')
    
    // Switch back to overview
    const overviewTab = screen.getByRole('tab', { name: 'Overview' })
    await user.click(overviewTab)
    
    expect(overviewTab).toHaveAttribute('aria-selected', 'true')
    expect(inventoryTab).toHaveAttribute('aria-selected', 'false')
  })
})
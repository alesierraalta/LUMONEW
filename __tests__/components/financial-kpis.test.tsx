import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '../utils/test-render'
import { FinancialKPIs } from '@/components/dashboard/financial-kpis'

// Mock recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: ({ dataKey }: any) => <div data-testid={`line-${dataKey}`} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  Bar: ({ dataKey }: any) => <div data-testid={`bar-${dataKey}`} />,
  Area: ({ dataKey }: any) => <div data-testid={`area-${dataKey}`} />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>
}))

describe('FinancialKPIs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders all KPI metric cards', () => {
    render(<FinancialKPIs />)
    
    expect(screen.getByText('Monthly Recurring Revenue')).toBeInTheDocument()
    expect(screen.getByText('Gross Profit Margin')).toBeInTheDocument()
    expect(screen.getByText('Operating Cash Flow')).toBeInTheDocument()
    expect(screen.getByText('Return on Investment')).toBeInTheDocument()
    expect(screen.getByText('Inventory Turnover')).toBeInTheDocument()
    expect(screen.getByText('Days Sales Outstanding')).toBeInTheDocument()
  })

  it('displays correct KPI values', () => {
    render(<FinancialKPIs />)
    
    expect(screen.getByText('$171K')).toBeInTheDocument()
    expect(screen.getByText('34.5%')).toBeInTheDocument()
    expect(screen.getByText('$67K')).toBeInTheDocument()
    expect(screen.getByText('8.2x')).toBeInTheDocument()
    expect(screen.getByText('28 days')).toBeInTheDocument()
  })

  it('displays correct change indicators', () => {
    render(<FinancialKPIs />)
    
    expect(screen.getByText('+8.2%')).toBeInTheDocument()
    expect(screen.getByText('+1.2%')).toBeInTheDocument()
    expect(screen.getByText('+9.8%')).toBeInTheDocument()
    expect(screen.getByText('+3.7%')).toBeInTheDocument()
    expect(screen.getByText('+0.5x')).toBeInTheDocument()
    expect(screen.getByText('-3 days')).toBeInTheDocument()
  })

  it('displays correct target values', () => {
    render(<FinancialKPIs />)
    
    expect(screen.getByText('Target: $180K')).toBeInTheDocument()
    expect(screen.getByText('Target: 35%')).toBeInTheDocument()
    expect(screen.getByText('Target: $70K')).toBeInTheDocument()
    expect(screen.getByText('Target: 30%')).toBeInTheDocument()
    expect(screen.getByText('Target: 8x')).toBeInTheDocument()
    expect(screen.getByText('Target: 30 days')).toBeInTheDocument()
  })

  it('displays correct descriptions', () => {
    render(<FinancialKPIs />)
    
    expect(screen.getByText('Current month revenue')).toBeInTheDocument()
    expect(screen.getByText('Revenue minus COGS')).toBeInTheDocument()
    expect(screen.getByText('Cash from operations')).toBeInTheDocument()
    expect(screen.getByText('ROI on inventory')).toBeInTheDocument()
    expect(screen.getByText('Annual turnover rate')).toBeInTheDocument()
    expect(screen.getByText('Average collection period')).toBeInTheDocument()
  })

  it('renders trend icons correctly', () => {
    render(<FinancialKPIs />)
    
    // All metrics have upward trend, so should show trending up icons
    const trendIcons = document.querySelectorAll('svg')
    expect(trendIcons.length).toBeGreaterThan(0)
  })

  it('renders revenue and profit trends chart', () => {
    render(<FinancialKPIs />)
    
    expect(screen.getByText('Revenue & Profit Trends')).toBeInTheDocument()
    expect(screen.getByText('Monthly financial performance overview')).toBeInTheDocument()
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
  })

  it('displays revenue and profit growth percentages', () => {
    render(<FinancialKPIs />)
    
    // Should show calculated growth percentages
    const growthElements = screen.getAllByText(/\+\d+\.\d%/)
    expect(growthElements.length).toBeGreaterThan(0)
    
    expect(screen.getByText('Revenue Growth')).toBeInTheDocument()
    expect(screen.getByText('Profit Growth')).toBeInTheDocument()
  })

  it('renders cash flow analysis chart', () => {
    render(<FinancialKPIs />)
    
    expect(screen.getByText('Cash Flow Analysis')).toBeInTheDocument()
    expect(screen.getByText('Operating cash flow and ROI trends')).toBeInTheDocument()
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  })

  it('displays current cash flow information', () => {
    render(<FinancialKPIs />)
    
    expect(screen.getByText('Current Cash Flow')).toBeInTheDocument()
    expect(screen.getByText('$67,000')).toBeInTheDocument()
    expect(screen.getByText('34.5% ROI this month')).toBeInTheDocument()
  })

  it('renders financial ratios section', () => {
    render(<FinancialKPIs />)
    
    expect(screen.getByText('Financial Ratios')).toBeInTheDocument()
    expect(screen.getByText('Key financial health indicators')).toBeInTheDocument()
    
    expect(screen.getByText('Current Ratio')).toBeInTheDocument()
    expect(screen.getByText('Quick Ratio')).toBeInTheDocument()
    expect(screen.getByText('Debt-to-Equity')).toBeInTheDocument()
    expect(screen.getByText('Asset Turnover')).toBeInTheDocument()
    expect(screen.getByText('Profit Margin')).toBeInTheDocument()
  })

  it('displays financial ratio values and benchmarks', () => {
    render(<FinancialKPIs />)
    
    expect(screen.getByText('2.4')).toBeInTheDocument()
    expect(screen.getByText('1.8')).toBeInTheDocument()
    expect(screen.getByText('0.3')).toBeInTheDocument()
    expect(screen.getByText('1.6')).toBeInTheDocument()
    expect(screen.getByText('34.5')).toBeInTheDocument()
    
    expect(screen.getByText('Benchmark: 2')).toBeInTheDocument()
    expect(screen.getByText('Benchmark: 1')).toBeInTheDocument()
    expect(screen.getByText('Benchmark: 0.5')).toBeInTheDocument()
    expect(screen.getByText('Benchmark: 1.2')).toBeInTheDocument()
    expect(screen.getByText('Benchmark: 25')).toBeInTheDocument()
  })

  it('displays financial ratio status badges', () => {
    render(<FinancialKPIs />)
    
    expect(screen.getByText('good')).toBeInTheDocument()
    expect(screen.getAllByText('excellent')).toHaveLength(3)
  })

  it('renders expense breakdown section', () => {
    render(<FinancialKPIs />)
    
    expect(screen.getByText('Expense Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Current month expense distribution')).toBeInTheDocument()
    
    expect(screen.getByText('Cost of Goods')).toBeInTheDocument()
    expect(screen.getByText('Personnel')).toBeInTheDocument()
    expect(screen.getByText('Operations')).toBeInTheDocument()
    expect(screen.getByText('Marketing')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('displays expense amounts and percentages', () => {
    render(<FinancialKPIs />)
    
    expect(screen.getByText('$67,200')).toBeInTheDocument()
    expect(screen.getByText('$22,400')).toBeInTheDocument()
    expect(screen.getByText('$11,200')).toBeInTheDocument()
    expect(screen.getByText('$6,720')).toBeInTheDocument()
    expect(screen.getByText('$4,480')).toBeInTheDocument()
    
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.getByText('6%')).toBeInTheDocument()
    expect(screen.getByText('4%')).toBeInTheDocument()
  })

  it('displays total expenses', () => {
    render(<FinancialKPIs />)
    
    expect(screen.getByText('Total Expenses')).toBeInTheDocument()
    expect(screen.getByText('$112,000')).toBeInTheDocument()
  })

  it('has proper responsive grid layout', () => {
    render(<FinancialKPIs />)
    
    // Check for grid layouts
    const gridContainers = document.querySelectorAll('.grid')
    expect(gridContainers.length).toBeGreaterThan(0)
    
    // Check for responsive classes
    const responsiveElements = document.querySelectorAll('[class*="md:grid-cols"]')
    expect(responsiveElements.length).toBeGreaterThan(0)
  })

  it('renders all chart components', () => {
    render(<FinancialKPIs />)
    
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    expect(screen.getByTestId('bar-expenses')).toBeInTheDocument()
    expect(screen.getByTestId('line-revenue')).toBeInTheDocument()
    expect(screen.getByTestId('line-profit')).toBeInTheDocument()
    expect(screen.getByTestId('area-cashFlow')).toBeInTheDocument()
  })

  it('has proper card structure for all sections', () => {
    render(<FinancialKPIs />)
    
    // Check for card headers and content
    const cardHeaders = document.querySelectorAll('[class*="CardHeader"]')
    const cardContents = document.querySelectorAll('[class*="CardContent"]')
    
    expect(cardHeaders.length).toBeGreaterThan(0)
    expect(cardContents.length).toBeGreaterThan(0)
  })

  it('displays color indicators for expense categories', () => {
    render(<FinancialKPIs />)
    
    // Should have colored dots for each expense category
    const colorDots = document.querySelectorAll('.w-4.h-4.rounded-full')
    expect(colorDots.length).toBe(5) // 5 expense categories
  })

  it('has proper spacing and layout structure', () => {
    render(<FinancialKPIs />)
    
    const mainContainer = screen.getByText('Monthly Recurring Revenue').closest('.space-y-6')
    expect(mainContainer).toBeInTheDocument()
  })

  it('displays icons for different sections', () => {
    render(<FinancialKPIs />)
    
    // Should have icons for different sections
    const icons = document.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(10) // Multiple icons throughout the component
  })

  it('has proper badge styling for trends and ratios', () => {
    render(<FinancialKPIs />)
    
    // Check for badge elements
    const badges = document.querySelectorAll('[class*="Badge"]')
    expect(badges.length).toBeGreaterThan(0)
  })
})
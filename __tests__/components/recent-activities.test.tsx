import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '../utils/test-render'
import RecentActivities from '@/components/dashboard/recent-activities'
import { createMockAuditLogs } from '../utils/mock-data'

// Mock the audit service
const mockGetRecentLogs = vi.fn()
vi.mock('@/lib/audit', () => ({
  auditService: {
    getRecentLogs: mockGetRecentLogs
  }
}))

// Mock timers for interval testing
vi.useFakeTimers()

describe('RecentActivities', () => {
  const mockAuditLogs = createMockAuditLogs(5).map((log, index) => ({
    ...log,
    operation: ['INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'BULK_OPERATION'][index % 5] as any,
    table_name: ['inventory', 'users', 'categories', 'locations', 'inventory'][index % 5],
    metadata: {
      action_type: ['inventory_item_created', 'user_updated', 'category_deleted', 'location_created', 'bulk_inventory_update'][index % 5],
      notes: index === 0 ? 'Item: Test Product (SKU: TEST-001)' : undefined,
      stock_change: index === 1 ? { from: 10, to: 15, difference: 5 } : undefined,
      total_items: index === 4 ? 10 : undefined,
      successful_items: index === 4 ? 8 : undefined,
      bulk_operation_id: index === 4 ? 'bulk-123' : undefined
    }
  }))

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllTimers()
  })

  it('renders loading state initially', () => {
    mockGetRecentLogs.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<RecentActivities />)
    
    expect(screen.getByText('Actividades Recientes')).toBeInTheDocument()
    expect(screen.getByText('Últimas acciones realizadas en el sistema')).toBeInTheDocument()
    
    // Should show 5 skeleton items
    const skeletonItems = document.querySelectorAll('.animate-pulse')
    expect(skeletonItems.length).toBeGreaterThan(0)
  })

  it('renders activities with data', async () => {
    mockGetRecentLogs.mockResolvedValue(mockAuditLogs)
    
    render(<RecentActivities />)
    
    await waitFor(() => {
      expect(screen.getByText('Actividades Recientes')).toBeInTheDocument()
    })
    
    // Should show activity items
    expect(screen.getByText('Artículo de inventario creado')).toBeInTheDocument()
    expect(screen.getByText('Usuario actualizado')).toBeInTheDocument()
    expect(screen.getByText('Categoría eliminada')).toBeInTheDocument()
  })

  it('displays correct operation descriptions', async () => {
    mockGetRecentLogs.mockResolvedValue(mockAuditLogs)
    
    render(<RecentActivities />)
    
    await waitFor(() => {
      expect(screen.getByText('Artículo de inventario creado')).toBeInTheDocument()
      expect(screen.getByText('Usuario actualizado')).toBeInTheDocument()
      expect(screen.getByText('Categoría eliminada')).toBeInTheDocument()
      expect(screen.getByText('Ubicación creada')).toBeInTheDocument()
      expect(screen.getByText('Actualización masiva de inventario')).toBeInTheDocument()
    })
  })

  it('displays operation badges', async () => {
    mockGetRecentLogs.mockResolvedValue(mockAuditLogs)
    
    render(<RecentActivities />)
    
    await waitFor(() => {
      expect(screen.getByText('INSERT')).toBeInTheDocument()
      expect(screen.getByText('UPDATE')).toBeInTheDocument()
      expect(screen.getByText('DELETE')).toBeInTheDocument()
      expect(screen.getByText('LOGIN')).toBeInTheDocument()
      expect(screen.getByText('BULK_OPERATION')).toBeInTheDocument()
    })
  })

  it('displays entity names correctly', async () => {
    mockGetRecentLogs.mockResolvedValue(mockAuditLogs)
    
    render(<RecentActivities />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })
  })

  it('displays time ago information', async () => {
    mockGetRecentLogs.mockResolvedValue(mockAuditLogs)
    
    render(<RecentActivities />)
    
    await waitFor(() => {
      // Should show time ago text (the exact text depends on the mock data timestamps)
      const timeElements = screen.getAllByText(/Hace/)
      expect(timeElements.length).toBeGreaterThan(0)
    })
  })

  it('displays user information', async () => {
    mockGetRecentLogs.mockResolvedValue(mockAuditLogs)
    
    render(<RecentActivities />)
    
    await waitFor(() => {
      // Should show user ID information
      const userElements = screen.getAllByText(/Usuario:/)
      expect(userElements.length).toBeGreaterThan(0)
    })
  })

  it('displays stock change information', async () => {
    mockGetRecentLogs.mockResolvedValue(mockAuditLogs)
    
    render(<RecentActivities />)
    
    await waitFor(() => {
      expect(screen.getByText('Stock: 10 → 15 (+5)')).toBeInTheDocument()
    })
  })

  it('displays bulk operation information', async () => {
    mockGetRecentLogs.mockResolvedValue(mockAuditLogs)
    
    render(<RecentActivities />)
    
    await waitFor(() => {
      expect(screen.getByText('8/10 elementos procesados')).toBeInTheDocument()
      expect(screen.getByText('Operación masiva')).toBeInTheDocument()
    })
  })

  it('handles error state correctly', async () => {
    const errorMessage = 'Error al cargar las actividades recientes'
    mockGetRecentLogs.mockRejectedValue(new Error('Test error'))
    
    render(<RecentActivities />)
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
    
    const errorText = screen.getByText(errorMessage)
    expect(errorText).toHaveClass('text-center', 'py-4', 'text-red-600')
  })

  it('handles empty activities state', async () => {
    mockGetRecentLogs.mockResolvedValue([])
    
    render(<RecentActivities />)
    
    await waitFor(() => {
      expect(screen.getByText('No hay actividades recientes')).toBeInTheDocument()
    })
    
    const noActivitiesText = screen.getByText('No hay actividades recientes')
    expect(noActivitiesText.closest('div')).toHaveClass('text-center', 'py-8', 'text-gray-500')
  })

  it('displays "Ver historial completo" link', async () => {
    mockGetRecentLogs.mockResolvedValue(mockAuditLogs)
    
    render(<RecentActivities />)
    
    await waitFor(() => {
      const link = screen.getByText('Ver historial completo →')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/audit')
      expect(link).toHaveClass('text-sm', 'text-blue-600', 'hover:text-blue-800', 'font-medium')
    })
  })

  it('calls audit service on mount', () => {
    mockGetRecentLogs.mockResolvedValue(mockAuditLogs)
    
    render(<RecentActivities />)
    
    expect(mockGetRecentLogs).toHaveBeenCalledTimes(1)
    expect(mockGetRecentLogs).toHaveBeenCalledWith(10)
  })

  it('sets up refresh interval', async () => {
    mockGetRecentLogs.mockResolvedValue(mockAuditLogs)
    
    render(<RecentActivities />)
    
    // Initial call
    expect(mockGetRecentLogs).toHaveBeenCalledTimes(1)
    
    // Fast-forward 30 seconds
    vi.advanceTimersByTime(30000)
    
    // Should call again
    expect(mockGetRecentLogs).toHaveBeenCalledTimes(2)
  })

  it('cleans up interval on unmount', async () => {
    mockGetRecentLogs.mockResolvedValue(mockAuditLogs)
    
    const { unmount } = render(<RecentActivities />)
    
    expect(mockGetRecentLogs).toHaveBeenCalledTimes(1)
    
    unmount()
    
    // Fast-forward 30 seconds after unmount
    vi.advanceTimersByTime(30000)
    
    // Should not call again
    expect(mockGetRecentLogs).toHaveBeenCalledTimes(1)
  })

  it('has proper card structure', async () => {
    mockGetRecentLogs.mockResolvedValue(mockAuditLogs)
    
    render(<RecentActivities />)
    
    await waitFor(() => {
      expect(screen.getByText('Actividades Recientes')).toBeInTheDocument()
    })
    
    // Check card structure
    const cardTitle = screen.getByText('Actividades Recientes')
    expect(cardTitle.closest('[class*="CardHeader"]')).toBeInTheDocument()
    
    const cardContent = document.querySelector('[class*="CardContent"]')
    expect(cardContent).toBeInTheDocument()
  })

  it('displays activity icons correctly', async () => {
    mockGetRecentLogs.mockResolvedValue(mockAuditLogs)
    
    render(<RecentActivities />)
    
    await waitFor(() => {
      // Should have operation icons and table icons
      const icons = document.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  it('has proper hover effects on activity items', async () => {
    mockGetRecentLogs.mockResolvedValue(mockAuditLogs)
    
    render(<RecentActivities />)
    
    await waitFor(() => {
      const activityItems = document.querySelectorAll('.hover\\:bg-gray-100\\/50')
      expect(activityItems.length).toBeGreaterThan(0)
    })
  })

  it('formats time correctly for different periods', async () => {
    const now = new Date()
    const recentLogs = [
      {
        ...mockAuditLogs[0],
        created_at: new Date(now.getTime() - 30 * 1000).toISOString() // 30 seconds ago
      },
      {
        ...mockAuditLogs[1],
        created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      },
      {
        ...mockAuditLogs[2],
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        ...mockAuditLogs[3],
        created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      }
    ]
    
    mockGetRecentLogs.mockResolvedValue(recentLogs)
    
    render(<RecentActivities />)
    
    await waitFor(() => {
      expect(screen.getByText('Hace unos segundos')).toBeInTheDocument()
      expect(screen.getByText('Hace 30 minutos')).toBeInTheDocument()
      expect(screen.getByText('Hace 2 horas')).toBeInTheDocument()
      expect(screen.getByText('Hace 2 días')).toBeInTheDocument()
    })
  })
})
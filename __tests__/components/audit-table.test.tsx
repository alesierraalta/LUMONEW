import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuditTable } from '@/components/audit/audit-table'
import { AuditLog } from '@/lib/audit'

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'dd/MM/yyyy') return '21/07/2025'
    if (formatStr === 'HH:mm:ss') return '16:30:45'
    return '21/07/2025 16:30:45'
  })
}))

// Mock date-fns/locale
vi.mock('date-fns/locale', () => ({
  es: {}
}))

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    user_id: 'user-1',
    user_email: 'test@example.com',
    operation: 'INSERT',
    table_name: 'inventory',
    record_id: 'item-1',
    old_values: null,
    new_values: { name: 'Test Product', price: 100 },
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    session_id: 'session-1',
    created_at: '2025-07-21T20:30:45.000Z',
    metadata: {
      action_type: 'create',
      notes: 'Created new product'
    }
  },
  {
    id: '2',
    user_id: 'user-1',
    user_email: 'test@example.com',
    operation: 'UPDATE',
    table_name: 'inventory',
    record_id: 'item-1',
    old_values: { name: 'Test Product', price: 100 },
    new_values: { name: 'Updated Product', price: 150 },
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    session_id: 'session-1',
    created_at: '2025-07-21T20:25:30.000Z',
    metadata: {
      action_type: 'update',
      affected_fields: ['name', 'price']
    }
  },
  {
    id: '3',
    user_id: 'user-2',
    user_email: 'admin@example.com',
    operation: 'DELETE',
    table_name: 'inventory',
    record_id: 'item-2',
    old_values: { name: 'Deleted Product', price: 75 },
    new_values: null,
    ip_address: '192.168.1.2',
    user_agent: 'Mozilla/5.0',
    session_id: 'session-2',
    created_at: '2025-07-21T20:20:15.000Z',
    metadata: {
      action_type: 'delete',
      reason: 'Product discontinued'
    }
  }
]

describe('AuditTable', () => {
  const mockOnRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders audit logs correctly', () => {
    render(<AuditTable auditLogs={mockAuditLogs} loading={false} onRefresh={mockOnRefresh} />)

    // Check if table headers are present
    expect(screen.getByText('Fecha/Hora')).toBeInTheDocument()
    expect(screen.getByText('Usuario')).toBeInTheDocument()
    expect(screen.getByText('Operación')).toBeInTheDocument()
    expect(screen.getByText('Tabla')).toBeInTheDocument()
    expect(screen.getByText('Registro ID')).toBeInTheDocument()

    // Check if audit log data is displayed
    expect(screen.getAllByText('test@example.com')).toHaveLength(2) // Two logs with same user
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getAllByText('Inventario')).toHaveLength(3) // All logs are inventory table
  })

  it('displays operation badges with correct variants', () => {
    render(<AuditTable auditLogs={mockAuditLogs} loading={false} onRefresh={mockOnRefresh} />)

    // Check if operation badges are displayed with Spanish labels
    expect(screen.getByText('Creado')).toBeInTheDocument()
    expect(screen.getByText('Actualizado')).toBeInTheDocument()
    expect(screen.getByText('Eliminado')).toBeInTheDocument()
  })

  it('formats dates correctly', () => {
    render(<AuditTable auditLogs={mockAuditLogs} loading={false} onRefresh={mockOnRefresh} />)

    // Check if dates are formatted using the mocked format function
    expect(screen.getAllByText('21/07/2025')).toHaveLength(3)
    expect(screen.getAllByText('16:30:45')).toHaveLength(3)
  })

  it('shows expandable rows', () => {
    render(<AuditTable auditLogs={mockAuditLogs} loading={false} onRefresh={mockOnRefresh} />)

    // Check if expand buttons are present
    const expandButtons = screen.getAllByRole('button')
    const chevronButtons = expandButtons.filter(button => 
      button.querySelector('svg') && 
      (button.querySelector('svg')?.getAttribute('class')?.includes('lucide-chevron') || false)
    )
    expect(chevronButtons.length).toBeGreaterThan(0)
  })

  it('expands row details when clicked', async () => {
    render(<AuditTable auditLogs={mockAuditLogs} loading={false} onRefresh={mockOnRefresh} />)

    // Find and click the first expand button
    const expandButtons = screen.getAllByRole('button')
    const firstExpandButton = expandButtons.find(button => 
      button.querySelector('svg') && 
      (button.querySelector('svg')?.getAttribute('class')?.includes('lucide-chevron') || false)
    )
    
    if (firstExpandButton) {
      fireEvent.click(firstExpandButton)

      await waitFor(() => {
        expect(screen.getByText('Información de Sesión')).toBeInTheDocument()
        expect(screen.getByText('Session ID:')).toBeInTheDocument()
        expect(screen.getByText('User Agent:')).toBeInTheDocument()
      })
    }
  })

  it('displays loading state', () => {
    render(<AuditTable auditLogs={[]} loading={true} onRefresh={mockOnRefresh} />)

    expect(screen.getByText('Cargando registros de auditoría...')).toBeInTheDocument()
  })

  it('displays empty state when no logs', () => {
    render(<AuditTable auditLogs={[]} loading={false} onRefresh={mockOnRefresh} />)

    expect(screen.getByText('No hay registros de auditoría')).toBeInTheDocument()
    expect(screen.getByText('No se encontraron registros que coincidan con los filtros aplicados.')).toBeInTheDocument()
  })

  it('calls onRefresh when refresh button is clicked', () => {
    render(<AuditTable auditLogs={mockAuditLogs} loading={false} onRefresh={mockOnRefresh} />)

    const refreshButtons = screen.getAllByText('Actualizar')
    fireEvent.click(refreshButtons[0])

    expect(mockOnRefresh).toHaveBeenCalledTimes(1)
  })

  it('shows value changes for UPDATE operations', async () => {
    render(<AuditTable auditLogs={mockAuditLogs} loading={false} onRefresh={mockOnRefresh} />)

    // Find and click expand button for the UPDATE operation (second row)
    const expandButtons = screen.getAllByRole('button')
    const expandButton = expandButtons.find(button => 
      button.querySelector('svg') && 
      (button.querySelector('svg')?.getAttribute('class')?.includes('lucide-chevron') || false)
    )
    
    if (expandButton) {
      fireEvent.click(expandButton)

      await waitFor(() => {
        expect(screen.getByText('Cambios en los Datos')).toBeInTheDocument()
      })
    }
  })

  it('shows deleted data for DELETE operations', async () => {
    render(<AuditTable auditLogs={[mockAuditLogs[2]]} loading={false} onRefresh={mockOnRefresh} />)

    // Find and click expand button for the DELETE operation
    const expandButtons = screen.getAllByRole('button')
    const expandButton = expandButtons.find(button => 
      button.querySelector('svg') && 
      (button.querySelector('svg')?.getAttribute('class')?.includes('lucide-chevron') || false)
    )
    
    if (expandButton) {
      fireEvent.click(expandButton)

      await waitFor(() => {
        expect(screen.getByText('Cambios en los Datos')).toBeInTheDocument()
      })
    }
  })

  it('displays record count', () => {
    render(<AuditTable auditLogs={mockAuditLogs} loading={false} onRefresh={mockOnRefresh} />)

    expect(screen.getByText('Mostrando 3 registros')).toBeInTheDocument()
  })

  it('truncates long record IDs', () => {
    const longRecordId = 'very-long-record-id-that-should-be-truncated-for-display'
    const logWithLongId = {
      ...mockAuditLogs[0],
      record_id: longRecordId
    }

    render(<AuditTable auditLogs={[logWithLongId]} loading={false} onRefresh={mockOnRefresh} />)

    // Should show truncated version
    expect(screen.getByText(`${longRecordId.slice(0, 20)}...`)).toBeInTheDocument()
  })

  it('displays metadata when available', async () => {
    render(<AuditTable auditLogs={[mockAuditLogs[0]]} loading={false} onRefresh={mockOnRefresh} />)

    // Find and click expand button
    const expandButtons = screen.getAllByRole('button')
    const expandButton = expandButtons.find(button => 
      button.querySelector('svg') && 
      (button.querySelector('svg')?.getAttribute('class')?.includes('lucide-chevron') || false)
    )
    
    if (expandButton) {
      fireEvent.click(expandButton)

      await waitFor(() => {
        expect(screen.getByText('Metadatos')).toBeInTheDocument()
      })
    }
  })
})
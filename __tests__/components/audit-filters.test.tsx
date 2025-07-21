import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuditFilters } from '@/components/audit/audit-filters'
import { FilterOptions } from '@/lib/types'

// Mock scrollIntoView to avoid JSDOM issues with Radix UI
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
})

describe('AuditFilters', () => {
  const mockOnFiltersChange = vi.fn()
  const defaultFilters: FilterOptions = {}

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search input correctly', () => {
    render(<AuditFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)

    const searchInput = screen.getByPlaceholderText('Buscar en registros...')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveAttribute('id', 'search')
  })

  it('renders all filter labels correctly', () => {
    render(<AuditFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)

    expect(screen.getByText('Buscar')).toBeInTheDocument()
    expect(screen.getByText('Acción')).toBeInTheDocument()
    expect(screen.getByText('Tipo de Entidad')).toBeInTheDocument()
    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('Fecha de Inicio')).toBeInTheDocument()
    expect(screen.getByText('Fecha de Fin')).toBeInTheDocument()
  })

  it('renders select placeholders correctly', () => {
    render(<AuditFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)

    expect(screen.getByText('Todas las acciones')).toBeInTheDocument()
    expect(screen.getByText('Todos los tipos')).toBeInTheDocument()
    expect(screen.getByText('Todos los estados')).toBeInTheDocument()
  })

  it('calls onFiltersChange when search input changes', async () => {
    render(<AuditFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)

    const searchInput = screen.getByPlaceholderText('Buscar en registros...')
    fireEvent.change(searchInput, { target: { value: 'test search' } })

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: 'test search'
      })
    })
  })

  it('handles date range inputs correctly', () => {
    render(<AuditFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)

    const startDateInput = screen.getByLabelText('Fecha de Inicio')
    const endDateInput = screen.getByLabelText('Fecha de Fin')

    expect(startDateInput).toHaveAttribute('type', 'datetime-local')
    expect(endDateInput).toHaveAttribute('type', 'datetime-local')
    expect(startDateInput).toHaveAttribute('id', 'start-date')
    expect(endDateInput).toHaveAttribute('id', 'end-date')
  })

  it('calls onFiltersChange when start date changes', async () => {
    render(<AuditFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)

    const startDateInput = screen.getByLabelText('Fecha de Inicio')
    fireEvent.change(startDateInput, { target: { value: '2025-07-21T10:00' } })

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: expect.objectContaining({
            start: expect.any(Date)
          })
        })
      )
    })
  })

  it('calls onFiltersChange when end date changes', async () => {
    render(<AuditFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)

    const endDateInput = screen.getByLabelText('Fecha de Fin')
    fireEvent.change(endDateInput, { target: { value: '2025-07-21T18:00' } })

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: expect.objectContaining({
            end: expect.any(Date)
          })
        })
      )
    })
  })

  it('displays clear filters button', () => {
    render(<AuditFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)

    const clearButton = screen.getByText('Limpiar Filtros')
    expect(clearButton).toBeInTheDocument()
    expect(clearButton).toBeDisabled() // Should be disabled when no filters are active
  })

  it('enables clear filters button when filters are active', () => {
    const filtersWithSearch: FilterOptions = { search: 'test' }
    render(<AuditFilters filters={filtersWithSearch} onFiltersChange={mockOnFiltersChange} />)

    const clearButton = screen.getByText('Limpiar Filtros')
    expect(clearButton).not.toBeDisabled()
  })

  it('clears all filters when clear button is clicked', async () => {
    const filtersWithData: FilterOptions = { 
      search: 'test',
      status: 'active',
      category: 'item'
    }
    render(<AuditFilters filters={filtersWithData} onFiltersChange={mockOnFiltersChange} />)

    const clearButton = screen.getByText('Limpiar Filtros')
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({})
    })
  })

  it('shows active filters indicator when filters are applied', () => {
    const filtersWithData: FilterOptions = { search: 'test' }
    render(<AuditFilters filters={filtersWithData} onFiltersChange={mockOnFiltersChange} />)

    expect(screen.getByText('Filtros activos aplicados')).toBeInTheDocument()
  })

  it('does not show active filters indicator when no filters are applied', () => {
    render(<AuditFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)

    expect(screen.queryByText('Filtros activos aplicados')).not.toBeInTheDocument()
  })

  it('preserves existing filters when updating search', async () => {
    const existingFilters: FilterOptions = { 
      search: 'existing search',
      status: 'active'
    }
    render(<AuditFilters filters={existingFilters} onFiltersChange={mockOnFiltersChange} />)

    const searchInput = screen.getByDisplayValue('existing search')
    fireEvent.change(searchInput, { target: { value: 'new search' } })

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: 'new search',
        status: 'active'
      })
    })
  })

  it('displays search input with existing value', () => {
    const filtersWithSearch: FilterOptions = { search: 'existing search' }
    render(<AuditFilters filters={filtersWithSearch} onFiltersChange={mockOnFiltersChange} />)

    const searchInput = screen.getByDisplayValue('existing search')
    expect(searchInput).toBeInTheDocument()
  })

  it('formats date values correctly for datetime-local inputs', () => {
    const filtersWithDateRange: FilterOptions = {
      dateRange: {
        start: new Date('2025-07-21T10:00:00'),
        end: new Date('2025-07-21T18:00:00')
      }
    }
    render(<AuditFilters filters={filtersWithDateRange} onFiltersChange={mockOnFiltersChange} />)

    const startDateInput = screen.getByLabelText('Fecha de Inicio')
    const endDateInput = screen.getByLabelText('Fecha de Fin')

    // Check that the inputs have some value (exact format may vary due to timezone handling)
    expect((startDateInput as HTMLInputElement).value).toContain('2025-07-21')
    expect((endDateInput as HTMLInputElement).value).toContain('2025-07-21')
  })

  it('handles empty date range gracefully', () => {
    const filtersWithEmptyDateRange: FilterOptions = {
      dateRange: undefined
    }
    render(<AuditFilters filters={filtersWithEmptyDateRange} onFiltersChange={mockOnFiltersChange} />)

    const startDateInput = screen.getByLabelText('Fecha de Inicio')
    const endDateInput = screen.getByLabelText('Fecha de Fin')

    expect(startDateInput).toHaveValue('')
    expect(endDateInput).toHaveValue('')
  })

  it('creates proper date range when start date is set', async () => {
    render(<AuditFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)

    const startDateInput = screen.getByLabelText('Fecha de Inicio')
    fireEvent.change(startDateInput, { target: { value: '2025-07-21T10:00' } })

    await waitFor(() => {
      const call = mockOnFiltersChange.mock.calls[0][0]
      expect(call.dateRange).toBeDefined()
      expect(call.dateRange.start).toBeInstanceOf(Date)
      expect(call.dateRange.end).toBeInstanceOf(Date)
    })
  })

  it('updates existing date range when end date is changed', async () => {
    const filtersWithStartDate: FilterOptions = {
      dateRange: {
        start: new Date('2025-07-20T10:00'),
        end: new Date('2025-07-21T18:00')
      }
    }
    render(<AuditFilters filters={filtersWithStartDate} onFiltersChange={mockOnFiltersChange} />)

    const endDateInput = screen.getByLabelText('Fecha de Fin')
    fireEvent.change(endDateInput, { target: { value: '2025-07-22T20:00' } })

    await waitFor(() => {
      const call = mockOnFiltersChange.mock.calls[0][0]
      expect(call.dateRange.start).toEqual(new Date('2025-07-20T10:00'))
      expect(call.dateRange.end).toEqual(new Date('2025-07-22T20:00'))
    })
  })

  it('renders all select components as comboboxes', () => {
    render(<AuditFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />)

    const comboboxes = screen.getAllByRole('combobox')
    expect(comboboxes).toHaveLength(3) // Action, Entity Type, Status
  })

  it('handles complex filter combinations', () => {
    const complexFilters: FilterOptions = {
      search: 'test product',
      status: 'active',
      category: 'item',
      location: 'success',
      dateRange: {
        start: new Date('2025-07-20T10:00'),
        end: new Date('2025-07-21T18:00')
      }
    }
    render(<AuditFilters filters={complexFilters} onFiltersChange={mockOnFiltersChange} />)

    expect(screen.getByDisplayValue('test product')).toBeInTheDocument()
    expect(screen.getByText('Filtros activos aplicados')).toBeInTheDocument()
    expect(screen.getByText('Limpiar Filtros')).not.toBeDisabled()
  })
})
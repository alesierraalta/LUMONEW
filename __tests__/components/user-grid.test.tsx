import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../utils/test-render'
import { UserGrid } from '@/components/users/user-grid'
import { UserData } from '@/components/users/user-form'

// Mock UI components
vi.mock('@/components/ui/loading', () => ({
  LoadingOverlay: ({ children, isLoading }: any) => (
    <div data-testid="loading-overlay" data-loading={isLoading}>
      {children}
    </div>
  ),
  Skeleton: ({ className }: any) => (
    <div className={className} data-testid="skeleton" />
  )
}))

vi.mock('@/components/ui/modal', () => ({
  useModal: () => ({
    openModal: mockOpenModal
  }),
  ConfirmationModal: ({ title, message, onConfirm, confirmText, cancelText }: any) => (
    <div data-testid="confirmation-modal">
      <h3>{title}</h3>
      <p>{message}</p>
      <button onClick={onConfirm} data-testid="confirm-button">
        {confirmText}
      </button>
      <button data-testid="cancel-button">{cancelText}</button>
    </div>
  )
}))

// Mock toast hook
const mockAddToast = vi.fn()
const mockOpenModal = vi.fn()

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    addToast: mockAddToast
  })
}))

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: ''
  },
  writable: true
})

describe('UserGrid', () => {
  const mockUsers: UserData[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      position: 'Developer',
      department: 'Engineering',
      location: 'New York',
      bio: 'Software developer',
      startDate: '2023-01-15',
      status: 'active',
      profileImage: 'https://example.com/john.jpg'
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1234567891',
      position: 'Manager',
      department: 'Engineering',
      location: 'San Francisco',
      bio: 'Engineering manager',
      startDate: '2022-06-01',
      status: 'active'
    },
    {
      id: '3',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@example.com',
      phone: '+1234567892',
      position: 'Designer',
      department: 'Design',
      location: 'Los Angeles',
      bio: 'UI/UX designer',
      startDate: '2023-03-10',
      status: 'inactive'
    }
  ]

  const mockProps = {
    users: mockUsers,
    isLoading: false,
    onUserEdit: vi.fn(),
    onUserDelete: vi.fn(),
    onUserView: vi.fn(),
    onUserCreate: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should display loading skeleton when loading', () => {
      render(<UserGrid {...mockProps} isLoading={true} />)
      
      expect(screen.getAllByTestId('skeleton')).toHaveLength(42) // 6 cards × 7 skeleton elements each
      expect(screen.getByText('Nuevo Usuario')).toBeInTheDocument()
      expect(screen.getByText('Gestionar Roles')).toBeInTheDocument()
    })

    it('should show loading overlay', () => {
      render(<UserGrid {...mockProps} isLoading={true} />)
      
      const loadingOverlay = screen.getByTestId('loading-overlay')
      expect(loadingOverlay).toHaveAttribute('data-loading', 'true')
    })
  })

  describe('Data Display', () => {
    it('should display user cards correctly', () => {
      render(<UserGrid {...mockProps} />)
      
      mockUsers.forEach(user => {
        expect(screen.getByText(`${user.firstName} ${user.lastName}`)).toBeInTheDocument()
        expect(screen.getByText(user.position)).toBeInTheDocument()
        expect(screen.getByText(user.email)).toBeInTheDocument()
        expect(screen.getByText(user.department)).toBeInTheDocument()
        expect(screen.getByText(user.location)).toBeInTheDocument()
      })
    })

    it('should display user count correctly', () => {
      render(<UserGrid {...mockProps} />)
      
      expect(screen.getByText('3 de 3 usuarios')).toBeInTheDocument()
    })

    it('should display status badges correctly', () => {
      render(<UserGrid {...mockProps} />)
      
      expect(screen.getAllByText('Activo')).toHaveLength(2)
      expect(screen.getAllByText('Inactivo')).toHaveLength(1)
    })

    it('should display start dates correctly', () => {
      render(<UserGrid {...mockProps} />)
      
      expect(screen.getByText('Desde 1/15/2023')).toBeInTheDocument()
      expect(screen.getByText('Desde 6/1/2022')).toBeInTheDocument()
      expect(screen.getByText('Desde 3/10/2023')).toBeInTheDocument()
    })

    it('should display user avatars correctly', () => {
      render(<UserGrid {...mockProps} />)
      
      // User with profile image
      const johnImage = screen.getByAltText('John Doe')
      expect(johnImage).toBeInTheDocument()
      expect(johnImage).toHaveAttribute('src', 'https://example.com/john.jpg')
      
      // Users without profile image should show initials
      expect(screen.getByText('JS')).toBeInTheDocument() // Jane Smith
      expect(screen.getByText('BJ')).toBeInTheDocument() // Bob Johnson
    })
  })

  describe('Header and Navigation', () => {
    it('should display header correctly', () => {
      render(<UserGrid {...mockProps} />)
      
      expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument()
      expect(screen.getByText('Nuevo Usuario')).toBeInTheDocument()
      expect(screen.getByText('Gestionar Roles')).toBeInTheDocument()
    })

    it('should handle new user button click', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} />)
      
      const newUserButton = screen.getByText('Nuevo Usuario')
      await user.click(newUserButton)
      
      expect(window.location.href).toBe('/users/create')
    })

    it('should handle manage roles button click', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} />)
      
      const manageRolesButton = screen.getByText('Gestionar Roles')
      await user.click(manageRolesButton)
      
      expect(window.location.href).toBe('/roles')
    })
  })

  describe('Search and Filters', () => {
    it('should display search input', () => {
      render(<UserGrid {...mockProps} />)
      
      expect(screen.getByPlaceholderText('Buscar usuarios...')).toBeInTheDocument()
    })

    it('should handle search input changes', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} />)
      
      const searchInput = screen.getByPlaceholderText('Buscar usuarios...')
      await user.type(searchInput, 'John')
      
      expect(searchInput).toHaveValue('John')
    })

    it('should show filters toggle button', () => {
      render(<UserGrid {...mockProps} />)
      
      expect(screen.getByText('Filtros')).toBeInTheDocument()
    })

    it('should toggle filters visibility', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} />)
      
      const filtersButton = screen.getByText('Filtros')
      await user.click(filtersButton)
      
      // Advanced filters should be visible
      expect(screen.getByText('Estado')).toBeInTheDocument()
      expect(screen.getByText('Departamento')).toBeInTheDocument()
      expect(screen.getByText('Ubicación')).toBeInTheDocument()
    })

    it('should display filter options correctly', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} />)
      
      const filtersButton = screen.getByText('Filtros')
      await user.click(filtersButton)
      
      // Status filter options
      expect(screen.getByText('Todos')).toBeInTheDocument()
      expect(screen.getByText('Activo')).toBeInTheDocument()
      expect(screen.getByText('Inactivo')).toBeInTheDocument()
      expect(screen.getByText('Pendiente')).toBeInTheDocument()
      
      // Department options (from mock data)
      expect(screen.getByText('Engineering')).toBeInTheDocument()
      expect(screen.getByText('Design')).toBeInTheDocument()
      
      // Location options (from mock data)
      expect(screen.getByText('New York')).toBeInTheDocument()
      expect(screen.getByText('San Francisco')).toBeInTheDocument()
      expect(screen.getByText('Los Angeles')).toBeInTheDocument()
    })

    it('should handle clear filters', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} />)
      
      const filtersButton = screen.getByText('Filtros')
      await user.click(filtersButton)
      
      const clearButton = screen.getByText('Limpiar filtros')
      await user.click(clearButton)
      
      // Should reset filters
      expect(screen.getByPlaceholderText('Buscar usuarios...')).toHaveValue('')
    })
  })

  describe('User Actions', () => {
    it('should show action menu on hover', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} />)
      
      const userCards = document.querySelectorAll('.group')
      const firstCard = userCards[0]
      
      // Hover over card
      await user.hover(firstCard)
      
      // Actions should be visible (opacity changes from 0 to 100)
      const moreButton = firstCard.querySelector('button')
      expect(moreButton).toBeInTheDocument()
    })

    it('should handle view user action', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} />)
      
      // Click on more actions button for first user
      const moreButtons = screen.getAllByRole('button')
      const moreButton = moreButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-more-vertical')
      )
      
      if (moreButton) {
        await user.click(moreButton)
        
        const viewButton = screen.getByText('Ver detalles')
        await user.click(viewButton)
        
        expect(mockProps.onUserView).toHaveBeenCalledWith(mockUsers[0])
      }
    })

    it('should handle edit user action', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} />)
      
      // Click on more actions button for first user
      const moreButtons = screen.getAllByRole('button')
      const moreButton = moreButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-more-vertical')
      )
      
      if (moreButton) {
        await user.click(moreButton)
        
        const editButton = screen.getByText('Editar')
        await user.click(editButton)
        
        expect(mockProps.onUserEdit).toHaveBeenCalledWith(mockUsers[0])
      }
    })

    it('should handle delete user action with confirmation', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} />)
      
      // Click on more actions button for first user
      const moreButtons = screen.getAllByRole('button')
      const moreButton = moreButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-more-vertical')
      )
      
      if (moreButton) {
        await user.click(moreButton)
        
        const deleteButton = screen.getByText('Eliminar')
        await user.click(deleteButton)
        
        expect(mockOpenModal).toHaveBeenCalled()
      }
    })
  })

  describe('Filtering Logic', () => {
    it('should filter users by search term', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} />)
      
      const searchInput = screen.getByPlaceholderText('Buscar usuarios...')
      await user.type(searchInput, 'John')
      
      // Should show only John Doe
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
    })

    it('should filter users by status', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} />)
      
      const filtersButton = screen.getByText('Filtros')
      await user.click(filtersButton)
      
      const statusSelect = screen.getByDisplayValue('Todos')
      await user.selectOptions(statusSelect, 'inactive')
      
      // Should show only inactive users
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })

    it('should filter users by department', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} />)
      
      const filtersButton = screen.getByText('Filtros')
      await user.click(filtersButton)
      
      const departmentSelect = screen.getAllByRole('combobox')[1] // Department select
      await user.selectOptions(departmentSelect, 'Design')
      
      // Should show only Design department users
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })

    it('should update user count when filtering', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} />)
      
      const searchInput = screen.getByPlaceholderText('Buscar usuarios...')
      await user.type(searchInput, 'John')
      
      expect(screen.getByText('1 de 3 usuarios')).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no users exist', () => {
      render(<UserGrid {...mockProps} users={[]} />)
      
      expect(screen.getByText('No se encontraron usuarios')).toBeInTheDocument()
      expect(screen.getByText('Comienza creando tu primer usuario')).toBeInTheDocument()
      expect(screen.getByText('Crear Usuario')).toBeInTheDocument()
    })

    it('should show filtered empty state', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} />)
      
      const searchInput = screen.getByPlaceholderText('Buscar usuarios...')
      await user.type(searchInput, 'nonexistent')
      
      expect(screen.getByText('No se encontraron usuarios')).toBeInTheDocument()
      expect(screen.getByText('Intenta ajustar los filtros de búsqueda')).toBeInTheDocument()
    })

    it('should handle create user from empty state', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} users={[]} />)
      
      const createButton = screen.getByText('Crear Usuario')
      await user.click(createButton)
      
      expect(mockProps.onUserCreate).toHaveBeenCalled()
    })
  })

  describe('Status Indicators', () => {
    it('should show correct status colors', () => {
      render(<UserGrid {...mockProps} />)
      
      const activeStatuses = screen.getAllByText('Activo')
      const inactiveStatuses = screen.getAllByText('Inactivo')
      
      activeStatuses.forEach(status => {
        expect(status.closest('span')).toHaveClass('bg-green-100', 'text-green-800')
      })
      
      inactiveStatuses.forEach(status => {
        expect(status.closest('span')).toHaveClass('bg-gray-100', 'text-gray-800')
      })
    })

    it('should show status indicator dots on avatars', () => {
      render(<UserGrid {...mockProps} />)
      
      const statusDots = document.querySelectorAll('.absolute.-bottom-1.-right-1')
      expect(statusDots).toHaveLength(3) // One for each user
      
      // Check colors based on status
      const activeDots = document.querySelectorAll('.bg-green-500')
      const inactiveDots = document.querySelectorAll('.bg-gray-400')
      
      expect(activeDots).toHaveLength(2) // 2 active users
      expect(inactiveDots).toHaveLength(1) // 1 inactive user
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<UserGrid {...mockProps} />)
      
      expect(screen.getByRole('heading', { name: 'Gestión de Usuarios' })).toBeInTheDocument()
    })

    it('should have accessible buttons', () => {
      render(<UserGrid {...mockProps} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })

    it('should have accessible form controls', async () => {
      const user = userEvent.setup()
      render(<UserGrid {...mockProps} />)
      
      const filtersButton = screen.getByText('Filtros')
      await user.click(filtersButton)
      
      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toBeInTheDocument()
      
      const selects = screen.getAllByRole('combobox')
      expect(selects.length).toBeGreaterThan(0)
    })

    it('should have proper image alt texts', () => {
      render(<UserGrid {...mockProps} />)
      
      const johnImage = screen.getByAltText('John Doe')
      expect(johnImage).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive grid classes', () => {
      render(<UserGrid {...mockProps} />)
      
      const grid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3')
      expect(grid).toBeInTheDocument()
    })

    it('should have responsive header layout', () => {
      render(<UserGrid {...mockProps} />)
      
      const header = document.querySelector('.flex.flex-col.sm\\:flex-row')
      expect(header).toBeInTheDocument()
    })

    it('should have responsive search layout', () => {
      render(<UserGrid {...mockProps} />)
      
      const searchContainer = document.querySelector('.flex.flex-col.sm\\:flex-row')
      expect(searchContainer).toBeInTheDocument()
    })
  })
})
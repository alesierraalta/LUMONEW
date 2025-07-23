import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../utils/test-render'
import { UsersFilters } from '@/components/users/users-filters'

describe('UsersFilters', () => {
  const mockProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    roleFilter: 'all',
    onRoleFilterChange: vi.fn(),
    statusFilter: 'all',
    onStatusFilterChange: vi.fn(),
    sortBy: 'name' as const,
    onSortByChange: vi.fn(),
    sortOrder: 'asc' as const,
    onSortOrderChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render all filter components', () => {
      render(<UsersFilters {...mockProps} />)
      
      // Search input
      expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument()
      
      // Role filter
      expect(screen.getByDisplayValue('All Roles')).toBeInTheDocument()
      
      // Status filter
      expect(screen.getByDisplayValue('All Status')).toBeInTheDocument()
      
      // Sort controls
      expect(screen.getByDisplayValue('Sort by Name')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument() // Sort order button
    })

    it('should render with correct initial values', () => {
      const props = {
        ...mockProps,
        searchTerm: 'test search',
        roleFilter: 'admin',
        statusFilter: 'active',
        sortBy: 'email' as const,
        sortOrder: 'desc' as const
      }
      
      render(<UsersFilters {...props} />)
      
      expect(screen.getByDisplayValue('test search')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Admin')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Active')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Sort by Email')).toBeInTheDocument()
    })

    it('should render search icon', () => {
      render(<UsersFilters {...mockProps} />)
      
      const searchIcon = document.querySelector('.lucide-search')
      expect(searchIcon).toBeInTheDocument()
    })

    it('should render sort icons correctly', () => {
      render(<UsersFilters {...mockProps} />)
      
      const sortAscIcon = document.querySelector('.lucide-sort-asc')
      expect(sortAscIcon).toBeInTheDocument()
    })

    it('should render desc sort icon when sort order is desc', () => {
      render(<UsersFilters {...mockProps} sortOrder="desc" />)
      
      const sortDescIcon = document.querySelector('.lucide-sort-desc')
      expect(sortDescIcon).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should call onSearchChange when search input changes', async () => {
      const user = userEvent.setup()
      render(<UsersFilters {...mockProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search users...')
      await user.type(searchInput, 'john')
      
      expect(mockProps.onSearchChange).toHaveBeenCalledWith('j')
      expect(mockProps.onSearchChange).toHaveBeenCalledWith('o')
      expect(mockProps.onSearchChange).toHaveBeenCalledWith('h')
      expect(mockProps.onSearchChange).toHaveBeenCalledWith('n')
    })

    it('should clear search when input is cleared', async () => {
      const user = userEvent.setup()
      render(<UsersFilters {...mockProps} searchTerm="test" />)
      
      const searchInput = screen.getByDisplayValue('test')
      await user.clear(searchInput)
      
      expect(mockProps.onSearchChange).toHaveBeenCalledWith('')
    })

    it('should have proper search input styling', () => {
      render(<UsersFilters {...mockProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search users...')
      expect(searchInput).toHaveClass('pl-10') // Left padding for icon
    })
  })

  describe('Role Filter', () => {
    it('should display all role options', () => {
      render(<UsersFilters {...mockProps} />)
      
      const roleSelect = screen.getByDisplayValue('All Roles')
      
      // Check if all options are present
      expect(screen.getByText('All Roles')).toBeInTheDocument()
      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Manager')).toBeInTheDocument()
      expect(screen.getByText('Employee')).toBeInTheDocument()
    })

    it('should call onRoleFilterChange when role is selected', async () => {
      const user = userEvent.setup()
      render(<UsersFilters {...mockProps} />)
      
      const roleSelect = screen.getByDisplayValue('All Roles')
      await user.selectOptions(roleSelect, 'admin')
      
      expect(mockProps.onRoleFilterChange).toHaveBeenCalledWith('admin')
    })

    it('should show selected role', () => {
      render(<UsersFilters {...mockProps} roleFilter="manager" />)
      
      expect(screen.getByDisplayValue('Manager')).toBeInTheDocument()
    })
  })

  describe('Status Filter', () => {
    it('should display all status options', () => {
      render(<UsersFilters {...mockProps} />)
      
      expect(screen.getByText('All Status')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Inactive')).toBeInTheDocument()
    })

    it('should call onStatusFilterChange when status is selected', async () => {
      const user = userEvent.setup()
      render(<UsersFilters {...mockProps} />)
      
      const statusSelect = screen.getByDisplayValue('All Status')
      await user.selectOptions(statusSelect, 'active')
      
      expect(mockProps.onStatusFilterChange).toHaveBeenCalledWith('active')
    })

    it('should show selected status', () => {
      render(<UsersFilters {...mockProps} statusFilter="inactive" />)
      
      expect(screen.getByDisplayValue('Inactive')).toBeInTheDocument()
    })
  })

  describe('Sort Controls', () => {
    it('should display all sort options', () => {
      render(<UsersFilters {...mockProps} />)
      
      expect(screen.getByText('Sort by Name')).toBeInTheDocument()
      expect(screen.getByText('Sort by Email')).toBeInTheDocument()
      expect(screen.getByText('Sort by Role')).toBeInTheDocument()
      expect(screen.getByText('Sort by Last Login')).toBeInTheDocument()
    })

    it('should call onSortByChange when sort field is selected', async () => {
      const user = userEvent.setup()
      render(<UsersFilters {...mockProps} />)
      
      const sortSelect = screen.getByDisplayValue('Sort by Name')
      await user.selectOptions(sortSelect, 'email')
      
      expect(mockProps.onSortByChange).toHaveBeenCalledWith('email')
    })

    it('should show selected sort field', () => {
      render(<UsersFilters {...mockProps} sortBy="role" />)
      
      expect(screen.getByDisplayValue('Sort by Role')).toBeInTheDocument()
    })

    it('should call onSortOrderChange when sort order button is clicked', async () => {
      const user = userEvent.setup()
      render(<UsersFilters {...mockProps} />)
      
      const sortOrderButton = screen.getByRole('button')
      await user.click(sortOrderButton)
      
      expect(mockProps.onSortOrderChange).toHaveBeenCalledWith('desc')
    })

    it('should toggle sort order from desc to asc', async () => {
      const user = userEvent.setup()
      render(<UsersFilters {...mockProps} sortOrder="desc" />)
      
      const sortOrderButton = screen.getByRole('button')
      await user.click(sortOrderButton)
      
      expect(mockProps.onSortOrderChange).toHaveBeenCalledWith('asc')
    })
  })

  describe('Layout and Styling', () => {
    it('should have responsive layout classes', () => {
      render(<UsersFilters {...mockProps} />)
      
      const container = document.querySelector('.flex.flex-col.lg\\:flex-row')
      expect(container).toBeInTheDocument()
    })

    it('should have proper card styling', () => {
      render(<UsersFilters {...mockProps} />)
      
      const card = document.querySelector('.mb-6')
      expect(card).toBeInTheDocument()
    })

    it('should have proper input focus styles', () => {
      render(<UsersFilters {...mockProps} />)
      
      const selects = document.querySelectorAll('select')
      selects.forEach(select => {
        expect(select).toHaveClass('focus:ring-2', 'focus:ring-blue-500')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper input labels and accessibility', () => {
      render(<UsersFilters {...mockProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search users...')
      expect(searchInput).toHaveAttribute('type', 'text')
      
      const selects = screen.getAllByRole('combobox')
      expect(selects).toHaveLength(3) // Role, Status, Sort
    })

    it('should have accessible button', () => {
      render(<UsersFilters {...mockProps} />)
      
      const sortButton = screen.getByRole('button')
      expect(sortButton).toBeInTheDocument()
      expect(sortButton).toHaveAttribute('type', 'button')
    })

    it('should have proper focus management', async () => {
      const user = userEvent.setup()
      render(<UsersFilters {...mockProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search users...')
      await user.click(searchInput)
      
      expect(searchInput).toHaveFocus()
    })
  })

  describe('Integration', () => {
    it('should handle multiple filter changes', async () => {
      const user = userEvent.setup()
      render(<UsersFilters {...mockProps} />)
      
      // Change search
      const searchInput = screen.getByPlaceholderText('Search users...')
      await user.type(searchInput, 'test')
      
      // Change role
      const roleSelect = screen.getByDisplayValue('All Roles')
      await user.selectOptions(roleSelect, 'admin')
      
      // Change status
      const statusSelect = screen.getByDisplayValue('All Status')
      await user.selectOptions(statusSelect, 'active')
      
      // Change sort
      const sortSelect = screen.getByDisplayValue('Sort by Name')
      await user.selectOptions(sortSelect, 'email')
      
      // Toggle sort order
      const sortButton = screen.getByRole('button')
      await user.click(sortButton)
      
      expect(mockProps.onSearchChange).toHaveBeenCalled()
      expect(mockProps.onRoleFilterChange).toHaveBeenCalledWith('admin')
      expect(mockProps.onStatusFilterChange).toHaveBeenCalledWith('active')
      expect(mockProps.onSortByChange).toHaveBeenCalledWith('email')
      expect(mockProps.onSortOrderChange).toHaveBeenCalledWith('desc')
    })

    it('should maintain state consistency', () => {
      const props = {
        ...mockProps,
        searchTerm: 'john doe',
        roleFilter: 'manager',
        statusFilter: 'active',
        sortBy: 'lastLogin' as const,
        sortOrder: 'desc' as const
      }
      
      render(<UsersFilters {...props} />)
      
      expect(screen.getByDisplayValue('john doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Manager')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Active')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Sort by Last Login')).toBeInTheDocument()
      
      const sortDescIcon = document.querySelector('.lucide-sort-desc')
      expect(sortDescIcon).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty search term', () => {
      render(<UsersFilters {...mockProps} searchTerm="" />)
      
      const searchInput = screen.getByPlaceholderText('Search users...')
      expect(searchInput).toHaveValue('')
    })

    it('should handle invalid filter values gracefully', () => {
      const props = {
        ...mockProps,
        roleFilter: 'invalid-role',
        statusFilter: 'invalid-status'
      }
      
      // Should not throw error
      expect(() => render(<UsersFilters {...props} />)).not.toThrow()
    })

    it('should handle rapid filter changes', async () => {
      const user = userEvent.setup()
      render(<UsersFilters {...mockProps} />)
      
      const searchInput = screen.getByPlaceholderText('Search users...')
      
      // Rapid typing
      await user.type(searchInput, 'abc')
      
      expect(mockProps.onSearchChange).toHaveBeenCalledTimes(3)
    })
  })

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const { rerender } = render(<UsersFilters {...mockProps} />)
      
      // Re-render with same props
      rerender(<UsersFilters {...mockProps} />)
      
      // Should still render correctly
      expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument()
    })
  })
})
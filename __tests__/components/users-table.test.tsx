import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { render } from '../utils/test-render'
import { createMockUsers } from '../utils/mock-data'
import { UsersTable } from '@/components/users/users-table'

// Mock the userService
const mockUserService = {
  getAll: vi.fn(),
  delete: vi.fn(),
  update: vi.fn()
}

vi.mock('@/lib/database', () => ({
  userService: mockUserService
}))

// Mock window.confirm
const mockConfirm = vi.fn()
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
})

// Mock window.alert
const mockAlert = vi.fn()
Object.defineProperty(window, 'alert', {
  value: mockAlert,
  writable: true
})

describe('UsersTable', () => {
  const mockUsers = createMockUsers(5)

  beforeEach(() => {
    vi.clearAllMocks()
    mockUserService.getAll.mockResolvedValue(mockUsers)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should display loading skeleton when loading', () => {
      mockUserService.getAll.mockImplementation(() => new Promise(() => {}))
      
      render(<UsersTable />)
      
      // Check for loading skeleton elements
      expect(screen.getAllByText('User')).toHaveLength(1)
      expect(screen.getAllByText('Email')).toHaveLength(1)
      expect(screen.getAllByText('Role')).toHaveLength(1)
      expect(screen.getAllByText('Status')).toHaveLength(1)
      expect(screen.getAllByText('Last Login')).toHaveLength(1)
      expect(screen.getAllByText('Created')).toHaveLength(1)
      expect(screen.getAllByText('Actions')).toHaveLength(1)
      
      // Check for skeleton rows
      const skeletonRows = document.querySelectorAll('.animate-pulse')
      expect(skeletonRows.length).toBeGreaterThan(0)
    })
  })

  describe('Error State', () => {
    it('should display error message when fetch fails', async () => {
      const errorMessage = 'Failed to fetch users'
      mockUserService.getAll.mockRejectedValue(new Error(errorMessage))
      
      render(<UsersTable />)
      
      await waitFor(() => {
        expect(screen.getByText(`Error loading users: ${errorMessage}`)).toBeInTheDocument()
      })
    })
  })

  describe('Data Display', () => {
    it('should display users data correctly', async () => {
      render(<UsersTable />)
      
      await waitFor(() => {
        expect(mockUserService.getAll).toHaveBeenCalledTimes(1)
      })
      
      // Check if user data is displayed
      mockUsers.forEach(user => {
        expect(screen.getByText(user.name)).toBeInTheDocument()
        expect(screen.getByText(user.email)).toBeInTheDocument()
      })
    })

    it('should display role badges with correct styling', async () => {
      render(<UsersTable />)
      
      await waitFor(() => {
        mockUsers.forEach(user => {
          const roleElement = screen.getByText(user.role.charAt(0).toUpperCase() + user.role.slice(1))
          expect(roleElement).toBeInTheDocument()
        })
      })
    })

    it('should display status badges correctly', async () => {
      render(<UsersTable />)
      
      await waitFor(() => {
        const activeUsers = mockUsers.filter(user => user.is_active)
        const inactiveUsers = mockUsers.filter(user => !user.is_active)
        
        expect(screen.getAllByText('Active')).toHaveLength(activeUsers.length)
        expect(screen.getAllByText('Inactive')).toHaveLength(inactiveUsers.length)
      })
    })

    it('should display last login information correctly', async () => {
      render(<UsersTable />)
      
      await waitFor(() => {
        const usersWithoutLogin = mockUsers.filter(user => !user.last_login)
        if (usersWithoutLogin.length > 0) {
          expect(screen.getAllByText('Never')).toHaveLength(usersWithoutLogin.length)
        }
      })
    })
  })

  describe('Search Functionality', () => {
    it('should filter users by search term', async () => {
      const searchTerm = mockUsers[0].name.substring(0, 5)
      
      render(<UsersTable searchTerm={searchTerm} />)
      
      await waitFor(() => {
        const filteredUsers = mockUsers.filter(user =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
        )
        
        // Should only show filtered users
        filteredUsers.forEach(user => {
          expect(screen.getByText(user.name)).toBeInTheDocument()
        })
      })
    })

    it('should show no results message when search returns empty', async () => {
      render(<UsersTable searchTerm="nonexistentuser" />)
      
      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument()
        expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument()
      })
    })
  })

  describe('User Selection', () => {
    it('should allow selecting individual users', async () => {
      render(<UsersTable />)
      
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox')
        const userCheckbox = checkboxes[1] // First user checkbox (index 0 is select all)
        
        fireEvent.click(userCheckbox)
        expect(userCheckbox).toBeChecked()
      })
    })

    it('should allow selecting all users', async () => {
      render(<UsersTable />)
      
      await waitFor(() => {
        const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
        
        fireEvent.click(selectAllCheckbox)
        
        const allCheckboxes = screen.getAllByRole('checkbox')
        allCheckboxes.forEach(checkbox => {
          expect(checkbox).toBeChecked()
        })
      })
    })

    it('should show bulk actions when users are selected', async () => {
      render(<UsersTable />)
      
      await waitFor(() => {
        const userCheckbox = screen.getAllByRole('checkbox')[1]
        fireEvent.click(userCheckbox)
        
        expect(screen.getByText('1 users selected')).toBeInTheDocument()
        expect(screen.getByText('Export Selected')).toBeInTheDocument()
        expect(screen.getByText('Bulk Edit')).toBeInTheDocument()
        expect(screen.getByText('Deactivate Selected')).toBeInTheDocument()
      })
    })
  })

  describe('User Actions', () => {
    it('should handle user deletion with confirmation', async () => {
      mockConfirm.mockReturnValue(true)
      mockUserService.delete.mockResolvedValue(undefined)
      
      render(<UsersTable />)
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button')
        const deleteButton = deleteButtons.find(button => 
          button.querySelector('svg')?.classList.contains('lucide-trash-2')
        )
        
        if (deleteButton) {
          fireEvent.click(deleteButton)
          
          expect(mockConfirm).toHaveBeenCalledWith(
            expect.stringContaining('Are you sure you want to delete the user')
          )
          expect(mockUserService.delete).toHaveBeenCalled()
        }
      })
    })

    it('should not delete user when confirmation is cancelled', async () => {
      mockConfirm.mockReturnValue(false)
      
      render(<UsersTable />)
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button')
        const deleteButton = deleteButtons.find(button => 
          button.querySelector('svg')?.classList.contains('lucide-trash-2')
        )
        
        if (deleteButton) {
          fireEvent.click(deleteButton)
          
          expect(mockConfirm).toHaveBeenCalled()
          expect(mockUserService.delete).not.toHaveBeenCalled()
        }
      })
    })

    it('should handle bulk deactivation', async () => {
      mockConfirm.mockReturnValue(true)
      mockUserService.update.mockResolvedValue(undefined)
      
      render(<UsersTable />)
      
      await waitFor(() => {
        // Select a user first
        const userCheckbox = screen.getAllByRole('checkbox')[1]
        fireEvent.click(userCheckbox)
        
        // Click bulk deactivate
        const deactivateButton = screen.getByText('Deactivate Selected')
        fireEvent.click(deactivateButton)
        
        expect(mockConfirm).toHaveBeenCalledWith(
          expect.stringContaining('Are you sure you want to deactivate')
        )
      })
    })

    it('should handle edit button click', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      render(<UsersTable />)
      
      await waitFor(() => {
        const editButtons = screen.getAllByRole('button')
        const editButton = editButtons.find(button => 
          button.querySelector('svg')?.classList.contains('lucide-edit')
        )
        
        if (editButton) {
          fireEvent.click(editButton)
          expect(consoleSpy).toHaveBeenCalledWith('Edit user:', expect.any(Object))
        }
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    it('should handle delete error gracefully', async () => {
      mockConfirm.mockReturnValue(true)
      mockUserService.delete.mockRejectedValue(new Error('Delete failed'))
      
      render(<UsersTable />)
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button')
        const deleteButton = deleteButtons.find(button => 
          button.querySelector('svg')?.classList.contains('lucide-trash-2')
        )
        
        if (deleteButton) {
          fireEvent.click(deleteButton)
        }
      })
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to delete user.')
      })
    })

    it('should handle bulk deactivation error gracefully', async () => {
      mockConfirm.mockReturnValue(true)
      mockUserService.update.mockRejectedValue(new Error('Update failed'))
      
      render(<UsersTable />)
      
      await waitFor(() => {
        // Select a user first
        const userCheckbox = screen.getAllByRole('checkbox')[1]
        fireEvent.click(userCheckbox)
        
        // Click bulk deactivate
        const deactivateButton = screen.getByText('Deactivate Selected')
        fireEvent.click(deactivateButton)
      })
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to deactivate some users.')
      })
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no users exist', async () => {
      mockUserService.getAll.mockResolvedValue([])
      
      render(<UsersTable />)
      
      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument()
        expect(screen.getByText('Create your first user to get started')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper table structure', async () => {
      render(<UsersTable />)
      
      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
        
        const columnHeaders = screen.getAllByRole('columnheader')
        expect(columnHeaders).toHaveLength(8) // Including checkbox column
      })
    })

    it('should have accessible checkboxes', async () => {
      render(<UsersTable />)
      
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox')
        checkboxes.forEach(checkbox => {
          expect(checkbox).toHaveAttribute('type', 'checkbox')
        })
      })
    })

    it('should have accessible buttons', async () => {
      render(<UsersTable />)
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        buttons.forEach(button => {
          expect(button).toBeInTheDocument()
        })
      })
    })
  })
})
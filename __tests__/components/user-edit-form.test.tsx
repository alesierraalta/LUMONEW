import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../utils/test-render'
import { UserEditForm, UserEditData } from '@/components/users/user-edit-form'

// Mock the UI components
vi.mock('@/components/ui/floating-input', () => ({
  FloatingInput: ({ label, value, onChange, onValidation, validation, disabled, type }: any) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
      if (onValidation) {
        const isValid = validation?.required ? e.target.value.length > 0 : true
        onValidation(isValid)
      }
    }
    
    return (
      <div>
        <label>{label}</label>
        <input
          type={type || 'text'}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          data-testid={`input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
        />
      </div>
    )
  }
}))

vi.mock('@/components/ui/loading', () => ({
  LoadingButton: ({ children, isLoading, loadingText, disabled, onClick, type, className }: any) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={className}
      data-testid="loading-button"
    >
      {isLoading ? loadingText : children}
    </button>
  )
}))

// Mock database service
const mockRoleService = {
  getAll: vi.fn()
}

vi.mock('@/lib/database', () => ({
  roleService: mockRoleService
}))

// Mock toast and modal hooks
const mockAddToast = vi.fn()
const mockCloseModal = vi.fn()

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    addToast: mockAddToast
  })
}))

vi.mock('@/components/ui/modal', () => ({
  useModal: () => ({
    closeModal: mockCloseModal
  })
}))

describe('UserEditForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()
  
  const mockRoles = [
    { id: '1', name: 'admin', description: 'Administrator' },
    { id: '2', name: 'manager', description: 'Manager' },
    { id: '3', name: 'employee', description: 'Employee' }
  ]
  
  const mockUserData: UserEditData = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'admin'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRoleService.getAll.mockResolvedValue(mockRoles)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render edit form correctly', async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        expect(screen.getByText('Editar Usuario')).toBeInTheDocument()
        expect(screen.getByText('Actualiza la información básica del usuario')).toBeInTheDocument()
        expect(screen.getByText('Actualizar Usuario')).toBeInTheDocument()
      })
    })

    it('should render all required form fields', async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('input-nombre-*')).toBeInTheDocument()
        expect(screen.getByTestId('input-apellido-*')).toBeInTheDocument()
        expect(screen.getByTestId('input-email-*')).toBeInTheDocument()
        expect(screen.getByText('Rol *')).toBeInTheDocument()
      })
    })

    it('should render personal information section', async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        expect(screen.getByText('Información Personal')).toBeInTheDocument()
      })
    })

    it('should load and display roles in select', async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        expect(mockRoleService.getAll).toHaveBeenCalled()
        expect(screen.getByText('Selecciona un rol')).toBeInTheDocument()
        expect(screen.getByText('admin - Administrator')).toBeInTheDocument()
        expect(screen.getByText('manager - Manager')).toBeInTheDocument()
        expect(screen.getByText('employee - Employee')).toBeInTheDocument()
      })
    })
  })

  describe('Form Pre-population', () => {
    it('should pre-populate form with user data when editing', async () => {
      render(<UserEditForm user={mockUserData} onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue(mockUserData.firstName)).toBeInTheDocument()
        expect(screen.getByDisplayValue(mockUserData.lastName)).toBeInTheDocument()
        expect(screen.getByDisplayValue(mockUserData.email)).toBeInTheDocument()
        expect(screen.getByDisplayValue(mockUserData.role)).toBeInTheDocument()
      })
    })
  })

  describe('Role Loading', () => {
    it('should handle role loading error gracefully', async () => {
      mockRoleService.getAll.mockRejectedValue(new Error('Failed to load roles'))
      
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'error',
          title: 'Error al cargar roles',
          description: 'No se pudieron cargar los roles desde la base de datos'
        })
      })
    })

    it('should set empty roles array on error', async () => {
      mockRoleService.getAll.mockRejectedValue(new Error('Failed to load roles'))
      
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        // Should still render the select with default option
        expect(screen.getByText('Selecciona un rol')).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('should show validation error for incomplete form', async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        const submitButton = screen.getByTestId('loading-button')
        fireEvent.click(submitButton)
      })
      
      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'error',
          title: 'Formulario incompleto',
          description: 'Por favor completa todos los campos requeridos'
        })
      })
      
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        const emailInput = screen.getByTestId('input-email-*')
        user.type(emailInput, 'invalid-email')
        
        expect(emailInput).toBeInTheDocument()
      })
    })

    it('should require all fields to be filled', async () => {
      const user = userEvent.setup()
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        // Fill only some fields
        const firstNameInput = screen.getByTestId('input-nombre-*')
        user.type(firstNameInput, 'John')
        
        const submitButton = screen.getByTestId('loading-button')
        fireEvent.click(submitButton)
      })
      
      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'error',
          title: 'Formulario incompleto',
          description: 'Por favor completa todos los campos requeridos'
        })
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)
      
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(async () => {
        // Fill required fields
        await user.type(screen.getByTestId('input-nombre-*'), 'John')
        await user.type(screen.getByTestId('input-apellido-*'), 'Doe')
        await user.type(screen.getByTestId('input-email-*'), 'john@example.com')
        
        // Select role
        const roleSelect = screen.getByDisplayValue('Selecciona un rol')
        await user.selectOptions(roleSelect, 'admin')
        
        const submitButton = screen.getByTestId('loading-button')
        fireEvent.click(submitButton)
      })
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'admin'
          })
        )
      })
    })

    it('should show success toast on successful submission', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)
      
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(async () => {
        // Fill required fields
        await user.type(screen.getByTestId('input-nombre-*'), 'John')
        await user.type(screen.getByTestId('input-apellido-*'), 'Doe')
        await user.type(screen.getByTestId('input-email-*'), 'john@example.com')
        
        // Select role
        const roleSelect = screen.getByDisplayValue('Selecciona un rol')
        await user.selectOptions(roleSelect, 'admin')
        
        const submitButton = screen.getByTestId('loading-button')
        fireEvent.click(submitButton)
      })
      
      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'success',
          title: 'Usuario actualizado',
          description: 'John Doe ha sido actualizado exitosamente'
        })
      })
      
      expect(mockCloseModal).toHaveBeenCalled()
    })

    it('should show error toast on submission failure', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockRejectedValue(new Error('Submission failed'))
      
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(async () => {
        // Fill required fields
        await user.type(screen.getByTestId('input-nombre-*'), 'John')
        await user.type(screen.getByTestId('input-apellido-*'), 'Doe')
        await user.type(screen.getByTestId('input-email-*'), 'john@example.com')
        
        // Select role
        const roleSelect = screen.getByDisplayValue('Selecciona un rol')
        await user.selectOptions(roleSelect, 'admin')
        
        const submitButton = screen.getByTestId('loading-button')
        fireEvent.click(submitButton)
      })
      
      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'error',
          title: 'Error al guardar',
          description: 'Ocurrió un error al actualizar el usuario. Inténtalo de nuevo.'
        })
      })
    })
  })

  describe('Role Selection', () => {
    it('should handle role selection', async () => {
      const user = userEvent.setup()
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(async () => {
        const roleSelect = screen.getByDisplayValue('Selecciona un rol')
        await user.selectOptions(roleSelect, 'manager')
        
        expect(roleSelect).toHaveValue('manager')
      })
    })

    it('should show selected role when pre-populated', async () => {
      render(<UserEditForm user={mockUserData} onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('admin')).toBeInTheDocument()
      })
    })
  })

  describe('Form Actions', () => {
    it('should handle cancel button click', async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancelar')
        fireEvent.click(cancelButton)
        
        expect(mockOnCancel).toHaveBeenCalled()
        expect(mockCloseModal).toHaveBeenCalled()
      })
    })

    it('should disable form when loading', async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} isLoading={true} />)
      
      await waitFor(() => {
        const submitButton = screen.getByTestId('loading-button')
        expect(submitButton).toBeDisabled()
        
        const inputs = screen.getAllByRole('textbox')
        inputs.forEach(input => {
          expect(input).toBeDisabled()
        })
        
        const roleSelect = screen.getByRole('combobox')
        expect(roleSelect).toBeDisabled()
      })
    })

    it('should show loading text when submitting', async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} isLoading={true} />)
      
      await waitFor(() => {
        expect(screen.getByText('Actualizando...')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper form structure', async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        const form = screen.getByRole('form')
        expect(form).toBeInTheDocument()
      })
    })

    it('should have proper labels for inputs', async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        expect(screen.getByText('Nombre *')).toBeInTheDocument()
        expect(screen.getByText('Apellido *')).toBeInTheDocument()
        expect(screen.getByText('Email *')).toBeInTheDocument()
        expect(screen.getByText('Rol *')).toBeInTheDocument()
      })
    })

    it('should have proper button roles', async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('should have accessible select element', async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        const roleSelect = screen.getByRole('combobox')
        expect(roleSelect).toBeInTheDocument()
        expect(roleSelect).toHaveAttribute('required')
      })
    })
  })

  describe('Email Validation', () => {
    it('should have email validation pattern', async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        const emailInput = screen.getByTestId('input-email-*')
        expect(emailInput).toHaveAttribute('type', 'email')
      })
    })
  })

  describe('Form State Management', () => {
    it('should update form data on input changes', async () => {
      const user = userEvent.setup()
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(async () => {
        const firstNameInput = screen.getByTestId('input-nombre-*')
        await user.type(firstNameInput, 'Jane')
        
        expect(firstNameInput).toHaveValue('Jane')
      })
    })

    it('should maintain form state during role loading', async () => {
      const user = userEvent.setup()
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(async () => {
        const firstNameInput = screen.getByTestId('input-nombre-*')
        await user.type(firstNameInput, 'John')
        
        // Role loading should not affect other form fields
        expect(firstNameInput).toHaveValue('John')
        expect(mockRoleService.getAll).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockRoleService.getAll.mockRejectedValue(new Error('Network error'))
      
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'error',
          title: 'Error al cargar roles',
          description: 'No se pudieron cargar los roles desde la base de datos'
        })
      })
    })

    it('should continue to work even if roles fail to load', async () => {
      mockRoleService.getAll.mockRejectedValue(new Error('Network error'))
      
      render(<UserEditForm onSubmit={mockOnSubmit} />)
      
      await waitFor(() => {
        // Form should still be functional
        expect(screen.getByTestId('input-nombre-*')).toBeInTheDocument()
        expect(screen.getByTestId('input-apellido-*')).toBeInTheDocument()
        expect(screen.getByTestId('input-email-*')).toBeInTheDocument()
      })
    })
  })
})
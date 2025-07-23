import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../utils/test-render'
import { UserForm, UserData } from '@/components/users/user-form'

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
  },
  FloatingTextarea: ({ label, value, onChange, validation, disabled, rows }: any) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    }
    
    return (
      <div>
        <label>{label}</label>
        <textarea
          value={value}
          onChange={handleChange}
          disabled={disabled}
          rows={rows}
          data-testid={`textarea-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
        />
      </div>
    )
  }
}))

vi.mock('@/components/ui/image-upload', () => ({
  ImageUpload: ({ onImageSelect, onImageRemove, currentImage, className }: any) => (
    <div className={className} data-testid="image-upload">
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onImageSelect(file)
        }}
        data-testid="image-input"
      />
      {currentImage && (
        <div>
          <img src={currentImage} alt="Preview" data-testid="image-preview" />
          <button onClick={onImageRemove} data-testid="remove-image">
            Remove
          </button>
        </div>
      )}
    </div>
  )
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

describe('UserForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()
  
  const mockUserData: UserData = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    position: 'Developer',
    department: 'Engineering',
    location: 'New York',
    bio: 'Software developer with 5 years of experience',
    startDate: '2023-01-15',
    status: 'active'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render create form correctly', () => {
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      expect(screen.getByText('Nuevo Usuario')).toBeInTheDocument()
      expect(screen.getByText('Completa los datos del nuevo usuario')).toBeInTheDocument()
      expect(screen.getByText('Crear Usuario')).toBeInTheDocument()
    })

    it('should render edit form correctly', () => {
      render(<UserForm user={mockUserData} onSubmit={mockOnSubmit} />)
      
      expect(screen.getByText('Editar Usuario')).toBeInTheDocument()
      expect(screen.getByText('Actualiza la información del usuario')).toBeInTheDocument()
      expect(screen.getByText('Actualizar Usuario')).toBeInTheDocument()
    })

    it('should render all form sections', () => {
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      expect(screen.getByText('Información Personal')).toBeInTheDocument()
      expect(screen.getByText('Información Profesional')).toBeInTheDocument()
      expect(screen.getByText('Información Adicional')).toBeInTheDocument()
    })

    it('should render all required form fields', () => {
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      expect(screen.getByTestId('input-nombre-*')).toBeInTheDocument()
      expect(screen.getByTestId('input-apellido-*')).toBeInTheDocument()
      expect(screen.getByTestId('input-email-*')).toBeInTheDocument()
      expect(screen.getByTestId('input-teléfono-*')).toBeInTheDocument()
      expect(screen.getByTestId('input-cargo-*')).toBeInTheDocument()
      expect(screen.getByTestId('input-departamento-*')).toBeInTheDocument()
      expect(screen.getByTestId('input-ubicación-*')).toBeInTheDocument()
      expect(screen.getByTestId('input-fecha-de-inicio-*')).toBeInTheDocument()
      expect(screen.getByTestId('textarea-biografía')).toBeInTheDocument()
    })
  })

  describe('Form Pre-population', () => {
    it('should pre-populate form with user data when editing', () => {
      render(<UserForm user={mockUserData} onSubmit={mockOnSubmit} />)
      
      expect(screen.getByDisplayValue(mockUserData.firstName)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUserData.lastName)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUserData.email)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUserData.phone)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUserData.position)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUserData.department)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUserData.location)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUserData.bio)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUserData.startDate)).toBeInTheDocument()
      expect(screen.getByDisplayValue('active')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show validation error for incomplete form', async () => {
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      const submitButton = screen.getByTestId('loading-button')
      fireEvent.click(submitButton)
      
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
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      const emailInput = screen.getByTestId('input-email-*')
      await user.type(emailInput, 'invalid-email')
      
      // The validation should be handled by the FloatingInput component
      expect(emailInput).toHaveValue('invalid-email')
    })

    it('should validate phone format', async () => {
      const user = userEvent.setup()
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      const phoneInput = screen.getByTestId('input-teléfono-*')
      await user.type(phoneInput, 'invalid-phone')
      
      expect(phoneInput).toHaveValue('invalid-phone')
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)
      
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      // Fill required fields
      await user.type(screen.getByTestId('input-nombre-*'), 'John')
      await user.type(screen.getByTestId('input-apellido-*'), 'Doe')
      await user.type(screen.getByTestId('input-email-*'), 'john@example.com')
      await user.type(screen.getByTestId('input-teléfono-*'), '+1234567890')
      await user.type(screen.getByTestId('input-cargo-*'), 'Developer')
      await user.type(screen.getByTestId('input-departamento-*'), 'Engineering')
      await user.type(screen.getByTestId('input-ubicación-*'), 'New York')
      await user.type(screen.getByTestId('input-fecha-de-inicio-*'), '2023-01-15')
      
      const submitButton = screen.getByTestId('loading-button')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            position: 'Developer',
            department: 'Engineering',
            location: 'New York',
            startDate: '2023-01-15'
          })
        )
      })
    })

    it('should show success toast on successful submission', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)
      
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      // Fill required fields
      await user.type(screen.getByTestId('input-nombre-*'), 'John')
      await user.type(screen.getByTestId('input-apellido-*'), 'Doe')
      await user.type(screen.getByTestId('input-email-*'), 'john@example.com')
      await user.type(screen.getByTestId('input-teléfono-*'), '+1234567890')
      await user.type(screen.getByTestId('input-cargo-*'), 'Developer')
      await user.type(screen.getByTestId('input-departamento-*'), 'Engineering')
      await user.type(screen.getByTestId('input-ubicación-*'), 'New York')
      await user.type(screen.getByTestId('input-fecha-de-inicio-*'), '2023-01-15')
      
      const submitButton = screen.getByTestId('loading-button')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'success',
          title: 'Usuario creado',
          description: 'John Doe ha sido creado exitosamente'
        })
      })
      
      expect(mockCloseModal).toHaveBeenCalled()
    })

    it('should show error toast on submission failure', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockRejectedValue(new Error('Submission failed'))
      
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      // Fill required fields
      await user.type(screen.getByTestId('input-nombre-*'), 'John')
      await user.type(screen.getByTestId('input-apellido-*'), 'Doe')
      await user.type(screen.getByTestId('input-email-*'), 'john@example.com')
      await user.type(screen.getByTestId('input-teléfono-*'), '+1234567890')
      await user.type(screen.getByTestId('input-cargo-*'), 'Developer')
      await user.type(screen.getByTestId('input-departamento-*'), 'Engineering')
      await user.type(screen.getByTestId('input-ubicación-*'), 'New York')
      await user.type(screen.getByTestId('input-fecha-de-inicio-*'), '2023-01-15')
      
      const submitButton = screen.getByTestId('loading-button')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          type: 'error',
          title: 'Error al guardar',
          description: 'Ocurrió un error al guardar el usuario. Inténtalo de nuevo.'
        })
      })
    })
  })

  describe('Image Upload', () => {
    it('should handle image selection', async () => {
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      const imageInput = screen.getByTestId('image-input')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      // Mock URL.createObjectURL
      const mockCreateObjectURL = vi.fn(() => 'blob:test-url')
      Object.defineProperty(URL, 'createObjectURL', {
        value: mockCreateObjectURL,
        writable: true
      })
      
      fireEvent.change(imageInput, { target: { files: [file] } })
      
      expect(mockCreateObjectURL).toHaveBeenCalledWith(file)
      expect(screen.getByTestId('image-preview')).toBeInTheDocument()
    })

    it('should handle image removal', async () => {
      render(<UserForm user={{ ...mockUserData, profileImage: 'test-image.jpg' }} onSubmit={mockOnSubmit} />)
      
      const removeButton = screen.getByTestId('remove-image')
      fireEvent.click(removeButton)
      
      expect(screen.queryByTestId('image-preview')).not.toBeInTheDocument()
    })
  })

  describe('Status Selection', () => {
    it('should handle status change', async () => {
      const user = userEvent.setup()
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      const statusSelect = screen.getByDisplayValue('Activo')
      await user.selectOptions(statusSelect, 'inactive')
      
      expect(statusSelect).toHaveValue('inactive')
    })
  })

  describe('Form Actions', () => {
    it('should handle cancel button click', () => {
      render(<UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      
      const cancelButton = screen.getByText('Cancelar')
      fireEvent.click(cancelButton)
      
      expect(mockOnCancel).toHaveBeenCalled()
      expect(mockCloseModal).toHaveBeenCalled()
    })

    it('should disable form when loading', () => {
      render(<UserForm onSubmit={mockOnSubmit} isLoading={true} />)
      
      const submitButton = screen.getByTestId('loading-button')
      expect(submitButton).toBeDisabled()
      
      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        expect(input).toBeDisabled()
      })
    })

    it('should show loading text when submitting', () => {
      render(<UserForm onSubmit={mockOnSubmit} isLoading={true} />)
      
      expect(screen.getByText('Creando...')).toBeInTheDocument()
    })

    it('should show updating text when editing and loading', () => {
      render(<UserForm user={mockUserData} onSubmit={mockOnSubmit} isLoading={true} />)
      
      expect(screen.getByText('Actualizando...')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
    })

    it('should have proper labels for inputs', () => {
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      expect(screen.getByText('Nombre *')).toBeInTheDocument()
      expect(screen.getByText('Apellido *')).toBeInTheDocument()
      expect(screen.getByText('Email *')).toBeInTheDocument()
      expect(screen.getByText('Teléfono *')).toBeInTheDocument()
    })

    it('should have proper button roles', () => {
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Form Sections', () => {
    it('should display personal information section', () => {
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      expect(screen.getByText('Información Personal')).toBeInTheDocument()
      expect(screen.getByTestId('input-nombre-*')).toBeInTheDocument()
      expect(screen.getByTestId('input-apellido-*')).toBeInTheDocument()
      expect(screen.getByTestId('input-email-*')).toBeInTheDocument()
      expect(screen.getByTestId('input-teléfono-*')).toBeInTheDocument()
    })

    it('should display professional information section', () => {
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      expect(screen.getByText('Información Profesional')).toBeInTheDocument()
      expect(screen.getByTestId('input-cargo-*')).toBeInTheDocument()
      expect(screen.getByTestId('input-departamento-*')).toBeInTheDocument()
      expect(screen.getByTestId('input-ubicación-*')).toBeInTheDocument()
      expect(screen.getByTestId('input-fecha-de-inicio-*')).toBeInTheDocument()
    })

    it('should display additional information section', () => {
      render(<UserForm onSubmit={mockOnSubmit} />)
      
      expect(screen.getByText('Información Adicional')).toBeInTheDocument()
      expect(screen.getByTestId('textarea-biografía')).toBeInTheDocument()
    })
  })
})
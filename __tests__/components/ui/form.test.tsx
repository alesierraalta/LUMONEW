import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { render } from '../../utils/test-render'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Test schema for validation
const testSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old').optional(),
})

type TestFormData = z.infer<typeof testSchema>

// Test component that uses the form
function TestForm({ onSubmit, defaultValues }: {
  onSubmit?: (data: TestFormData) => void
  defaultValues?: Partial<TestFormData>
}) {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    mode: 'onBlur', // Enable validation on blur
    reValidateMode: 'onChange', // Re-validate on change after first validation
    defaultValues: {
      username: '',
      email: '',
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit || (() => {}))}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>
                Your public display name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}

// Component to test useFormField hook
function TestFormFieldHook() {
  const fieldData = useFormField()
  
  return (
    <div data-testid="form-field-data">
      <span data-testid="field-name">{fieldData.name}</span>
      <span data-testid="field-id">{fieldData.id}</span>
      <span data-testid="field-error">{fieldData.error?.message || 'no-error'}</span>
    </div>
  )
}

function TestFormWithHook() {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { username: '', email: '' },
  })

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="username"
        render={() => (
          <FormItem>
            <TestFormFieldHook />
          </FormItem>
        )}
      />
    </Form>
  )
}

describe('Form Components', () => {
  describe('Form (FormProvider)', () => {
    it('should render form with provider context', () => {
      render(<TestForm />)
      
      // Use querySelector since form element doesn't have implicit role="form"
      expect(document.querySelector('form')).toBeInTheDocument()
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
    })

    it('should provide form context to child components', () => {
      render(<TestForm />)
      
      const usernameInput = screen.getByLabelText('Username')
      const emailInput = screen.getByLabelText('Email')
      
      expect(usernameInput).toBeInTheDocument()
      expect(emailInput).toBeInTheDocument()
    })
  })

  describe('FormField', () => {
    it('should render field with controller', () => {
      render(<TestForm />)
      
      const usernameInput = screen.getByLabelText('Username')
      expect(usernameInput).toBeInTheDocument()
      expect(usernameInput).toHaveAttribute('name', 'username')
    })

    it('should handle field value changes', async () => {
      const user = userEvent.setup()
      render(<TestForm />)
      
      const usernameInput = screen.getByLabelText('Username')
      await user.type(usernameInput, 'testuser')
      
      expect(usernameInput).toHaveValue('testuser')
    })

    it('should validate field on blur', async () => {
      const user = userEvent.setup()
      render(<TestForm />)
      
      const usernameInput = screen.getByLabelText('Username')
      await user.type(usernameInput, 'ab') // Too short
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument()
      })
    })
  })

  describe('FormItem', () => {
    it('should render with default styling', () => {
      render(<TestForm />)
      
      const formItems = document.querySelectorAll('[class*="space-y-2"]')
      expect(formItems.length).toBeGreaterThan(0)
    })

    it('should accept custom className', () => {
      function CustomFormItem() {
        const form = useForm()
        return (
          <Form {...form}>
            <FormItem className="custom-form-item">
              <div>Custom item</div>
            </FormItem>
          </Form>
        )
      }
      
      render(<CustomFormItem />)
      
      const formItem = document.querySelector('.custom-form-item')
      expect(formItem).toBeInTheDocument()
      expect(formItem).toHaveClass('space-y-2', 'custom-form-item')
    })

    it('should provide unique id context', () => {
      render(<TestFormWithHook />)
      
      const fieldId = screen.getByTestId('field-id')
      // React useId format can vary, just check it's a non-empty string
      expect(fieldId.textContent).toBeTruthy()
      expect(fieldId.textContent).toMatch(/^:r\w*:$/) // More flexible React useId format
    })
  })

  describe('FormLabel', () => {
    it('should render label with correct htmlFor', () => {
      render(<TestForm />)
      
      const usernameLabel = screen.getByText('Username')
      const usernameInput = screen.getByLabelText('Username')
      
      expect(usernameLabel).toBeInTheDocument()
      expect(usernameLabel.getAttribute('for')).toBe(usernameInput.getAttribute('id'))
    })

    it('should show error styling when field has error', async () => {
      const user = userEvent.setup()
      render(<TestForm />)
      
      const usernameInput = screen.getByLabelText('Username')
      const usernameLabel = screen.getByText('Username')
      
      await user.type(usernameInput, 'ab') // Too short
      await user.tab()
      
      await waitFor(() => {
        expect(usernameLabel).toHaveClass('text-destructive')
      })
    })

    it('should not show error styling when field is valid', () => {
      render(<TestForm />)
      
      const usernameLabel = screen.getByText('Username')
      expect(usernameLabel).not.toHaveClass('text-destructive')
    })
  })

  describe('FormControl', () => {
    it('should render with correct accessibility attributes', () => {
      render(<TestForm />)
      
      const usernameInput = screen.getByLabelText('Username')
      
      expect(usernameInput).toHaveAttribute('aria-describedby')
      expect(usernameInput).toHaveAttribute('aria-invalid', 'false')
    })

    it('should update aria-invalid when field has error', async () => {
      const user = userEvent.setup()
      render(<TestForm />)
      
      const usernameInput = screen.getByLabelText('Username')
      await user.type(usernameInput, 'ab') // Too short
      await user.tab()
      
      await waitFor(() => {
        expect(usernameInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('should include error message in aria-describedby when field has error', async () => {
      const user = userEvent.setup()
      render(<TestForm />)
      
      const usernameInput = screen.getByLabelText('Username')
      await user.type(usernameInput, 'ab') // Too short
      await user.tab()
      
      await waitFor(() => {
        const ariaDescribedBy = usernameInput.getAttribute('aria-describedby')
        expect(ariaDescribedBy).toContain('form-item-message')
      })
    })
  })

  describe('FormDescription', () => {
    it('should render description text', () => {
      render(<TestForm />)
      
      const description = screen.getByText('Your public display name')
      expect(description).toBeInTheDocument()
      expect(description).toHaveClass('text-muted-foreground')
    })

    it('should have correct id for accessibility', () => {
      render(<TestForm />)
      
      const description = screen.getByText('Your public display name')
      const usernameInput = screen.getByLabelText('Username')
      const ariaDescribedBy = usernameInput.getAttribute('aria-describedby')
      
      expect(description).toHaveAttribute('id')
      expect(ariaDescribedBy).toContain(description.getAttribute('id'))
    })

    it('should accept custom className', () => {
      function CustomDescription() {
        const form = useForm()
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormDescription className="custom-description">
                    Custom description
                  </FormDescription>
                </FormItem>
              )}
            />
          </Form>
        )
      }
      
      render(<CustomDescription />)
      
      const description = screen.getByText('Custom description')
      expect(description).toHaveClass('custom-description')
    })
  })

  describe('FormMessage', () => {
    it('should not render when no error', () => {
      render(<TestForm />)
      
      const errorMessage = screen.queryByText('Username must be at least 3 characters')
      expect(errorMessage).not.toBeInTheDocument()
    })

    it('should render error message when field has error', async () => {
      const user = userEvent.setup()
      render(<TestForm />)
      
      const usernameInput = screen.getByLabelText('Username')
      await user.type(usernameInput, 'ab') // Too short
      await user.tab()
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Username must be at least 3 characters')
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveClass('text-destructive')
      })
    })

    it('should render custom children when no error', () => {
      function CustomMessage() {
        const form = useForm()
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormMessage>Custom message</FormMessage>
                </FormItem>
              )}
            />
          </Form>
        )
      }
      
      render(<CustomMessage />)
      
      const message = screen.getByText('Custom message')
      expect(message).toBeInTheDocument()
    })

    it('should have correct id for accessibility', async () => {
      const user = userEvent.setup()
      render(<TestForm />)
      
      const usernameInput = screen.getByLabelText('Username')
      await user.type(usernameInput, 'ab') // Too short
      await user.tab()
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Username must be at least 3 characters')
        const ariaDescribedBy = usernameInput.getAttribute('aria-describedby')
        
        expect(errorMessage).toHaveAttribute('id')
        expect(ariaDescribedBy).toContain(errorMessage.getAttribute('id'))
      })
    })
  })

  describe('useFormField Hook', () => {
    it('should provide field context data', () => {
      render(<TestFormWithHook />)
      
      const fieldName = screen.getByTestId('field-name')
      const fieldId = screen.getByTestId('field-id')
      const fieldError = screen.getByTestId('field-error')
      
      expect(fieldName.textContent).toBe('username')
      expect(fieldId.textContent).toMatch(/^:r\d+:$/)
      expect(fieldError.textContent).toBe('no-error')
    })

    it('should throw error when used outside FormField', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      function InvalidComponent() {
        useFormField()
        return <div>Invalid</div>
      }
      
      // The actual error thrown is from useFormContext being null
      expect(() => render(<InvalidComponent />)).toThrow()
      
      consoleSpy.mockRestore()
    })

    it('should provide error state when field has error', async () => {
      const user = userEvent.setup()
      
      function TestFormWithError() {
        const form = useForm<TestFormData>({
          resolver: zodResolver(testSchema),
          mode: 'onBlur',
          reValidateMode: 'onChange',
          defaultValues: { username: '', email: '' },
        })

        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(() => {})}>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <TestFormFieldHook />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        )
      }
      
      render(<TestFormWithError />)
      
      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button')
      
      await user.type(input, 'ab') // Too short
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        const fieldError = screen.getByTestId('field-error')
        expect(fieldError.textContent).toBe('Username must be at least 3 characters')
      })
    })
  })

  describe('Form Integration', () => {
    it('should handle form submission with valid data', async () => {
      const handleSubmit = vi.fn()
      const user = userEvent.setup()
      
      render(<TestForm onSubmit={handleSubmit} />)
      
      const usernameInput = screen.getByLabelText('Username')
      const emailInput = screen.getByLabelText('Email')
      const submitButton = screen.getByRole('button', { name: 'Submit' })
      
      await user.type(usernameInput, 'testuser')
      await user.type(emailInput, 'test@example.com')
      
      await act(async () => {
        fireEvent.click(submitButton)
      })
      
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'testuser',
            email: 'test@example.com',
          }),
          expect.any(Object) // React Hook Form passes event as second parameter
        )
      }, { timeout: 5000 })
    })

    it('should prevent submission with invalid data', async () => {
      const handleSubmit = vi.fn()
      const user = userEvent.setup()
      
      render(<TestForm onSubmit={handleSubmit} />)
      
      const usernameInput = screen.getByLabelText('Username')
      const emailInput = screen.getByLabelText('Email')
      const submitButton = screen.getByRole('button', { name: 'Submit' })
      
      await user.type(usernameInput, 'ab') // Too short
      await user.type(emailInput, 'invalid-email') // Invalid email
      
      await act(async () => {
        fireEvent.click(submitButton)
      })
      
      // Use findBy* queries for async validation as recommended by React Hook Form docs
      await waitFor(async () => {
        const usernameInput = await screen.findByLabelText('Username')
        expect(usernameInput).toHaveAttribute('aria-invalid', 'true')
      }, { timeout: 5000 })
      
      expect(handleSubmit).not.toHaveBeenCalled()
    })

    it('should work with default values', () => {
      render(<TestForm defaultValues={{ username: 'defaultuser', email: 'default@example.com' }} />)
      
      const usernameInput = screen.getByLabelText('Username')
      const emailInput = screen.getByLabelText('Email')
      
      expect(usernameInput).toHaveValue('defaultuser')
      expect(emailInput).toHaveValue('default@example.com')
    })

    it('should clear errors when field becomes valid', async () => {
      const user = userEvent.setup()
      render(<TestForm />)
      
      const usernameInput = screen.getByLabelText('Username')
      
      // Create error
      await user.type(usernameInput, 'ab')
      await user.tab()
      
      // Use findBy* for async validation state changes
      await waitFor(async () => {
        const usernameInput = await screen.findByLabelText('Username')
        expect(usernameInput).toHaveAttribute('aria-invalid', 'true')
      }, { timeout: 5000 })
      
      // Clear the field and type valid value
      await act(async () => {
        await user.clear(usernameInput)
        await user.type(usernameInput, 'validuser')
        await user.tab() // Trigger validation
      })
      
      await waitFor(async () => {
        const usernameInput = await screen.findByLabelText('Username')
        expect(usernameInput).toHaveAttribute('aria-invalid', 'false')
      }, { timeout: 5000 })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA relationships', () => {
      render(<TestForm />)
      
      const usernameInput = screen.getByLabelText('Username')
      const usernameLabel = screen.getByText('Username')
      const description = screen.getByText('Your public display name')
      
      expect(usernameLabel.getAttribute('for')).toBe(usernameInput.getAttribute('id'))
      
      const ariaDescribedBy = usernameInput.getAttribute('aria-describedby')
      expect(ariaDescribedBy).toContain(description.getAttribute('id'))
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<TestForm />)
      
      const usernameInput = screen.getByLabelText('Username')
      const emailInput = screen.getByLabelText('Email')
      const submitButton = screen.getByRole('button', { name: 'Submit' })
      
      await user.tab()
      expect(usernameInput).toHaveFocus()
      
      await user.tab()
      expect(emailInput).toHaveFocus()
      
      await user.tab()
      expect(submitButton).toHaveFocus()
    })

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup()
      render(<TestForm />)
      
      const usernameInput = screen.getByLabelText('Username')
      await user.type(usernameInput, 'ab')
      await user.tab()
      
      // Use findBy* for async validation state changes
      await waitFor(async () => {
        const usernameInput = await screen.findByLabelText('Username')
        expect(usernameInput).toHaveAttribute('aria-invalid', 'true')
        expect(usernameInput).toHaveAttribute('aria-describedby')
      }, { timeout: 5000 })
    })
  })
})
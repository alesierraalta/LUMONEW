import { describe, it, expect, vi, beforeAll } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { simpleRender, setupCommonMocks } from '../../utils/test-render'
import { Input } from '@/components/ui/input'

beforeAll(() => {
  setupCommonMocks()
})

describe('Input', () => {
  describe('Rendering', () => {
    it('should render input with default props', () => {
      simpleRender(<Input />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      // Input elements don't have explicit type='text' by default in HTML
      expect(input).not.toHaveAttribute('type')
    })

    it('should render input with placeholder', () => {
      simpleRender(<Input placeholder="Enter your name" />)
      
      const input = screen.getByPlaceholderText('Enter your name')
      expect(input).toBeInTheDocument()
    })

    it('should render input with value', () => {
      simpleRender(<Input value="test value" readOnly />)
      
      const input = screen.getByDisplayValue('test value')
      expect(input).toBeInTheDocument()
    })

    it('should render input with default value', () => {
      simpleRender(<Input defaultValue="default value" />)
      
      const input = screen.getByDisplayValue('default value')
      expect(input).toBeInTheDocument()
    })
  })

  describe('Input Types', () => {
    it('should render text input by default', () => {
      simpleRender(<Input />)
      
      const input = screen.getByRole('textbox')
      // Input elements don't have explicit type='text' by default in HTML
      expect(input).not.toHaveAttribute('type')
    })

    it('should render email input', () => {
      simpleRender(<Input type="email" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('should render password input', () => {
      simpleRender(<Input type="password" />)
      
      const input = document.querySelector('input[type="password"]')
      expect(input).toBeInTheDocument()
    })

    it('should render number input', () => {
      simpleRender(<Input type="number" />)
      
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
    })

    it('should render tel input', () => {
      simpleRender(<Input type="tel" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'tel')
    })

    it('should render url input', () => {
      simpleRender(<Input type="url" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'url')
    })

    it('should render search input', () => {
      simpleRender(<Input type="search" />)
      
      const input = screen.getByRole('searchbox')
      expect(input).toHaveAttribute('type', 'search')
    })

    it('should render date input', () => {
      simpleRender(<Input type="date" />)
      
      const input = document.querySelector('input[type="date"]')
      expect(input).toBeInTheDocument()
    })

    it('should render file input', () => {
      simpleRender(<Input type="file" />)
      
      const input = document.querySelector('input[type="file"]')
      expect(input).toBeInTheDocument()
    })
  })

  describe('States', () => {
    it('should be enabled by default', () => {
      simpleRender(<Input />)
      
      const input = screen.getByRole('textbox')
      expect(input).not.toBeDisabled()
    })

    it('should be disabled when disabled prop is true', () => {
      simpleRender(<Input disabled />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })

    it('should be readonly when readOnly prop is true', () => {
      simpleRender(<Input readOnly />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('readonly')
    })

    it('should be required when required prop is true', () => {
      simpleRender(<Input required />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeRequired()
    })
  })

  describe('Styling', () => {
    it('should have default styling classes', () => {
      simpleRender(<Input />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass(
        'flex',
        'h-10',
        'w-full',
        'rounded-md',
        'border',
        'border-input',
        'bg-background',
        'px-3',
        'py-2',
        'text-sm'
      )
    })

    it('should apply custom className', () => {
      simpleRender(<Input className="custom-class" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-class')
    })

    it('should have focus styles', () => {
      simpleRender(<Input />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring',
        'focus-visible:ring-offset-2'
      )
    })

    it('should have placeholder styles', () => {
      simpleRender(<Input placeholder="Test placeholder" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('placeholder:text-muted-foreground')
    })

    it('should have file input styles', () => {
      simpleRender(<Input type="file" />)
      
      const input = document.querySelector('input[type="file"]')
      expect(input).toHaveClass(
        'file:border-0',
        'file:bg-transparent',
        'file:text-sm',
        'file:font-medium'
      )
    })
  })

  describe('Event Handling', () => {
    it('should call onChange when value changes', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      simpleRender(<Input onChange={handleChange} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'test')
      
      expect(handleChange).toHaveBeenCalledTimes(4) // One for each character
    })

    it('should call onFocus when focused', async () => {
      const handleFocus = vi.fn()
      const user = userEvent.setup()
      
      simpleRender(<Input onFocus={handleFocus} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      expect(handleFocus).toHaveBeenCalledTimes(1)
    })

    it('should call onBlur when blurred', async () => {
      const handleBlur = vi.fn()
      const user = userEvent.setup()
      
      simpleRender(<Input onBlur={handleBlur} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.tab()
      
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    it('should call onKeyDown when key is pressed', () => {
      const handleKeyDown = vi.fn()
      
      simpleRender(<Input onKeyDown={handleKeyDown} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.keyDown(input, { key: 'Enter' })
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1)
    })

    it('should not call onChange when disabled', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      simpleRender(<Input onChange={handleChange} disabled />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'test')
      
      expect(handleChange).not.toHaveBeenCalled()
    })

    it('should not call onChange when readOnly', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      simpleRender(<Input onChange={handleChange} readOnly />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'test')
      
      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('Controlled vs Uncontrolled', () => {
    it('should work as controlled component', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      const { rerender } = render(<Input value="initial" onChange={handleChange} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('initial')
      
      await user.type(input, 'a')
      expect(handleChange).toHaveBeenCalled()
      
      // Simulate parent component updating value
      rerender(<Input value="updated" onChange={handleChange} />)
      expect(input).toHaveValue('updated')
    })

    it('should work as uncontrolled component', async () => {
      const user = userEvent.setup()
      
      simpleRender(<Input defaultValue="initial" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('initial')
      
      await user.clear(input)
      await user.type(input, 'new value')
      expect(input).toHaveValue('new value')
    })
  })

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      simpleRender(<Input aria-label="Username input" />)
      
      const input = screen.getByLabelText('Username input')
      expect(input).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      simpleRender(
        <div>
          <Input aria-describedby="help-text" />
          <div id="help-text">Enter your username</div>
        </div>
      )
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('should support aria-invalid', () => {
      simpleRender(<Input aria-invalid="true" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      
      simpleRender(
        <div>
          <Input placeholder="First input" />
          <Input placeholder="Second input" />
        </div>
      )
      
      const firstInput = screen.getByPlaceholderText('First input')
      const secondInput = screen.getByPlaceholderText('Second input')
      
      await user.tab()
      expect(firstInput).toHaveFocus()
      
      await user.tab()
      expect(secondInput).toHaveFocus()
    })
  })

  describe('Form Integration', () => {
    it('should work with form submission', () => {
      const handleSubmit = vi.fn((e) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        expect(formData.get('username')).toBe('testuser')
      })
      
      simpleRender(
        <form onSubmit={handleSubmit}>
          <Input name="username" defaultValue="testuser" />
          <button type="submit">Submit</button>
        </form>
      )
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleSubmit).toHaveBeenCalledTimes(1)
    })

    it('should work with form validation', async () => {
      const user = userEvent.setup()
      
      simpleRender(
        <form>
          <Input required name="email" type="email" />
          <button type="submit">Submit</button>
        </form>
      )
      
      const input = screen.getByRole('textbox')
      const button = screen.getByRole('button')
      
      // Try to submit empty required field
      fireEvent.click(button)
      expect(input).toBeInvalid()
      
      // Fill with valid email
      await user.type(input, 'test@example.com')
      expect(input).toBeValid()
    })
  })

  describe('Custom Props', () => {
    it('should accept custom id', () => {
      simpleRender(<Input id="custom-id" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('id', 'custom-id')
    })

    it('should accept custom name', () => {
      simpleRender(<Input name="custom-name" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('name', 'custom-name')
    })

    it('should accept data attributes', () => {
      simpleRender(<Input data-testid="custom-input" />)
      
      const input = screen.getByTestId('custom-input')
      expect(input).toBeInTheDocument()
    })

    it('should accept min and max for number inputs', () => {
      simpleRender(<Input type="number" min="0" max="100" />)
      
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '100')
    })

    it('should accept step for number inputs', () => {
      simpleRender(<Input type="number" step="0.1" />)
      
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('step', '0.1')
    })

    it('should accept maxLength', () => {
      simpleRender(<Input maxLength={10} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('maxlength', '10')
    })

    it('should accept pattern', () => {
      simpleRender(<Input pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('pattern', '[0-9]{3}-[0-9]{3}-[0-9]{4}')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null value gracefully', () => {
      simpleRender(<Input value={null as any} readOnly />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    it('should handle undefined value gracefully', () => {
      simpleRender(<Input value={undefined} readOnly />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    it('should handle number values', () => {
      simpleRender(<Input value={123 as any} readOnly />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('123')
    })

    it('should handle very long values', async () => {
      const longValue = 'a'.repeat(100) // Reduced length to prevent timeout
      const user = userEvent.setup()
      
      simpleRender(<Input />)
      
      const input = screen.getByRole('textbox')
      // Use paste instead of typing for performance
      await user.click(input)
      await user.paste(longValue)
      
      expect(input).toHaveValue(longValue)
    }, 10000) // Increased timeout
  })

  describe('Ref Forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = vi.fn()
      
      simpleRender(<Input ref={ref} />)
      
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement))
    })

    it('should allow ref to access input methods', () => {
      let inputRef: HTMLInputElement | null = null
      
      simpleRender(<Input ref={(el) => { inputRef = el }} />)
      
      expect(inputRef).toBeInstanceOf(HTMLInputElement)
      if (inputRef) {
        expect(typeof (inputRef as HTMLInputElement).focus).toBe('function')
        expect(typeof (inputRef as HTMLInputElement).blur).toBe('function')
        expect(typeof (inputRef as HTMLInputElement).select).toBe('function')
      }
    })
  })
})
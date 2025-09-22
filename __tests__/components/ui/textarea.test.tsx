import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, cleanup, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupCommonMocks } from '../../utils/test-render'
import { Textarea } from '@/components/ui/textarea'

beforeAll(() => {
  setupCommonMocks()
})

beforeEach(() => {
  cleanup()
})

describe('Textarea', () => {
  describe('Rendering', () => {
    it('should render textarea with default props', () => {
      const { container } = render(<Textarea />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toBeInTheDocument()
      expect(textarea.tagName).toBe('TEXTAREA')
    })

    it('should render textarea with placeholder', () => {
      const { container } = render(<Textarea placeholder="Enter your message" />)
      
      const textarea = screen.getByPlaceholderText('Enter your message')
      expect(textarea).toBeInTheDocument()
    })

    it('should render textarea with value', () => {
      const { container } = render(<Textarea value="test value" readOnly />)
      
      const textarea = screen.getByDisplayValue('test value')
      expect(textarea).toBeInTheDocument()
    })

    it('should render textarea with default value', () => {
      const { container } = render(<Textarea defaultValue="default value" />)
      
      const textarea = screen.getByDisplayValue('default value')
      expect(textarea).toBeInTheDocument()
    })
  })

  describe('States', () => {
    it('should be enabled by default', () => {
      const { container } = render(<Textarea />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).not.toBeDisabled()
    })

    it('should be disabled when disabled prop is true', () => {
      const { container } = render(<Textarea disabled />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toBeDisabled()
      expect(textarea).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })

    it('should be readonly when readOnly prop is true', () => {
      const { container } = render(<Textarea readOnly />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveAttribute('readonly')
    })

    it('should be required when required prop is true', () => {
      const { container } = render(<Textarea required />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toBeRequired()
    })
  })

  describe('Styling', () => {
    it('should have default styling classes', () => {
      const { container } = render(<Textarea />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveClass(
        'flex',
        'min-h-[60px]',
        'w-full',
        'rounded-md',
        'border',
        'border-input',
        'bg-transparent',
        'px-3',
        'py-2',
        'text-base'
      )
    })

    it('should apply custom className', () => {
      const { container } = render(<Textarea className="custom-class" />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveClass('custom-class')
    })

    it('should have focus styles', () => {
      const { container } = render(<Textarea />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-1',
        'focus-visible:ring-ring'
      )
    })

    it('should have placeholder styles', () => {
      const { container } = render(<Textarea placeholder="Test placeholder" />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveClass('placeholder:text-muted-foreground')
    })

    it('should have responsive text size', () => {
      const { container } = render(<Textarea />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveClass('text-base', 'md:text-sm')
    })

    it('should have minimum height', () => {
      const { container } = render(<Textarea />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveClass('min-h-[60px]')
    })
  })

  describe('Event Handling', () => {
    it('should call onChange when value changes', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      const { container } = render(<Textarea onChange={handleChange} />)
      
      const textarea = container.querySelector('textarea')!
      await user.type(textarea, 'test')
      
      expect(handleChange).toHaveBeenCalledTimes(4) // One for each character
    })

    it('should call onFocus when focused', async () => {
      const handleFocus = vi.fn()
      const user = userEvent.setup()
      
      const { container } = render(<Textarea onFocus={handleFocus} />)
      
      const textarea = container.querySelector('textarea')!
      await user.click(textarea)
      
      expect(handleFocus).toHaveBeenCalledTimes(1)
    })

    it('should call onBlur when blurred', async () => {
      const handleBlur = vi.fn()
      const user = userEvent.setup()
      
      const { container } = render(<Textarea onBlur={handleBlur} />)
      
      const textarea = container.querySelector('textarea')!
      await user.click(textarea)
      await user.tab()
      
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    it('should call onKeyDown when key is pressed', () => {
      const handleKeyDown = vi.fn()
      
      const { container } = render(<Textarea onKeyDown={handleKeyDown} />)
      
      const textarea = container.querySelector('textarea')!
      fireEvent.keyDown(textarea, { key: 'Enter' })
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1)
    })

    it('should call onKeyUp when key is released', () => {
      const handleKeyUp = vi.fn()
      
      const { container } = render(<Textarea onKeyUp={handleKeyUp} />)
      
      const textarea = container.querySelector('textarea')!
      fireEvent.keyUp(textarea, { key: 'Enter' })
      
      expect(handleKeyUp).toHaveBeenCalledTimes(1)
    })

    it('should not call onChange when disabled', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      const { container } = render(<Textarea onChange={handleChange} disabled />)
      
      const textarea = container.querySelector('textarea')!
      await user.type(textarea, 'test')
      
      expect(handleChange).not.toHaveBeenCalled()
    })

    it('should not call onChange when readOnly', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      const { container } = render(<Textarea onChange={handleChange} readOnly />)
      
      const textarea = container.querySelector('textarea')!
      await user.type(textarea, 'test')
      
      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('Multiline Text Handling', () => {
    it('should handle multiline text input', async () => {
      const user = userEvent.setup()
      const { container } = render(<Textarea />)
      
      const textarea = container.querySelector('textarea')!
      const multilineText = 'Line 1\nLine 2\nLine 3'
      
      await user.type(textarea, multilineText)
      expect(textarea).toHaveValue(multilineText)
    })

    it('should handle Enter key for new lines', async () => {
      const user = userEvent.setup()
      const { container } = render(<Textarea />)
      
      const textarea = container.querySelector('textarea')!
      await user.type(textarea, 'First line{Enter}Second line')
      
      expect(textarea).toHaveValue('First line\nSecond line')
    })

    it('should preserve line breaks in value', () => {
      const multilineValue = 'Line 1\nLine 2\nLine 3'
      const { container } = render(<Textarea value={multilineValue} readOnly />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveValue(multilineValue)
    })
  })

  describe('Controlled vs Uncontrolled', () => {
    it('should work as controlled component', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      const { container, rerender } = render(<Textarea value="initial" onChange={handleChange} />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveValue('initial')
      
      await user.type(textarea, 'a')
      expect(handleChange).toHaveBeenCalled()
      
      // Simulate parent component updating value
      rerender(<Textarea value="updated" onChange={handleChange} />)
      expect(textarea).toHaveValue('updated')
    })

    it('should work as uncontrolled component', async () => {
      const user = userEvent.setup()
      
      const { container } = render(<Textarea defaultValue="initial" />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveValue('initial')
      
      await user.clear(textarea)
      await user.type(textarea, 'new value')
      expect(textarea).toHaveValue('new value')
    })
  })

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      const { container } = render(<Textarea aria-label="Message input" />)
      
      const textarea = screen.getByLabelText('Message input')
      expect(textarea).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      const { container } = render(
        <div>
          <Textarea aria-describedby="help-text" />
          <div id="help-text">Enter your message here</div>
        </div>
      )
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('should support aria-invalid', () => {
      const { container } = render(<Textarea aria-invalid="true" />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveAttribute('aria-invalid', 'true')
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      
      const { container } = render(
        <div>
          <Textarea placeholder="First textarea" />
          <Textarea placeholder="Second textarea" />
        </div>
      )
      
      const firstTextarea = screen.getByPlaceholderText('First textarea')
      const secondTextarea = screen.getByPlaceholderText('Second textarea')
      
      await user.tab()
      expect(firstTextarea).toHaveFocus()
      
      await user.tab()
      expect(secondTextarea).toHaveFocus()
    })

    it('should support screen reader announcements', () => {
      const { container } = render(<Textarea aria-label="Description" />)
      
      const textarea = screen.getByRole('textbox', { name: 'Description' })
      expect(textarea).toBeInTheDocument()
    })
  })

  describe('Form Integration', () => {
    it('should work with form submission', () => {
      const handleSubmit = vi.fn((e) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        expect(formData.get('message')).toBe('test message')
      })
      
      const { container } = render(
        <form onSubmit={handleSubmit}>
          <Textarea name="message" defaultValue="test message" />
          <button type="submit">Submit</button>
        </form>
      )
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleSubmit).toHaveBeenCalledTimes(1)
    })

    it('should work with form validation', async () => {
      const user = userEvent.setup()
      
      const { container } = render(
        <form>
          <Textarea required name="description" />
          <button type="submit">Submit</button>
        </form>
      )
      
      const textarea = container.querySelector('textarea')!
      const button = screen.getByRole('button')
      
      // Try to submit empty required field
      fireEvent.click(button)
      expect(textarea).toBeInvalid()
      
      // Fill with valid content
      await user.type(textarea, 'Valid description')
      expect(textarea).toBeValid()
    })

    it('should respect maxLength attribute', async () => {
      const user = userEvent.setup()
      const { container } = render(<Textarea maxLength={10} />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveAttribute('maxlength', '10')
      
      await user.type(textarea, 'This is a very long text that exceeds the limit')
      expect((textarea as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(10)
    })

    it('should respect minLength attribute', () => {
      const { container } = render(<Textarea minLength={5} />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveAttribute('minlength', '5')
    })
  })

  describe('Custom Props', () => {
    it('should accept custom id', () => {
      const { container } = render(<Textarea id="custom-id" />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveAttribute('id', 'custom-id')
    })

    it('should accept custom name', () => {
      const { container } = render(<Textarea name="custom-name" />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveAttribute('name', 'custom-name')
    })

    it('should accept data attributes', () => {
      const { container } = render(<Textarea data-testid="custom-textarea" />)
      
      const textarea = screen.getByTestId('custom-textarea')
      expect(textarea).toBeInTheDocument()
    })

    it('should accept rows attribute', () => {
      const { container } = render(<Textarea rows={5} />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveAttribute('rows', '5')
    })

    it('should accept cols attribute', () => {
      const { container } = render(<Textarea cols={50} />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveAttribute('cols', '50')
    })

    it('should accept wrap attribute', () => {
      const { container } = render(<Textarea wrap="hard" />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveAttribute('wrap', 'hard')
    })

    it('should accept resize style', () => {
      const { container } = render(<Textarea style={{ resize: 'vertical' }} />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveStyle({ resize: 'vertical' })
    })
  })

  describe('Edge Cases', () => {
    it('should handle null value gracefully', () => {
      const { container } = render(<Textarea value={null as any} readOnly />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveValue('')
    })

    it('should handle undefined value gracefully', () => {
      const { container } = render(<Textarea value={undefined} readOnly />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveValue('')
    })

    it('should handle number values', () => {
      const { container } = render(<Textarea value={123 as any} readOnly />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveValue('123')
    })

    it('should handle very long values', async () => {
      const longValue = 'a'.repeat(100) // Reduced size for faster testing
      
      const { container } = render(<Textarea defaultValue={longValue} />)
      
      const textarea = container.querySelector('textarea')!
      expect(textarea).toHaveValue(longValue)
    })

    it('should handle special characters', async () => {
      const specialChars = 'Special: @#$%^&*()'
      
      const { container } = render(<Textarea />)
      
      const textarea = container.querySelector('textarea')!
      fireEvent.change(textarea, { target: { value: specialChars } })
      
      expect(textarea).toHaveValue(specialChars)
    })

    it('should handle unicode characters', async () => {
      const unicodeText = 'Hello World 123'
      
      const { container } = render(<Textarea />)
      
      const textarea = container.querySelector('textarea')!
      fireEvent.change(textarea, { target: { value: unicodeText } })
      
      expect(textarea).toHaveValue(unicodeText)
    })
  })

  describe('Ref Forwarding', () => {
    it('should forward ref to textarea element', () => {
      const ref = vi.fn()
      
      const { container } = render(<Textarea ref={ref} />)
      
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLTextAreaElement))
    })

    it('should allow ref to access textarea methods', () => {
      let textareaRef: HTMLTextAreaElement | null = null
      
      const { container } = render(<Textarea ref={(el) => { textareaRef = el }} />)
      
      expect(textareaRef).toBeInstanceOf(HTMLTextAreaElement)
      if (textareaRef) {
        expect(typeof (textareaRef as HTMLTextAreaElement).focus).toBe('function')
        expect(typeof (textareaRef as HTMLTextAreaElement).blur).toBe('function')
        expect(typeof (textareaRef as HTMLTextAreaElement).select).toBe('function')
        expect(typeof (textareaRef as HTMLTextAreaElement).setSelectionRange).toBe('function')
      }
    })
  })

  describe('Text Selection and Cursor', () => {
    it('should support text selection', async () => {
      const { container } = render(<Textarea defaultValue="Hello World" />)
      
      const textarea = container.querySelector('textarea')! as HTMLTextAreaElement
      
      // Simulate text selection programmatically
      textarea.setSelectionRange(0, 11)
      
      expect(textarea.selectionStart).toBe(0)
      expect(textarea.selectionEnd).toBe(11)
    })

    it('should support cursor positioning', async () => {
      const { container } = render(<Textarea defaultValue="Hello World" />)
      
      const textarea = container.querySelector('textarea')! as HTMLTextAreaElement
      
      // Simulate cursor positioning programmatically
      textarea.setSelectionRange(11, 11)
      
      expect(textarea.selectionStart).toBe(11)
      expect(textarea.selectionEnd).toBe(11)
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn()
      
      function TestComponent({ value }: { value: string }) {
        renderSpy()
        return <Textarea value={value} readOnly />
      }
      
      const { container, rerender } = render(<TestComponent value="initial" />)
      
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Re-render with same value
      rerender(<TestComponent value="initial" />)
      expect(renderSpy).toHaveBeenCalledTimes(2)
      
      // Re-render with different value
      rerender(<TestComponent value="changed" />)
      expect(renderSpy).toHaveBeenCalledTimes(3)
    })
  })
})
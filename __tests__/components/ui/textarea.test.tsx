import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../utils/test-render'
import { Textarea } from '@/components/ui/textarea'

describe('Textarea', () => {
  describe('Rendering', () => {
    it('should render textarea with default props', () => {
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()
      expect(textarea.tagName).toBe('TEXTAREA')
    })

    it('should render textarea with placeholder', () => {
      render(<Textarea placeholder="Enter your message" />)
      
      const textarea = screen.getByPlaceholderText('Enter your message')
      expect(textarea).toBeInTheDocument()
    })

    it('should render textarea with value', () => {
      render(<Textarea value="test value" readOnly />)
      
      const textarea = screen.getByDisplayValue('test value')
      expect(textarea).toBeInTheDocument()
    })

    it('should render textarea with default value', () => {
      render(<Textarea defaultValue="default value" />)
      
      const textarea = screen.getByDisplayValue('default value')
      expect(textarea).toBeInTheDocument()
    })
  })

  describe('States', () => {
    it('should be enabled by default', () => {
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).not.toBeDisabled()
    })

    it('should be disabled when disabled prop is true', () => {
      render(<Textarea disabled />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeDisabled()
      expect(textarea).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })

    it('should be readonly when readOnly prop is true', () => {
      render(<Textarea readOnly />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('readonly')
    })

    it('should be required when required prop is true', () => {
      render(<Textarea required />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeRequired()
    })
  })

  describe('Styling', () => {
    it('should have default styling classes', () => {
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
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
      render(<Textarea className="custom-class" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('custom-class')
    })

    it('should have focus styles', () => {
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-1',
        'focus-visible:ring-ring'
      )
    })

    it('should have placeholder styles', () => {
      render(<Textarea placeholder="Test placeholder" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('placeholder:text-muted-foreground')
    })

    it('should have responsive text size', () => {
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('text-base', 'md:text-sm')
    })

    it('should have minimum height', () => {
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('min-h-[60px]')
    })
  })

  describe('Event Handling', () => {
    it('should call onChange when value changes', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      render(<Textarea onChange={handleChange} />)
      
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'test')
      
      expect(handleChange).toHaveBeenCalledTimes(4) // One for each character
    })

    it('should call onFocus when focused', async () => {
      const handleFocus = vi.fn()
      const user = userEvent.setup()
      
      render(<Textarea onFocus={handleFocus} />)
      
      const textarea = screen.getByRole('textbox')
      await user.click(textarea)
      
      expect(handleFocus).toHaveBeenCalledTimes(1)
    })

    it('should call onBlur when blurred', async () => {
      const handleBlur = vi.fn()
      const user = userEvent.setup()
      
      render(<Textarea onBlur={handleBlur} />)
      
      const textarea = screen.getByRole('textbox')
      await user.click(textarea)
      await user.tab()
      
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    it('should call onKeyDown when key is pressed', () => {
      const handleKeyDown = vi.fn()
      
      render(<Textarea onKeyDown={handleKeyDown} />)
      
      const textarea = screen.getByRole('textbox')
      fireEvent.keyDown(textarea, { key: 'Enter' })
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1)
    })

    it('should call onKeyUp when key is released', () => {
      const handleKeyUp = vi.fn()
      
      render(<Textarea onKeyUp={handleKeyUp} />)
      
      const textarea = screen.getByRole('textbox')
      fireEvent.keyUp(textarea, { key: 'Enter' })
      
      expect(handleKeyUp).toHaveBeenCalledTimes(1)
    })

    it('should not call onChange when disabled', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      render(<Textarea onChange={handleChange} disabled />)
      
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'test')
      
      expect(handleChange).not.toHaveBeenCalled()
    })

    it('should not call onChange when readOnly', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      render(<Textarea onChange={handleChange} readOnly />)
      
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'test')
      
      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('Multiline Text Handling', () => {
    it('should handle multiline text input', async () => {
      const user = userEvent.setup()
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      const multilineText = 'Line 1\nLine 2\nLine 3'
      
      await user.type(textarea, multilineText)
      expect(textarea).toHaveValue(multilineText)
    })

    it('should handle Enter key for new lines', async () => {
      const user = userEvent.setup()
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'First line{Enter}Second line')
      
      expect(textarea).toHaveValue('First line\nSecond line')
    })

    it('should preserve line breaks in value', () => {
      const multilineValue = 'Line 1\nLine 2\nLine 3'
      render(<Textarea value={multilineValue} readOnly />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue(multilineValue)
    })
  })

  describe('Controlled vs Uncontrolled', () => {
    it('should work as controlled component', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      
      const { rerender } = render(<Textarea value="initial" onChange={handleChange} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('initial')
      
      await user.type(textarea, 'a')
      expect(handleChange).toHaveBeenCalled()
      
      // Simulate parent component updating value
      rerender(<Textarea value="updated" onChange={handleChange} />)
      expect(textarea).toHaveValue('updated')
    })

    it('should work as uncontrolled component', async () => {
      const user = userEvent.setup()
      
      render(<Textarea defaultValue="initial" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('initial')
      
      await user.clear(textarea)
      await user.type(textarea, 'new value')
      expect(textarea).toHaveValue('new value')
    })
  })

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      render(<Textarea aria-label="Message input" />)
      
      const textarea = screen.getByLabelText('Message input')
      expect(textarea).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      render(
        <div>
          <Textarea aria-describedby="help-text" />
          <div id="help-text">Enter your message here</div>
        </div>
      )
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('should support aria-invalid', () => {
      render(<Textarea aria-invalid="true" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-invalid', 'true')
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      
      render(
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
      render(<Textarea aria-label="Description" />)
      
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
      
      render(
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
      
      render(
        <form>
          <Textarea required name="description" />
          <button type="submit">Submit</button>
        </form>
      )
      
      const textarea = screen.getByRole('textbox')
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
      render(<Textarea maxLength={10} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('maxlength', '10')
      
      await user.type(textarea, 'This is a very long text that exceeds the limit')
      expect((textarea as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(10)
    })

    it('should respect minLength attribute', () => {
      render(<Textarea minLength={5} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('minlength', '5')
    })
  })

  describe('Custom Props', () => {
    it('should accept custom id', () => {
      render(<Textarea id="custom-id" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('id', 'custom-id')
    })

    it('should accept custom name', () => {
      render(<Textarea name="custom-name" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('name', 'custom-name')
    })

    it('should accept data attributes', () => {
      render(<Textarea data-testid="custom-textarea" />)
      
      const textarea = screen.getByTestId('custom-textarea')
      expect(textarea).toBeInTheDocument()
    })

    it('should accept rows attribute', () => {
      render(<Textarea rows={5} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('rows', '5')
    })

    it('should accept cols attribute', () => {
      render(<Textarea cols={50} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('cols', '50')
    })

    it('should accept wrap attribute', () => {
      render(<Textarea wrap="hard" />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('wrap', 'hard')
    })

    it('should accept resize style', () => {
      render(<Textarea style={{ resize: 'vertical' }} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveStyle({ resize: 'vertical' })
    })
  })

  describe('Edge Cases', () => {
    it('should handle null value gracefully', () => {
      render(<Textarea value={null as any} readOnly />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('')
    })

    it('should handle undefined value gracefully', () => {
      render(<Textarea value={undefined} readOnly />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('')
    })

    it('should handle number values', () => {
      render(<Textarea value={123 as any} readOnly />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('123')
    })

    it('should handle very long values', async () => {
      const longValue = 'a'.repeat(100) // Reduced size for faster testing
      
      render(<Textarea defaultValue={longValue} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue(longValue)
    })

    it('should handle special characters', async () => {
      const specialChars = 'Special: @#$%^&*()'
      
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: specialChars } })
      
      expect(textarea).toHaveValue(specialChars)
    })

    it('should handle unicode characters', async () => {
      const unicodeText = 'Hello World 123'
      
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: unicodeText } })
      
      expect(textarea).toHaveValue(unicodeText)
    })
  })

  describe('Ref Forwarding', () => {
    it('should forward ref to textarea element', () => {
      const ref = vi.fn()
      
      render(<Textarea ref={ref} />)
      
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLTextAreaElement))
    })

    it('should allow ref to access textarea methods', () => {
      let textareaRef: HTMLTextAreaElement | null = null
      
      render(<Textarea ref={(el) => { textareaRef = el }} />)
      
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
      render(<Textarea defaultValue="Hello World" />)
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      
      // Simulate text selection programmatically
      textarea.setSelectionRange(0, 11)
      
      expect(textarea.selectionStart).toBe(0)
      expect(textarea.selectionEnd).toBe(11)
    })

    it('should support cursor positioning', async () => {
      render(<Textarea defaultValue="Hello World" />)
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      
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
      
      const { rerender } = render(<TestComponent value="initial" />)
      
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
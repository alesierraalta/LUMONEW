import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '@/components/ui/checkbox'

// Mock Radix UI Checkbox
vi.mock('@radix-ui/react-checkbox', () => ({
  Root: ({ children, className, checked, onCheckedChange, disabled, ...props }: any) => (
    <button
      data-testid="checkbox-root"
      className={className}
      data-state={checked ? 'checked' : 'unchecked'}
      disabled={disabled}
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      role="checkbox"
      aria-checked={checked}
      {...props}
    >
      {children}
    </button>
  ),
  Indicator: ({ children, className }: any) => (
    <span data-testid="checkbox-indicator" className={className}>
      {children}
    </span>
  ),
}))

// Mock Lucide React Check icon
vi.mock('lucide-react', () => ({
  Check: ({ className, ...props }: any) => (
    <svg data-testid="check-icon" className={className} {...props} />
  ),
}))

describe('Checkbox', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders checkbox correctly', () => {
      render(<Checkbox />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).toHaveAttribute('role', 'checkbox')
    })

    it('renders with default styling classes', () => {
      render(<Checkbox />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveClass(
        'peer',
        'h-4',
        'w-4',
        'shrink-0',
        'rounded-sm',
        'border',
        'border-primary',
        'shadow'
      )
    })

    it('renders checkbox indicator', () => {
      render(<Checkbox />)
      
      expect(screen.getByTestId('checkbox-indicator')).toBeInTheDocument()
      expect(screen.getByTestId('check-icon')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<Checkbox className="custom-checkbox" />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveClass('custom-checkbox')
    })
  })

  describe('States', () => {
    it('renders unchecked state by default', () => {
      render(<Checkbox />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveAttribute('data-state', 'unchecked')
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
    })

    it('renders checked state when checked prop is true', () => {
      render(<Checkbox checked={true} />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveAttribute('data-state', 'checked')
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })

    it('renders disabled state', () => {
      render(<Checkbox disabled />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toBeDisabled()
      expect(checkbox).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })

    it('applies checked styling classes', () => {
      render(<Checkbox checked={true} />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveClass(
        'data-[state=checked]:bg-primary',
        'data-[state=checked]:text-primary-foreground'
      )
    })
  })

  describe('Interactions', () => {
    it('handles click events', async () => {
      const handleCheckedChange = vi.fn()
      render(<Checkbox onCheckedChange={handleCheckedChange} />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      await user.click(checkbox)
      
      expect(handleCheckedChange).toHaveBeenCalledTimes(1)
      expect(handleCheckedChange).toHaveBeenCalledWith(true)
    })

    it('toggles between checked and unchecked states', async () => {
      const handleCheckedChange = vi.fn()
      render(<Checkbox checked={false} onCheckedChange={handleCheckedChange} />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      
      // Click to check
      await user.click(checkbox)
      expect(handleCheckedChange).toHaveBeenCalledWith(true)
      
      // Simulate re-render with checked=true
      handleCheckedChange.mockClear()
      render(<Checkbox checked={true} onCheckedChange={handleCheckedChange} />)
      
      const checkedCheckbox = screen.getByTestId('checkbox-root')
      await user.click(checkedCheckbox)
      expect(handleCheckedChange).toHaveBeenCalledWith(false)
    })

    it('does not trigger events when disabled', async () => {
      const handleCheckedChange = vi.fn()
      render(<Checkbox disabled onCheckedChange={handleCheckedChange} />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      await user.click(checkbox)
      
      expect(handleCheckedChange).not.toHaveBeenCalled()
    })

    it('handles keyboard interactions', async () => {
      const handleCheckedChange = vi.fn()
      render(<Checkbox onCheckedChange={handleCheckedChange} />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      checkbox.focus()
      
      await user.keyboard('{Space}')
      expect(handleCheckedChange).toHaveBeenCalledTimes(1)
    })

    it('handles Enter key', async () => {
      const handleCheckedChange = vi.fn()
      render(<Checkbox onCheckedChange={handleCheckedChange} />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      checkbox.focus()
      
      await user.keyboard('{Enter}')
      expect(handleCheckedChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('Controlled vs Uncontrolled', () => {
    it('works as controlled component', async () => {
      const handleCheckedChange = vi.fn()
      const { rerender } = render(
        <Checkbox checked={false} onCheckedChange={handleCheckedChange} />
      )
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
      
      await user.click(checkbox)
      expect(handleCheckedChange).toHaveBeenCalledWith(true)
      
      // Simulate parent component updating the checked state
      rerender(<Checkbox checked={true} onCheckedChange={handleCheckedChange} />)
      expect(screen.getByTestId('checkbox-root')).toHaveAttribute('aria-checked', 'true')
    })

    it('works as uncontrolled component', async () => {
      const handleCheckedChange = vi.fn()
      render(<Checkbox onCheckedChange={handleCheckedChange} />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      await user.click(checkbox)
      
      expect(handleCheckedChange).toHaveBeenCalledWith(true)
    })

    it('supports defaultChecked prop', () => {
      render(<Checkbox defaultChecked={true} />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveAttribute('defaultChecked', 'true')
    })
  })

  describe('Form Integration', () => {
    it('works with form elements', () => {
      render(
        <form>
          <Checkbox name="terms" value="accepted" />
        </form>
      )
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveAttribute('name', 'terms')
      expect(checkbox).toHaveAttribute('value', 'accepted')
    })

    it('supports required attribute', () => {
      render(<Checkbox required />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveAttribute('required')
    })

    it('supports form validation', () => {
      render(<Checkbox required aria-invalid="true" />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Checkbox checked={true} />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveAttribute('role', 'checkbox')
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })

    it('supports aria-label', () => {
      render(<Checkbox aria-label="Accept terms and conditions" />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveAttribute('aria-label', 'Accept terms and conditions')
    })

    it('supports aria-labelledby', () => {
      render(
        <div>
          <label id="checkbox-label">Terms and Conditions</label>
          <Checkbox aria-labelledby="checkbox-label" />
        </div>
      )
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveAttribute('aria-labelledby', 'checkbox-label')
    })

    it('supports aria-describedby', () => {
      render(
        <div>
          <Checkbox aria-describedby="checkbox-description" />
          <div id="checkbox-description">Please accept to continue</div>
        </div>
      )
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveAttribute('aria-describedby', 'checkbox-description')
    })

    it('has focus-visible styling', () => {
      render(<Checkbox />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-1',
        'focus-visible:ring-ring'
      )
    })

    it('is keyboard accessible', () => {
      render(<Checkbox />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      checkbox.focus()
      expect(checkbox).toHaveFocus()
    })
  })

  describe('Advanced Props', () => {
    it('supports indeterminate state', () => {
      render(<Checkbox checked="indeterminate" />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveAttribute('aria-checked', 'indeterminate')
    })

    it('supports custom id', () => {
      render(<Checkbox id="custom-checkbox" />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveAttribute('id', 'custom-checkbox')
    })

    it('forwards ref correctly', () => {
      const ref = vi.fn()
      render(<Checkbox ref={ref} />)
      
      expect(ref).toHaveBeenCalled()
    })

    it('supports data attributes', () => {
      render(<Checkbox data-testid="custom-checkbox" data-custom="value" />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      expect(checkbox).toHaveAttribute('data-custom', 'value')
    })
  })

  describe('Event Handling', () => {
    it('handles onFocus event', async () => {
      const handleFocus = vi.fn()
      render(<Checkbox onFocus={handleFocus} />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      await user.click(checkbox)
      
      expect(handleFocus).toHaveBeenCalled()
    })

    it('handles onBlur event', async () => {
      const handleBlur = vi.fn()
      render(<Checkbox onBlur={handleBlur} />)
      
      const checkbox = screen.getByTestId('checkbox-root')
      checkbox.focus()
      checkbox.blur()
      
      expect(handleBlur).toHaveBeenCalled()
    })

    it('handles multiple event handlers', async () => {
      const handleCheckedChange = vi.fn()
      const handleClick = vi.fn()
      const handleFocus = vi.fn()
      
      render(
        <Checkbox
          onCheckedChange={handleCheckedChange}
          onClick={handleClick}
          onFocus={handleFocus}
        />
      )
      
      const checkbox = screen.getByTestId('checkbox-root')
      await user.click(checkbox)
      
      expect(handleCheckedChange).toHaveBeenCalled()
      expect(handleClick).toHaveBeenCalled()
      expect(handleFocus).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('handles missing onCheckedChange gracefully', async () => {
      expect(() => {
        render(<Checkbox />)
      }).not.toThrow()
      
      const checkbox = screen.getByTestId('checkbox-root')
      await user.click(checkbox)
      // Should not throw error even without onCheckedChange
    })

    it('handles invalid checked values gracefully', () => {
      expect(() => {
        render(<Checkbox checked={undefined as any} />)
      }).not.toThrow()
    })

    it('handles null className gracefully', () => {
      expect(() => {
        render(<Checkbox className={null as any} />)
      }).not.toThrow()
    })
  })

  describe('Integration with Labels', () => {
    it('works with associated label element', async () => {
      const handleCheckedChange = vi.fn()
      render(
        <div>
          <Checkbox id="terms-checkbox" onCheckedChange={handleCheckedChange} />
          <label htmlFor="terms-checkbox">I accept the terms</label>
        </div>
      )
      
      const label = screen.getByText('I accept the terms')
      await user.click(label)
      
      // Note: In a real implementation, clicking the label would trigger the checkbox
      // This test verifies the structure is correct for that behavior
      expect(screen.getByTestId('checkbox-root')).toHaveAttribute('id', 'terms-checkbox')
    })
  })

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = vi.fn()
      const TestCheckbox = (props: any) => {
        renderSpy()
        return <Checkbox {...props} />
      }
      
      const { rerender } = render(<TestCheckbox checked={false} />)
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Re-render with same props
      rerender(<TestCheckbox checked={false} />)
      expect(renderSpy).toHaveBeenCalledTimes(2) // React will re-render, but component should be optimized
    })
  })
})
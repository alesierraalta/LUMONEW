import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { screen, fireEvent, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { simpleRender, setupCommonMocks } from '../../utils/test-render'
import { Button, buttonVariants } from '@/components/ui/button'

beforeAll(() => {
  setupCommonMocks()
})

beforeEach(() => {
  cleanup()
})

describe('Button', () => {
  describe('Rendering', () => {
    it('should render button with default props', () => {
      simpleRender(<Button>Click me</Button>)
      
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('type', 'button')
    })

    it('should render button with custom text', () => {
      simpleRender(<Button>Custom Button Text</Button>)
      
      expect(screen.getByText('Custom Button Text')).toBeInTheDocument()
    })

    it('should render as child component when asChild is true', () => {
      simpleRender(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      
      const link = screen.getByRole('link', { name: 'Link Button' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
    })
  })

  describe('Variants', () => {
    it('should apply default variant styles', () => {
      simpleRender(<Button>Default</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('should apply destructive variant styles', () => {
      simpleRender(<Button variant="destructive">Delete</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground')
    })

    it('should apply outline variant styles', () => {
      simpleRender(<Button variant="outline">Outline</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'border-input', 'bg-background')
    })

    it('should apply secondary variant styles', () => {
      simpleRender(<Button variant="secondary">Secondary</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })

    it('should apply ghost variant styles', () => {
      simpleRender(<Button variant="ghost">Ghost</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground')
    })

    it('should apply link variant styles', () => {
      simpleRender(<Button variant="link">Link</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-primary', 'underline-offset-4', 'hover:underline')
    })
  })

  describe('Sizes', () => {
    it('should apply default size styles', () => {
      simpleRender(<Button>Default Size</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9', 'px-4', 'py-2')
    })

    it('should apply small size styles', () => {
      simpleRender(<Button size="sm">Small</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-8', 'px-3', 'text-xs')
    })

    it('should apply large size styles', () => {
      simpleRender(<Button size="lg">Large</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'px-8')
    })

    it('should apply icon size styles', () => {
      simpleRender(<Button size="icon">🔍</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9', 'w-9')
    })
  })

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      simpleRender(<Button disabled>Disabled</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })

    it('should not be disabled by default', () => {
      simpleRender(<Button>Enabled</Button>)
      
      const button = screen.getByRole('button')
      expect(button).not.toBeDisabled()
    })
  })

  describe('Event Handling', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      simpleRender(<Button onClick={handleClick}>Click me</Button>)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      
      simpleRender(<Button onClick={handleClick} disabled>Disabled</Button>)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should handle keyboard events', () => {
      const handleKeyDown = vi.fn()
      
      simpleRender(<Button onKeyDown={handleKeyDown}>Keyboard</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.keyDown(button, { key: 'Enter' })
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1)
    })
  })

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      simpleRender(<Button className="custom-class">Custom</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should accept custom type attribute', () => {
      simpleRender(<Button type="submit">Submit</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should accept custom id', () => {
      simpleRender(<Button id="custom-id">Custom ID</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('id', 'custom-id')
    })

    it('should accept data attributes', () => {
      simpleRender(<Button data-testid="custom-button">Data Attr</Button>)
      
      const button = screen.getByTestId('custom-button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper focus styles', () => {
      simpleRender(<Button>Focus me</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-1', 'focus-visible:ring-ring')
    })

    it('should support aria-label', () => {
      simpleRender(<Button aria-label="Close dialog">×</Button>)
      
      const button = screen.getByRole('button', { name: 'Close dialog' })
      expect(button).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      simpleRender(
        <div>
          <Button aria-describedby="help-text">Help</Button>
          <div id="help-text">This button provides help</div>
        </div>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      
      simpleRender(
        <div>
          <Button>First</Button>
          <Button>Second</Button>
        </div>
      )
      
      const firstButton = screen.getByRole('button', { name: 'First' })
      const secondButton = screen.getByRole('button', { name: 'Second' })
      
      await user.tab()
      expect(firstButton).toHaveFocus()
      
      await user.tab()
      expect(secondButton).toHaveFocus()
    })
  })

  describe('Icon Support', () => {
    it('should render with icons', () => {
      simpleRender(
        <Button>
          <span>🔍</span>
          Search
        </Button>
      )
      
      expect(screen.getByText('🔍')).toBeInTheDocument()
      expect(screen.getByText('Search')).toBeInTheDocument()
    })

    it('should apply icon-specific styles', () => {
      simpleRender(<Button>Test</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('[&_svg]:pointer-events-none', '[&_svg]:size-4', '[&_svg]:shrink-0')
    })
  })

  describe('Button Variants Function', () => {
    it('should generate correct classes for default variant', () => {
      const classes = buttonVariants()
      expect(classes).toContain('bg-primary')
      expect(classes).toContain('text-primary-foreground')
      expect(classes).toContain('h-9')
      expect(classes).toContain('px-4')
    })

    it('should generate correct classes for destructive variant', () => {
      const classes = buttonVariants({ variant: 'destructive' })
      expect(classes).toContain('bg-destructive')
      expect(classes).toContain('text-destructive-foreground')
    })

    it('should generate correct classes for small size', () => {
      const classes = buttonVariants({ size: 'sm' })
      expect(classes).toContain('h-8')
      expect(classes).toContain('px-3')
      expect(classes).toContain('text-xs')
    })

    it('should combine variant and size classes', () => {
      const classes = buttonVariants({ variant: 'outline', size: 'lg' })
      expect(classes).toContain('border')
      expect(classes).toContain('border-input')
      expect(classes).toContain('h-10')
      expect(classes).toContain('px-8')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      simpleRender(<Button></Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toBeEmptyDOMElement()
    })

    it('should handle null children', () => {
      simpleRender(<Button>{null}</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should handle multiple children', () => {
      simpleRender(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      )
      
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })

    it('should handle complex children', () => {
      simpleRender(
        <Button>
          <div>
            <span>Complex</span>
            <strong>Content</strong>
          </div>
        </Button>
      )
      
      expect(screen.getByText('Complex')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('Form Integration', () => {
    it('should work as form submit button', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault())
      
      simpleRender(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit Form</Button>
        </form>
      )
      
      const button = screen.getByRole('button', { name: 'Submit Form' })
      fireEvent.click(button)
      
      expect(handleSubmit).toHaveBeenCalledTimes(1)
    })

    it('should work as form reset button', () => {
      simpleRender(
        <form>
          <input defaultValue="test" />
          <Button type="reset">Reset Form</Button>
        </form>
      )
      
      const input = screen.getByRole('textbox')
      const button = screen.getByRole('button', { name: 'Reset Form' })
      
      expect(input).toHaveValue('test')
      fireEvent.click(button)
      expect(input).toHaveValue('')
    })
  })
})
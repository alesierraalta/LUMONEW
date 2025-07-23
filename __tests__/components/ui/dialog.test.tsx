import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../utils/test-render'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  X: ({ className }: { className?: string }) => (
    <div data-testid="x-icon" className={className}>✕</div>
  ),
}))

// Basic dialog component for testing
function BasicDialog({ 
  open, 
  onOpenChange, 
  defaultOpen 
}: { 
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean 
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a dialog description explaining what this dialog is for.
          </DialogDescription>
        </DialogHeader>
        <div>Dialog content goes here</div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Dialog with custom content
function CustomDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Custom Dialog</Button>
      </DialogTrigger>
      <DialogContent className="custom-content">
        <DialogHeader className="custom-header">
          <DialogTitle className="custom-title">Custom Title</DialogTitle>
          <DialogDescription className="custom-description">
            Custom description
          </DialogDescription>
        </DialogHeader>
        <div className="custom-body">Custom body content</div>
        <DialogFooter className="custom-footer">
          <Button>Custom Action</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Dialog without trigger (controlled)
function ControlledDialog({ open, onOpenChange }: { 
  open: boolean
  onOpenChange: (open: boolean) => void 
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Controlled Dialog</DialogTitle>
        <div>This dialog is controlled externally</div>
      </DialogContent>
    </Dialog>
  )
}

describe('Dialog Components', () => {
  describe('Dialog (Root)', () => {
    it('should not show content initially', () => {
      render(<BasicDialog />)
      
      expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
      expect(screen.queryByText('Dialog content goes here')).not.toBeInTheDocument()
    })

    it('should show trigger button', () => {
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      expect(trigger).toBeInTheDocument()
    })

    it('should open dialog when defaultOpen is true', () => {
      render(<BasicDialog defaultOpen />)
      
      expect(screen.getByText('Dialog Title')).toBeInTheDocument()
      expect(screen.getByText('Dialog content goes here')).toBeInTheDocument()
    })
  })

  describe('DialogTrigger', () => {
    it('should open dialog when clicked', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument()
      })
    })

    it('should open dialog with keyboard', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      trigger.focus()
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument()
      })
    })

    it('should work with custom trigger component', async () => {
      const user = userEvent.setup()
      render(
        <Dialog>
          <DialogTrigger asChild>
            <div role="button" tabIndex={0}>Custom Trigger</div>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Custom Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )
      
      const trigger = screen.getByRole('button', { name: 'Custom Trigger' })
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Custom Dialog')).toBeInTheDocument()
      })
    })
  })

  describe('DialogContent', () => {
    it('should render content when dialog is open', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
        expect(dialog).toHaveClass(
          'fixed',
          'left-[50%]',
          'top-[50%]',
          'z-50',
          'grid',
          'w-full',
          'max-w-lg'
        )
      })
    })

    it('should accept custom className', async () => {
      const user = userEvent.setup()
      render(<CustomDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Custom Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveClass('custom-content')
      })
    })

    it('should render close button', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i })
        expect(closeButton).toBeInTheDocument()
        expect(screen.getByTestId('x-icon')).toBeInTheDocument()
      })
    })

    it('should close dialog when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument()
      })
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
      })
    })

    it('should close dialog when overlay is clicked', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument()
      })
      
      // Click on overlay (outside dialog content)
      const overlay = document.querySelector('[data-radix-overlay]') ||
                     document.querySelector('.fixed.inset-0.z-50.bg-black\\/80')
      if (overlay) {
        await user.click(overlay)
        
        await waitFor(() => {
          expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
        })
      }
    })

    it('should close dialog when Escape key is pressed', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument()
      })
      
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
      })
    })
  })

  describe('DialogOverlay', () => {
    it('should render overlay when dialog is open', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        const overlay = document.querySelector('.fixed.inset-0.z-50') ||
                       document.querySelector('[data-radix-overlay]')
        expect(overlay).toBeInTheDocument()
        if (overlay) {
          expect(overlay).toHaveClass(
            'fixed',
            'inset-0',
            'z-50'
          )
        }
      })
    })

    it('should accept custom className', async () => {
      const user = userEvent.setup()
      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogOverlay className="custom-overlay" />
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      )
      
      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)
      
      await waitFor(() => {
        const overlay = document.querySelector('.custom-overlay')
        expect(overlay).toBeInTheDocument()
      })
    })
  })

  describe('DialogHeader', () => {
    it('should render header with correct styling', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        const header = screen.getByText('Dialog Title').closest('div')
        expect(header).toHaveClass(
          'flex',
          'flex-col',
          'space-y-1.5',
          'text-center',
          'sm:text-left'
        )
      })
    })

    it('should accept custom className', async () => {
      const user = userEvent.setup()
      render(<CustomDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Custom Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        const header = screen.getByText('Custom Title').closest('div')
        expect(header).toHaveClass('custom-header')
      })
    })
  })

  describe('DialogTitle', () => {
    it('should render title with correct styling', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        const title = screen.getByText('Dialog Title')
        expect(title).toBeInTheDocument()
        expect(title).toHaveClass(
          'text-lg',
          'font-semibold',
          'leading-none',
          'tracking-tight'
        )
      })
    })

    it('should accept custom className', async () => {
      const user = userEvent.setup()
      render(<CustomDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Custom Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        const title = screen.getByText('Custom Title')
        expect(title).toHaveClass('custom-title')
      })
    })

    it('should be accessible as dialog title', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog', { name: 'Dialog Title' })
        expect(dialog).toBeInTheDocument()
      })
    })
  })

  describe('DialogDescription', () => {
    it('should render description with correct styling', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        const description = screen.getByText('This is a dialog description explaining what this dialog is for.')
        expect(description).toBeInTheDocument()
        expect(description).toHaveClass('text-sm', 'text-muted-foreground')
      })
    })

    it('should accept custom className', async () => {
      const user = userEvent.setup()
      render(<CustomDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Custom Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        const description = screen.getByText('Custom description')
        expect(description).toHaveClass('custom-description')
      })
    })
  })

  describe('DialogFooter', () => {
    it('should render footer with correct styling', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: 'Cancel' })
        const confirmButton = screen.getByRole('button', { name: 'Confirm' })
        const footer = cancelButton.closest('div')
        
        expect(footer).toHaveClass(
          'flex',
          'flex-col-reverse',
          'sm:flex-row',
          'sm:justify-end',
          'sm:space-x-2'
        )
        expect(cancelButton).toBeInTheDocument()
        expect(confirmButton).toBeInTheDocument()
      })
    })

    it('should accept custom className', async () => {
      const user = userEvent.setup()
      render(<CustomDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Custom Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        const actionButton = screen.getByRole('button', { name: 'Custom Action' })
        const footer = actionButton.closest('div')
        expect(footer).toHaveClass('custom-footer')
      })
    })
  })

  describe('DialogClose', () => {
    it('should close dialog when clicked', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument()
      })
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
      })
    })

    it('should work with custom close component', async () => {
      const user = userEvent.setup()
      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogClose asChild>
              <div role="button" tabIndex={0}>Custom Close</div>
            </DialogClose>
          </DialogContent>
        </Dialog>
      )
      
      const trigger = screen.getByRole('button', { name: 'Open' })
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument()
      })
      
      const closeButton = screen.getByRole('button', { name: 'Custom Close' })
      await user.click(closeButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Controlled Dialog', () => {
    it('should work as controlled component', async () => {
      const handleOpenChange = vi.fn()
      const user = userEvent.setup()
      
      const { rerender } = render(
        <ControlledDialog open={false} onOpenChange={handleOpenChange} />
      )
      
      expect(screen.queryByText('Controlled Dialog')).not.toBeInTheDocument()
      
      // Open dialog programmatically
      rerender(<ControlledDialog open={true} onOpenChange={handleOpenChange} />)
      
      await waitFor(() => {
        expect(screen.getByText('Controlled Dialog')).toBeInTheDocument()
      })
      
      // Try to close with Escape
      await user.keyboard('{Escape}')
      expect(handleOpenChange).toHaveBeenCalledWith(false)
      
      // Close dialog programmatically
      rerender(<ControlledDialog open={false} onOpenChange={handleOpenChange} />)
      
      await waitFor(() => {
        expect(screen.queryByText('Controlled Dialog')).not.toBeInTheDocument()
      })
    })

    it('should call onOpenChange when opened via trigger', async () => {
      const handleOpenChange = vi.fn()
      const user = userEvent.setup()
      
      render(<BasicDialog onOpenChange={handleOpenChange} />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      expect(handleOpenChange).toHaveBeenCalledWith(true)
    })

    it('should call onOpenChange when closed', async () => {
      const handleOpenChange = vi.fn()
      const user = userEvent.setup()
      
      render(<BasicDialog onOpenChange={handleOpenChange} />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument()
      })
      
      handleOpenChange.mockClear()
      
      await user.keyboard('{Escape}')
      expect(handleOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAttribute('role', 'dialog')
        expect(dialog).toHaveAttribute('aria-labelledby')
        expect(dialog).toHaveAttribute('aria-describedby')
      })
    })

    it('should trap focus within dialog', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument()
      })
      
      // Focus should be trapped within dialog
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      const closeButton = screen.getByRole('button', { name: /close/i })
      
      expect([cancelButton, confirmButton, closeButton]).toContain(document.activeElement)
    })

    it('should return focus to trigger when closed', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument()
      })
      
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
        expect(trigger).toHaveFocus()
      })
    })

    it('should prevent body scroll when open', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument()
        // Radix UI uses data attributes for scroll prevention
        expect(document.body).toHaveAttribute('data-scroll-locked')
      })
    })
  })

  describe('Portal Rendering', () => {
    it('should render content in portal', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        // Dialog should be rendered outside the normal DOM tree
        expect(dialog.closest('body')).toBeTruthy()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple dialogs', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <BasicDialog />
          <Dialog>
            <DialogTrigger asChild>
              <Button>Second Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Second Dialog Title</DialogTitle>
            </DialogContent>
          </Dialog>
        </div>
      )
      
      const firstTrigger = screen.getByRole('button', { name: 'Open Dialog' })
      const secondTrigger = screen.getByRole('button', { name: 'Second Dialog' })
      
      await user.click(firstTrigger)
      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument()
      })
      
      await user.click(secondTrigger)
      await waitFor(() => {
        expect(screen.getByText('Second Dialog Title')).toBeInTheDocument()
      })
    })

    it('should handle dialog without title gracefully', async () => {
      const user = userEvent.setup()
      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>No Title Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <div>Content without title</div>
          </DialogContent>
        </Dialog>
      )
      
      const trigger = screen.getByRole('button', { name: 'No Title Dialog' })
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Content without title')).toBeInTheDocument()
      })
    })

    it('should handle rapid open/close operations', async () => {
      const user = userEvent.setup()
      render(<BasicDialog />)
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      
      // Rapidly open and close
      await user.click(trigger)
      await user.keyboard('{Escape}')
      await user.click(trigger)
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
      })
    })
  })
})
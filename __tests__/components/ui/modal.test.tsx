import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../utils/test-render'
import React from 'react'

// Mock the utils module first
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}))

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  X: ({ className }: { className?: string }) => (
    <div data-testid="x-icon" className={className}>✕</div>
  ),
}))

// Import modal components after mocking
import { ModalProvider, useModal, ConfirmationModal } from '@/components/ui/modal'

// Clean up document body styles and timeouts after each test
afterEach(() => {
  document.body.style.overflow = ''
  
  // Clean up any pending modal timeouts to prevent unhandled errors
  if (typeof window !== 'undefined' && (window as any).__modalTimeoutId) {
    clearTimeout((window as any).__modalTimeoutId)
    ;(window as any).__modalTimeoutId = undefined
  }
})

// Simple test component
function SimpleTestComponent() {
  const { openModal, closeModal, isOpen } = useModal()

  const handleOpen = () => {
    openModal(
      <div data-testid="modal-content">
        <h2>Test Modal</h2>
        <button onClick={closeModal} data-testid="close-button">Close</button>
      </div>
    )
  }

  return (
    <div>
      <button onClick={handleOpen} data-testid="open-button">Open Modal</button>
      <span data-testid="modal-state">{isOpen ? 'open' : 'closed'}</span>
    </div>
  )
}

// Component to test hook outside provider
function ComponentWithoutProvider() {
  try {
    useModal()
    return <div>Should not render</div>
  } catch (error) {
    return <div data-testid="error-message">Error: {(error as Error).message}</div>
  }
}

describe('Modal Components', () => {
  describe('ModalProvider', () => {
    it('should provide modal context to children', () => {
      render(
        <ModalProvider>
          <SimpleTestComponent />
        </ModalProvider>
      )

      expect(screen.getByTestId('open-button')).toBeInTheDocument()
      expect(screen.getByTestId('modal-state')).toHaveTextContent('closed')
    })

    it('should render children without modal initially', () => {
      render(
        <ModalProvider>
          <div data-testid="test-content">Test content</div>
        </ModalProvider>
      )

      expect(screen.getByTestId('test-content')).toBeInTheDocument()
      expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument()
    })
  })

  describe('useModal Hook', () => {
    it('should throw error when used outside provider', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<ComponentWithoutProvider />)

      expect(screen.getByTestId('error-message')).toHaveTextContent('useModal must be used within a ModalProvider')

      consoleSpy.mockRestore()
    })

    it('should provide modal functions when used within provider', () => {
      render(
        <ModalProvider>
          <SimpleTestComponent />
        </ModalProvider>
      )

      expect(screen.getByTestId('open-button')).toBeInTheDocument()
      expect(screen.getByTestId('modal-state')).toHaveTextContent('closed')
    })
  })

  describe('Modal Opening and Closing', () => {
    it('should open modal when openModal is called', async () => {
      const user = userEvent.setup()

      render(
        <ModalProvider>
          <SimpleTestComponent />
        </ModalProvider>
      )

      const openButton = screen.getByTestId('open-button')
      await user.click(openButton)

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByTestId('modal-content')).toBeInTheDocument()
      }, { timeout: 1000 })
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-state')).toHaveTextContent('open')
    })

    it('should close modal when closeModal is called', async () => {
      const user = userEvent.setup()

      render(
        <ModalProvider>
          <SimpleTestComponent />
        </ModalProvider>
      )

      const openButton = screen.getByTestId('open-button')
      await user.click(openButton)

      await waitFor(() => {
        expect(screen.getByTestId('modal-content')).toBeInTheDocument()
      }, { timeout: 1000 })

      const closeButton = screen.getByTestId('close-button')
      await user.click(closeButton)

      // Wait for modal to close (with animation delay)
      await waitFor(() => {
        expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument()
        expect(screen.getByTestId('modal-state')).toHaveTextContent('closed')
      }, { timeout: 1000 })
    })

    it('should close modal when clicking overlay', async () => {
      const user = userEvent.setup()

      render(
        <ModalProvider>
          <SimpleTestComponent />
        </ModalProvider>
      )

      const openButton = screen.getByTestId('open-button')
      await user.click(openButton)

      await waitFor(() => {
        expect(screen.getByTestId('modal-content')).toBeInTheDocument()
      }, { timeout: 1000 })

      // Click on overlay (outside modal content)
      const overlay = document.querySelector('.fixed.inset-0')
      if (overlay) {
        fireEvent.click(overlay)
      }

      await waitFor(() => {
        expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should close modal when clicking X button', async () => {
      const user = userEvent.setup()

      render(
        <ModalProvider>
          <SimpleTestComponent />
        </ModalProvider>
      )

      const openButton = screen.getByTestId('open-button')
      await user.click(openButton)

      await waitFor(() => {
        expect(screen.getByTestId('modal-content')).toBeInTheDocument()
      }, { timeout: 1000 })

      // Find and click X button
      const xButton = screen.getByTestId('x-icon').closest('button')
      if (xButton) {
        await user.click(xButton)
      }

      await waitFor(() => {
        expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Modal Options', () => {
    it('should apply size options correctly', async () => {
      const user = userEvent.setup()

      function SizeTestComponent() {
        const { openModal } = useModal()

        const handleOpen = () => {
          openModal(
            <div data-testid="large-modal">Large Modal</div>,
            { size: 'lg' }
          )
        }

        return <button onClick={handleOpen} data-testid="open-large">Open Large</button>
      }

      render(
        <ModalProvider>
          <SizeTestComponent />
        </ModalProvider>
      )

      const openButton = screen.getByTestId('open-large')
      await user.click(openButton)

      await waitFor(() => {
        const modalContent = document.querySelector('.max-w-2xl')
        expect(modalContent).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should respect closable option', async () => {
      const user = userEvent.setup()

      function NonClosableComponent() {
        const { openModal } = useModal()

        const handleOpen = () => {
          openModal(
            <div data-testid="non-closable-modal">Non-closable Modal</div>,
            { closable: false }
          )
        }

        return <button onClick={handleOpen} data-testid="open-non-closable">Open Non-closable</button>
      }

      render(
        <ModalProvider>
          <NonClosableComponent />
        </ModalProvider>
      )

      const openButton = screen.getByTestId('open-non-closable')
      await user.click(openButton)

      await waitFor(() => {
        expect(screen.getByTestId('non-closable-modal')).toBeInTheDocument()
      }, { timeout: 1000 })

      // X button should not be present when closable is false
      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument()

      // Clicking overlay should not close modal when closable is false
      const overlay = document.querySelector('.fixed.inset-0')
      if (overlay) {
        fireEvent.click(overlay)
      }

      // Modal should still be open after a short wait
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(screen.getByTestId('non-closable-modal')).toBeInTheDocument()
    })
  })

  describe('ConfirmationModal', () => {
    it('should render confirmation modal with correct content', async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      function ConfirmationTestComponent() {
        const { openModal } = useModal()

        const handleOpen = () => {
          openModal(
            <ConfirmationModal
              title="Test Confirmation"
              message="Are you sure?"
              onConfirm={onConfirm}
              onCancel={onCancel}
            />
          )
        }

        return <button onClick={handleOpen} data-testid="open-confirmation">Open Confirmation</button>
      }

      render(
        <ModalProvider>
          <ConfirmationTestComponent />
        </ModalProvider>
      )

      const openButton = screen.getByTestId('open-confirmation')
      await user.click(openButton)

      await waitFor(() => {
        expect(screen.getByText('Test Confirmation')).toBeInTheDocument()
        expect(screen.getByText('Are you sure?')).toBeInTheDocument()
        expect(screen.getByText('Confirmar')).toBeInTheDocument()
        expect(screen.getByText('Cancelar')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should call onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      function ConfirmationTestComponent() {
        const { openModal } = useModal()

        const handleOpen = () => {
          openModal(
            <ConfirmationModal
              title="Test Confirmation"
              message="Are you sure?"
              onConfirm={onConfirm}
              onCancel={onCancel}
            />
          )
        }

        return <button onClick={handleOpen} data-testid="open-confirmation">Open Confirmation</button>
      }

      render(
        <ModalProvider>
          <ConfirmationTestComponent />
        </ModalProvider>
      )

      const openButton = screen.getByTestId('open-confirmation')
      await user.click(openButton)

      await waitFor(() => {
        expect(screen.getByText('Test Confirmation')).toBeInTheDocument()
      }, { timeout: 1000 })

      const confirmButton = screen.getByText('Confirmar')
      await user.click(confirmButton)

      expect(onConfirm).toHaveBeenCalled()
      expect(onCancel).not.toHaveBeenCalled()
    })

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      function ConfirmationTestComponent() {
        const { openModal } = useModal()

        const handleOpen = () => {
          openModal(
            <ConfirmationModal
              title="Test Confirmation"
              message="Are you sure?"
              onConfirm={onConfirm}
              onCancel={onCancel}
            />
          )
        }

        return <button onClick={handleOpen} data-testid="open-confirmation">Open Confirmation</button>
      }

      render(
        <ModalProvider>
          <ConfirmationTestComponent />
        </ModalProvider>
      )

      const openButton = screen.getByTestId('open-confirmation')
      await user.click(openButton)

      await waitFor(() => {
        expect(screen.getByText('Test Confirmation')).toBeInTheDocument()
      }, { timeout: 1000 })

      const cancelButton = screen.getByText('Cancelar')
      await user.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
      expect(onConfirm).not.toHaveBeenCalled()
    })
  })

  describe('Body Scroll Prevention', () => {
    it('should prevent body scroll when modal is open', async () => {
      const user = userEvent.setup()

      render(
        <ModalProvider>
          <SimpleTestComponent />
        </ModalProvider>
      )

      // Initially body overflow should be empty string (default)
      expect(document.body.style.overflow).toBe('')

      const openButton = screen.getByTestId('open-button')
      await user.click(openButton)

      // After opening modal, body overflow should be hidden
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden')
      }, { timeout: 1000 })

      const closeButton = screen.getByTestId('close-button')
      await user.click(closeButton)

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('unset')
      }, { timeout: 1000 })
    })
  })

  describe('Accessibility', () => {
    it('should have proper modal overlay structure', async () => {
      const user = userEvent.setup()

      render(
        <ModalProvider>
          <SimpleTestComponent />
        </ModalProvider>
      )

      const openButton = screen.getByTestId('open-button')
      await user.click(openButton)

      await waitFor(() => {
        const overlay = document.querySelector('.fixed.inset-0')
        expect(overlay).toBeInTheDocument()
        expect(overlay).toHaveClass('z-50')
      }, { timeout: 1000 })
    })

    it('should prevent clicks on content from closing modal', async () => {
      const user = userEvent.setup()

      render(
        <ModalProvider>
          <SimpleTestComponent />
        </ModalProvider>
      )

      const openButton = screen.getByTestId('open-button')
      await user.click(openButton)

      await waitFor(() => {
        expect(screen.getByTestId('modal-content')).toBeInTheDocument()
      }, { timeout: 1000 })

      // Click on modal content should not close modal
      const modalContent = screen.getByTestId('modal-content')
      await user.click(modalContent)

      // Modal should still be open
      expect(screen.getByTestId('modal-content')).toBeInTheDocument()
    })
  })
})
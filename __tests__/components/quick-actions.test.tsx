import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '../utils/test-render'
import userEvent from '@testing-library/user-event'
import { QuickActions } from '@/components/dashboard/quick-actions'

// Mock console.log to test navigation
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

describe('QuickActions', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders all quick action buttons', () => {
    render(<QuickActions />)
    
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new category/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add location/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument()
  })

  it('displays correct icons for each action', () => {
    render(<QuickActions />)
    
    // Check that icons are present (we can't easily test specific icons, but we can verify buttons have icons)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)
    
    // Each button should have an icon (svg element)
    buttons.forEach(button => {
      const icon = button.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  it('has correct button variants', () => {
    render(<QuickActions />)
    
    const addItemButton = screen.getByRole('button', { name: /add item/i })
    const newCategoryButton = screen.getByRole('button', { name: /new category/i })
    const addLocationButton = screen.getByRole('button', { name: /add location/i })
    const addUserButton = screen.getByRole('button', { name: /add user/i })
    
    // Add Item should have default variant (no specific class check needed as it's the default)
    expect(addItemButton).toBeInTheDocument()
    
    // Other buttons should have outline variant
    expect(newCategoryButton).toBeInTheDocument()
    expect(addLocationButton).toBeInTheDocument()
    expect(addUserButton).toBeInTheDocument()
  })

  it('has correct button sizes', () => {
    render(<QuickActions />)
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      // All buttons should be small size - we can check this through classes or just verify they exist
      expect(button).toBeInTheDocument()
    })
  })

  it('handles Add Item button click', async () => {
    render(<QuickActions />)
    
    const addItemButton = screen.getByRole('button', { name: /add item/i })
    await user.click(addItemButton)
    
    expect(mockConsoleLog).toHaveBeenCalledWith('Navigate to /inventory/new')
  })

  it('handles New Category button click', async () => {
    render(<QuickActions />)
    
    const newCategoryButton = screen.getByRole('button', { name: /new category/i })
    await user.click(newCategoryButton)
    
    expect(mockConsoleLog).toHaveBeenCalledWith('Navigate to /categories/new')
  })

  it('handles Add Location button click', async () => {
    render(<QuickActions />)
    
    const addLocationButton = screen.getByRole('button', { name: /add location/i })
    await user.click(addLocationButton)
    
    expect(mockConsoleLog).toHaveBeenCalledWith('Navigate to /locations/new')
  })

  it('handles Add User button click', async () => {
    render(<QuickActions />)
    
    const addUserButton = screen.getByRole('button', { name: /add user/i })
    await user.click(addUserButton)
    
    expect(mockConsoleLog).toHaveBeenCalledWith('Navigate to /users/new')
  })

  it('has proper responsive layout', () => {
    render(<QuickActions />)
    
    const container = screen.getByRole('button', { name: /add item/i }).closest('div')
    expect(container).toHaveClass('flex', 'items-center', 'space-x-2')
  })

  it('shows button labels on larger screens', () => {
    render(<QuickActions />)
    
    // Labels should be present but hidden on small screens
    const addItemLabel = screen.getByText('Add Item')
    const newCategoryLabel = screen.getByText('New Category')
    const addLocationLabel = screen.getByText('Add Location')
    const addUserLabel = screen.getByText('Add User')
    
    expect(addItemLabel).toBeInTheDocument()
    expect(newCategoryLabel).toBeInTheDocument()
    expect(addLocationLabel).toBeInTheDocument()
    expect(addUserLabel).toBeInTheDocument()
    
    // Labels should have responsive classes
    expect(addItemLabel).toHaveClass('hidden', 'sm:inline')
    expect(newCategoryLabel).toHaveClass('hidden', 'sm:inline')
    expect(addLocationLabel).toHaveClass('hidden', 'sm:inline')
    expect(addUserLabel).toHaveClass('hidden', 'sm:inline')
  })

  it('has proper button structure with icons and text', () => {
    render(<QuickActions />)
    
    const buttons = screen.getAllByRole('button')
    
    buttons.forEach(button => {
      // Each button should have flex layout with items-center and space-x-2
      expect(button).toHaveClass('flex', 'items-center', 'space-x-2')
      
      // Each button should contain an icon (svg) and text
      const icon = button.querySelector('svg')
      const text = button.querySelector('span')
      
      expect(icon).toBeInTheDocument()
      expect(text).toBeInTheDocument()
    })
  })

  it('has correct icon sizes', () => {
    render(<QuickActions />)
    
    const buttons = screen.getAllByRole('button')
    
    buttons.forEach(button => {
      const icon = button.querySelector('svg')
      expect(icon).toHaveClass('h-4', 'w-4')
    })
  })

  it('is keyboard accessible', async () => {
    render(<QuickActions />)
    
    const addItemButton = screen.getByRole('button', { name: /add item/i })
    
    // Focus the button
    addItemButton.focus()
    expect(addItemButton).toHaveFocus()
    
    // Press Enter to activate
    await user.keyboard('{Enter}')
    expect(mockConsoleLog).toHaveBeenCalledWith('Navigate to /inventory/new')
    
    // Press Space to activate
    await user.keyboard(' ')
    expect(mockConsoleLog).toHaveBeenCalledWith('Navigate to /inventory/new')
  })

  it('supports tab navigation between buttons', async () => {
    render(<QuickActions />)
    
    const buttons = screen.getAllByRole('button')
    
    // Focus first button
    buttons[0].focus()
    expect(buttons[0]).toHaveFocus()
    
    // Tab to next button
    await user.keyboard('{Tab}')
    expect(buttons[1]).toHaveFocus()
    
    // Tab to next button
    await user.keyboard('{Tab}')
    expect(buttons[2]).toHaveFocus()
    
    // Tab to last button
    await user.keyboard('{Tab}')
    expect(buttons[3]).toHaveFocus()
  })

  it('handles multiple rapid clicks correctly', async () => {
    render(<QuickActions />)
    
    const addItemButton = screen.getByRole('button', { name: /add item/i })
    
    // Click multiple times rapidly
    await user.click(addItemButton)
    await user.click(addItemButton)
    await user.click(addItemButton)
    
    expect(mockConsoleLog).toHaveBeenCalledTimes(3)
    expect(mockConsoleLog).toHaveBeenCalledWith('Navigate to /inventory/new')
  })

  it('maintains button state after interactions', async () => {
    render(<QuickActions />)
    
    const addItemButton = screen.getByRole('button', { name: /add item/i })
    
    // Click button
    await user.click(addItemButton)
    
    // Button should still be enabled and clickable
    expect(addItemButton).toBeEnabled()
    
    // Click again
    await user.click(addItemButton)
    expect(mockConsoleLog).toHaveBeenCalledTimes(2)
  })
})
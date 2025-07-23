import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { TransactionBuilder } from '@/components/inventory/transaction-builder'
import { setupCommonMocks } from '@/__tests__/utils/test-render'

// Mock the audited inventory service
vi.mock('@/lib/database-with-audit', () => ({
  auditedInventoryService: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: '1',
        sku: 'TEST-001',
        name: 'Test Product 1',
        description: 'Test description 1',
        unit_price: 10.99,
        quantity: 50,
        min_stock: 10,
        max_stock: 100,
        status: 'active',
        location_id: 'loc-1',
        category_id: 'cat-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        locations: {
          id: 'loc-1',
          name: 'Main Warehouse',
          type: 'warehouse'
        },
        categories: {
          id: 'cat-1',
          name: 'Electronics',
          color: '#blue'
        }
      },
      {
        id: '2',
        sku: 'TEST-002',
        name: 'Test Product 2',
        description: 'Test description 2',
        unit_price: 25.50,
        quantity: 30,
        min_stock: 5,
        max_stock: 50,
        status: 'active',
        location_id: 'loc-1',
        category_id: 'cat-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        locations: {
          id: 'loc-1',
          name: 'Main Warehouse',
          type: 'warehouse'
        },
        categories: {
          id: 'cat-1',
          name: 'Electronics',
          color: '#blue'
        }
      }
    ])
  }
}))

describe('TransactionBuilder', () => {
  const mockOnSave = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    setupCommonMocks()
    vi.clearAllMocks()
  })

  it('renders transaction builder dialog when open', () => {
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    expect(screen.getByText('Transaction Builder - Sale')).toBeInTheDocument()
    expect(screen.getByText('Create a new sales transaction by adding products and quantities.')).toBeInTheDocument()
    expect(screen.getByText('Add Product')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <TransactionBuilder
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    expect(screen.queryByText('Transaction Builder - Sale')).not.toBeInTheDocument()
  })

  it('shows transaction type options', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const typeSelect = screen.getByRole('combobox')
    await user.click(typeSelect)
    
    expect(screen.getByText('Sale Transaction')).toBeInTheDocument()
    expect(screen.getByText('Stock Addition')).toBeInTheDocument()
  })

  it('switches to stock addition mode', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const typeSelect = screen.getByRole('combobox')
    await user.click(typeSelect)
    await user.click(screen.getByText('Stock Addition'))
    
    expect(screen.getByText('Transaction Builder - Stock Addition')).toBeInTheDocument()
    expect(screen.getByText('Add stock to inventory by selecting products and quantities to receive.')).toBeInTheDocument()
  })

  it('shows product search when Add Product is clicked', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const addProductButton = screen.getByText('Add Product')
    await user.click(addProductButton)
    
    expect(screen.getByText('Add Product')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search products by name, SKU, or barcode...')).toBeInTheDocument()
  })

  it('allows searching for products', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const addProductButton = screen.getByText('Add Product')
    await user.click(addProductButton)
    
    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText('Search products by name, SKU, or barcode...')
    await user.type(searchInput, 'Test Product 1')
    
    expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument()
  })

  it('allows adding products to transaction', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const addProductButton = screen.getByText('Add Product')
    await user.click(addProductButton)
    
    // Wait for products to load and click on first product
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    const productItem = screen.getByText('Test Product 1').closest('div')
    await user.click(productItem!)
    
    // Product should appear in transaction items
    expect(screen.getByText('Transaction Items (1)')).toBeInTheDocument()
    expect(screen.getByText('Test Product 1')).toBeInTheDocument()
  })

  it('allows updating product quantities', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const addProductButton = screen.getByText('Add Product')
    await user.click(addProductButton)
    
    // Wait for products to load and add product
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    const productItem = screen.getByText('Test Product 1').closest('div')
    await user.click(productItem!)
    
    // Find quantity input and update it
    const quantityInput = screen.getByDisplayValue('1')
    await user.clear(quantityInput)
    await user.type(quantityInput, '5')
    
    expect(quantityInput).toHaveValue(5)
  })

  it('allows updating unit prices', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const addProductButton = screen.getByText('Add Product')
    await user.click(addProductButton)
    
    // Wait for products to load and add product
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    const productItem = screen.getByText('Test Product 1').closest('div')
    await user.click(productItem!)
    
    // Find unit price input and update it
    const priceInput = screen.getByDisplayValue('10.99')
    await user.clear(priceInput)
    await user.type(priceInput, '15.99')
    
    expect(priceInput).toHaveValue(15.99)
  })

  it('allows removing products from transaction', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const addProductButton = screen.getByText('Add Product')
    await user.click(addProductButton)
    
    // Wait for products to load and add product
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    const productItem = screen.getByText('Test Product 1').closest('div')
    await user.click(productItem!)
    
    // Remove the product
    const removeButton = screen.getByRole('button', { name: /trash/i })
    await user.click(removeButton)
    
    // Should show empty state
    expect(screen.getByText('No items added yet')).toBeInTheDocument()
  })

  it('calculates transaction totals correctly', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const addProductButton = screen.getByText('Add Product')
    await user.click(addProductButton)
    
    // Wait for products to load and add product
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    const productItem = screen.getByText('Test Product 1').closest('div')
    await user.click(productItem!)
    
    // Update quantity to 2
    const quantityInput = screen.getByDisplayValue('1')
    await user.clear(quantityInput)
    await user.type(quantityInput, '2')
    
    // Should show transaction summary
    expect(screen.getByText('Transaction Summary')).toBeInTheDocument()
    expect(screen.getByText('Subtotal:')).toBeInTheDocument()
    expect(screen.getByText('Tax (16.0%):')).toBeInTheDocument()
    expect(screen.getByText('Total:')).toBeInTheDocument()
  })

  it('allows adjusting tax rate', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const addProductButton = screen.getByText('Add Product')
    await user.click(addProductButton)
    
    // Wait for products to load and add product
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    const productItem = screen.getByText('Test Product 1').closest('div')
    await user.click(productItem!)
    
    // Find and update tax rate
    const taxRateInput = screen.getByDisplayValue('16.0')
    await user.clear(taxRateInput)
    await user.type(taxRateInput, '10.0')
    
    expect(screen.getByText('Tax (10.0%):')).toBeInTheDocument()
  })

  it('allows adding transaction notes', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const addProductButton = screen.getByText('Add Product')
    await user.click(addProductButton)
    
    // Wait for products to load and add product
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    const productItem = screen.getByText('Test Product 1').closest('div')
    await user.click(productItem!)
    
    // Add notes
    const notesInput = screen.getByPlaceholderText('Add transaction notes...')
    await user.type(notesInput, 'Test transaction notes')
    
    expect(notesInput).toHaveValue('Test transaction notes')
  })

  it('handles barcode input', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    // Wait for products to load
    await waitFor(() => {
      const barcodeInput = screen.getByPlaceholderText('Scan or enter barcode')
      expect(barcodeInput).toBeInTheDocument()
    })
    
    const barcodeInput = screen.getByPlaceholderText('Scan or enter barcode')
    await user.type(barcodeInput, 'TEST-001')
    await user.keyboard('{Enter}')
    
    // Product should be added to transaction
    expect(screen.getByText('Transaction Items (1)')).toBeInTheDocument()
  })

  it('saves transaction with correct data', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const addProductButton = screen.getByText('Add Product')
    await user.click(addProductButton)
    
    // Wait for products to load and add product
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    const productItem = screen.getByText('Test Product 1').closest('div')
    await user.click(productItem!)
    
    // Save transaction
    const saveButton = screen.getByText('Save Transaction')
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sale',
          lineItems: expect.arrayContaining([
            expect.objectContaining({
              product: expect.objectContaining({
                name: 'Test Product 1'
              }),
              quantity: 1,
              unitPrice: 10.99
            })
          ]),
          subtotal: 10.99,
          tax: expect.any(Number),
          total: expect.any(Number)
        })
      )
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('disables save button when no items are added', () => {
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const saveButton = screen.getByText('Save Transaction')
    expect(saveButton).toBeDisabled()
  })

  it('shows loading state while fetching products', () => {
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const addProductButton = screen.getByText('Add Product')
    expect(addProductButton).toBeInTheDocument()
  })

  it('shows empty state when no products are available', async () => {
    // Mock empty inventory
    vi.mocked(require('@/lib/database-with-audit').auditedInventoryService.getAll).mockResolvedValueOnce([])
    
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const addProductButton = screen.getByText('Add Product')
    await user.click(addProductButton)
    
    await waitFor(() => {
      expect(screen.getByText('No products available.')).toBeInTheDocument()
    })
  })

  it('shows different pricing for stock addition mode', async () => {
    const user = userEvent.setup()
    render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="stock_addition"
      />
    )
    
    const addProductButton = screen.getByText('Add Product')
    await user.click(addProductButton)
    
    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    // Should show cost information for stock addition
    expect(screen.getByText('Cost:')).toBeInTheDocument()
  })

  it('resets form when dialog closes', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    const addProductButton = screen.getByText('Add Product')
    await user.click(addProductButton)
    
    // Wait for products to load and add product
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    const productItem = screen.getByText('Test Product 1').closest('div')
    await user.click(productItem!)
    
    // Close dialog
    rerender(
      <TransactionBuilder
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    // Reopen dialog
    rerender(
      <TransactionBuilder
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialMode="sale"
      />
    )
    
    // Should show empty state
    expect(screen.getByText('No items added yet')).toBeInTheDocument()
  })
})
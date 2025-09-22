/**
 * Test Configuration
 * Centralized configuration for all E2E tests
 */

export const testConfig = {
  // Base URLs
  baseUrl: 'http://localhost:3002',
  inventoryUrl: 'http://localhost:3002/inventory',
  
  // Test data
  testData: {
    validSku: 'TEST-SKU-001',
    validName: 'Test Product',
    validPrice: '99.99',
    validQuantity: '10',
    validMinStock: '2',
    validMaxStock: '50',
    validCategory: 'Electronics',
    validLocation: 'Main Warehouse',
    
    // Invalid data for testing
    invalidSku: '',
    invalidName: '',
    invalidPrice: 'invalid-price',
    invalidQuantity: 'invalid-quantity',
    negativePrice: '-10.00',
    negativeQuantity: '-5',
    
    // Bulk test data
    bulkItems: [
      { sku: 'BULK-TEST-001', name: 'Bulk Test Product 1' },
      { sku: 'BULK-TEST-002', name: 'Bulk Test Product 2' },
      { sku: 'BULK-TEST-003', name: 'Bulk Test Product 3' }
    ]
  },
  
  // Selectors
  selectors: {
    // Navigation
    newProductButton: 'button:has-text("Nuevo Producto")',
    bulkCreateButton: 'button:has-text("Crear Múltiples")',
    auditHistoryButton: 'button:has-text("Historial de Auditoría")',
    
    // Forms
    skuInput: 'input[name="sku"]',
    nameInput: 'input[name="name"]',
    priceInput: 'input[name="unit_price"]',
    quantityInput: 'input[name="quantity"]',
    minStockInput: 'input[name="min_stock"]',
    maxStockInput: 'input[name="max_stock"]',
    categorySelect: 'select[name="category_id"]',
    locationSelect: 'select[name="location_id"]',
    
    // Buttons
    createButton: 'button:has-text("Crear Producto")',
    updateButton: 'button:has-text("Actualizar Producto")',
    deleteButton: 'button:has-text("Delete")',
    confirmButton: 'button:has-text("Confirmar")',
    cancelButton: 'button:has-text("Cancelar")',
    
    // Table
    inventoryTable: 'table',
    tableRows: 'tbody tr',
    editButton: 'button:has-text("Edit")',
    addStockButton: 'button:has-text("Add stock")',
    subtractStockButton: 'button:has-text("Subtract stock")',
    
    // Filters
    activeItemsFilter: 'button:has-text("Active Items")',
    inactiveItemsFilter: 'button:has-text("Inactive Items")',
    goodStockFilter: 'button:has-text("Good Stock")',
    lowStockFilter: 'button:has-text("Low Stock")',
    outOfStockFilter: 'button:has-text("Out of Stock")',
    
    // Search
    searchInput: 'input[placeholder*="Search"]',
    
    // Messages
    successMessage: '[data-testid="success-message"], .success, .alert-success',
    errorMessage: '[data-testid="error-message"], .error, .alert-error',
    loadingMessage: '[data-testid="loading"], .loading',
    
    // User info
    userInfo: 'text=Alejandro Sierraalta',
    userEmail: 'text=alesierraalta@gmail.com'
  },
  
  // Timeouts
  timeouts: {
    short: 1000,
    medium: 3000,
    long: 5000,
    veryLong: 10000
  },
  
  // API endpoints
  apiEndpoints: {
    inventory: '/api/v1/inventory',
    inventoryBulk: '/api/v1/inventory/bulk',
    categories: '/api/v1/categories',
    locations: '/api/v1/locations',
    audit: '/api/v1/audit'
  },
  
  // Test categories
  testCategories: {
    inventory: 'Inventory Management',
    authentication: 'Authentication',
    audit: 'Audit System',
    api: 'API Endpoints',
    error: 'Error Validation'
  }
}

export default testConfig

export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'TestPassword123!',
    role: 'admin',
    fullName: 'Test Admin'
  },
  user: {
    email: 'user@test.com',
    password: 'TestPassword123!',
    role: 'user',
    fullName: 'Test User'
  },
  newUser: {
    email: 'newuser@test.com',
    password: 'NewPassword123!',
    role: 'user',
    fullName: 'New Test User'
  }
};

export const testCategories = [
  {
    id: 'test-cat-1',
    name: 'Test Electronics',
    description: 'Test category for electronics'
  },
  {
    id: 'test-cat-2',
    name: 'Test Clothing',
    description: 'Test category for clothing'
  },
  {
    id: 'test-cat-3',
    name: 'Test Books',
    description: 'Test category for books'
  }
];

export const testLocations = [
  {
    id: 'test-loc-1',
    name: 'Test Warehouse A',
    address: '123 Test Street'
  },
  {
    id: 'test-loc-2',
    name: 'Test Warehouse B',
    address: '456 Test Avenue'
  },
  {
    id: 'test-loc-3',
    name: 'Test Store Front',
    address: '789 Test Boulevard'
  }
];

export const testInventoryItems = [
  {
    id: 'test-item-1',
    name: 'Test Laptop',
    description: 'High-performance laptop for testing',
    sku: 'TEST-LAP-001',
    quantity: 10,
    price: 999.99,
    category_id: 'test-cat-1',
    location_id: 'test-loc-1',
    min_stock_level: 5,
    max_stock_level: 50
  },
  {
    id: 'test-item-2',
    name: 'Test T-Shirt',
    description: 'Comfortable cotton t-shirt',
    sku: 'TEST-TSH-001',
    quantity: 50,
    price: 19.99,
    category_id: 'test-cat-2',
    location_id: 'test-loc-2',
    min_stock_level: 10,
    max_stock_level: 100
  },
  {
    id: 'test-item-3',
    name: 'Test Programming Book',
    description: 'Learn programming with this book',
    sku: 'TEST-BOOK-001',
    quantity: 25,
    price: 49.99,
    category_id: 'test-cat-3',
    location_id: 'test-loc-1',
    min_stock_level: 5,
    max_stock_level: 30
  }
];

export const testTransactions = [
  {
    id: 'test-trans-1',
    type: 'stock_in',
    item_id: 'test-item-1',
    quantity: 5,
    notes: 'Test stock in transaction',
    reference_number: 'REF-001'
  },
  {
    id: 'test-trans-2',
    type: 'stock_out',
    item_id: 'test-item-2',
    quantity: 3,
    notes: 'Test stock out transaction',
    reference_number: 'REF-002'
  }
];

export const formData = {
  newInventoryItem: {
    name: 'New Test Product',
    description: 'A brand new test product',
    sku: 'NEW-TEST-001',
    quantity: '15',
    price: '29.99',
    minStockLevel: '5',
    maxStockLevel: '50'
  },
  editInventoryItem: {
    name: 'Updated Test Product',
    description: 'An updated test product description',
    quantity: '20',
    price: '34.99'
  },
  newCategory: {
    name: 'New Test Category',
    description: 'A new category for testing'
  },
  newLocation: {
    name: 'New Test Location',
    address: '999 New Test Street'
  },
  newUser: {
    email: 'newuser@test.com',
    fullName: 'New Test User',
    role: 'user'
  },
  stockAdjustment: {
    quantity: '10',
    type: 'stock_in',
    notes: 'Test stock adjustment'
  }
};

export const selectors = {
  // Authentication
  auth: {
    emailInput: '[data-testid="email-input"]',
    passwordInput: '[data-testid="password-input"]',
    loginButton: '[data-testid="login-button"]',
    signupButton: '[data-testid="signup-button"]',
    logoutButton: '[data-testid="logout-button"]',
    resetPasswordButton: '[data-testid="reset-password-button"]',
    adminSignupLink: '[data-testid="admin-signup-link"]'
  },
  
  // Navigation
  nav: {
    dashboardLink: '[data-testid="nav-dashboard"]',
    inventoryLink: '[data-testid="nav-inventory"]',
    usersLink: '[data-testid="nav-users"]',
    categoriesLink: '[data-testid="nav-categories"]',
    locationsLink: '[data-testid="nav-locations"]',
    auditLink: '[data-testid="nav-audit"]',
    userMenu: '[data-testid="user-menu"]'
  },
  
  // Dashboard
  dashboard: {
    metricsCards: '[data-testid="metrics-cards"]',
    quickActions: '[data-testid="quick-actions"]',
    recentActivities: '[data-testid="recent-activities"]',
    lowStockAlerts: '[data-testid="low-stock-alerts"]',
    inventoryChart: '[data-testid="inventory-chart"]'
  },
  
  // Inventory
  inventory: {
    createButton: '[data-testid="create-inventory-button"]',
    searchInput: '[data-testid="inventory-search"]',
    filterButton: '[data-testid="inventory-filter"]',
    bulkSelectAll: '[data-testid="bulk-select-all"]',
    bulkActions: '[data-testid="bulk-actions"]',
    itemRow: '[data-testid="inventory-item-row"]',
    editButton: '[data-testid="edit-inventory-button"]',
    deleteButton: '[data-testid="delete-inventory-button"]',
    quickStockButton: '[data-testid="quick-stock-button"]'
  },
  
  // Forms
  forms: {
    nameInput: '[data-testid="name-input"]',
    descriptionInput: '[data-testid="description-input"]',
    skuInput: '[data-testid="sku-input"]',
    quantityInput: '[data-testid="quantity-input"]',
    priceInput: '[data-testid="price-input"]',
    categorySelect: '[data-testid="category-select"]',
    locationSelect: '[data-testid="location-select"]',
    saveButton: '[data-testid="save-button"]',
    cancelButton: '[data-testid="cancel-button"]',
    submitButton: '[data-testid="submit-button"]'
  },

  // Categories
  categories: {
    heading: 'h2:has-text("Categories")',
    addButton: 'button:has-text("Add Category")',
    importButton: 'button:has-text("Import")',
    exportButton: 'button:has-text("Export")',
    searchInput: 'input[placeholder*="Search categories"]',
    table: 'table',
    tableRow: (name: string) => `tr:has-text("${name}")`,
    checkbox: (name: string) => `tr:has-text("${name}") input[type="checkbox"]`,
    editButton: (name: string) => `tr:has-text("${name}") button:has(.lucide-edit)`,
    deleteButton: (name: string) => `tr:has-text("${name}") button:has(.lucide-trash-2)`,
    viewButton: (name: string) => `tr:has-text("${name}") button:has(.lucide-eye)`,
    selectAllCheckbox: 'thead input[type="checkbox"]',
    bulkActionsPanel: '.bg-blue-50',
    bulkDeleteButton: 'button:has-text("Delete Selected")',
    exportSelectedButton: 'button:has-text("Export Selected")',
    // Edit form
    editHeading: 'h2:has-text("Editar Categoría")',
    nameInput: '#name',
    descriptionTextarea: '#description',
    colorSelect: '#color',
    colorPreview: '.w-8.h-8.rounded-full',
    previewSection: '.bg-gray-50',
    backButton: 'button:has-text("Volver a Categorías")',
    cancelButton: 'button:has-text("Cancelar")',
    saveButton: 'button:has-text("Actualizar Categoría")',
    nameError: '.text-red-600:has-text("nombre")',
    colorError: '.text-red-600:has-text("color")'
  },

  // Locations
  locations: {
    heading: 'h2:has-text("Ubicaciones")',
    addButton: 'button:has-text("Agregar Ubicación")',
    importButton: 'button:has-text("Importar")',
    exportButton: 'button:has-text("Exportar")',
    searchInput: 'input[placeholder*="Buscar ubicaciones"]',
    sortByNameButton: 'button:has-text("Nombre")',
    sortByQuantityButton: 'button:has-text("Cantidad")',
    table: 'table',
    tableRow: (name: string) => `tr:has-text("${name}")`,
    checkbox: (name: string) => `tr:has-text("${name}") input[type="checkbox"]`,
    editButton: (name: string) => `tr:has-text("${name}") button:has(.lucide-edit)`,
    deleteButton: (name: string) => `tr:has-text("${name}") button:has(.lucide-trash-2)`,
    selectAllCheckbox: 'thead input[type="checkbox"]',
    bulkActionsPanel: '.bg-blue-50',
    bulkDeleteButton: 'button:has-text("Eliminar Seleccionadas")',
    exportSelectedButton: 'button:has-text("Export Selected")',
    // Create form
    createHeading: 'h2:has-text("Crear Ubicación")',
    nameInput: '#name',
    typeSelect: '#type',
    addressInput: '#address',
    cityInput: '#city',
    stateInput: '#state',
    zipCodeInput: '#zipCode',
    countryInput: '#country',
    cancelButton: 'button:has-text("Cancelar")',
    saveButton: 'button:has-text("Crear Ubicación")',
    backButton: 'button:has-text("Volver")',
    nameError: '.text-red-500:has-text("nombre")',
    typeError: '.text-red-500:has-text("tipo")',
    createNameInput: '#name',
    createAddressTextarea: '#address',
    createBackButton: 'button:has-text("Volver")',
    createCancelButton: 'button:has-text("Cancelar")',
    createSaveButton: 'button:has-text("Crear Ubicación")',
    createNameError: '.text-red-500:has-text("nombre")',
    createAddressError: '.text-red-500:has-text("descripción")',
    // Edit form
    editHeading: 'h2:has-text("Editar Ubicación")',
    editNameInput: '#name',
    editAddressTextarea: '#address',
    editBackButton: 'button:has-text("Volver")',
    editCancelButton: 'button:has-text("Cancelar")',
    editSaveButton: 'button:has-text("Actualizar Ubicación")',
    editNameError: '.text-red-500:has-text("nombre")',
    editAddressError: '.text-red-500:has-text("descripción")'
  },
  
  // Modals and Dialogs
  modals: {
    confirmDialog: '[data-testid="confirm-dialog"]',
    confirmButton: '[data-testid="confirm-button"]',
    cancelButton: '[data-testid="cancel-button"]',
    closeButton: '[data-testid="close-button"]',
    modal: '[data-testid="modal"]'
  },
  
  // Tables
  tables: {
    table: '[data-testid="data-table"]',
    tableRow: '[data-testid="table-row"]',
    tableHeader: '[data-testid="table-header"]',
    sortButton: '[data-testid="sort-button"]',
    pagination: '[data-testid="pagination"]',
    nextPage: '[data-testid="next-page"]',
    prevPage: '[data-testid="prev-page"]'
  }
};

export const urls = {
  home: '/',
  login: '/auth/login',
  signup: '/auth/signup',
  adminSignup: '/auth/admin-signup',
  resetPassword: '/auth/reset-password',
  dashboard: '/dashboard',
  inventory: '/inventory',
  inventoryCreate: '/inventory/create',
  inventoryEdit: (id: string) => `/inventory/edit/${id}`,
  users: '/users',
  usersCreate: '/users/create',
  categories: '/categories',
  categoriesEdit: (id: string) => `/categories/edit/${id}`,
  locations: '/locations',
  locationsCreate: '/locations/create',
  locationsEdit: (id: string) => `/locations/edit/${id}`,
  audit: '/audit'
};

// Export consolidated test data object
export const testData = {
  users: testUsers,
  categories: testCategories,
  locations: testLocations,
  inventory: {
    items: testInventoryItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      sku: item.sku,
      price: item.price,
      cost: item.price * 0.6, // Estimate cost as 60% of price
      currentStock: item.quantity,
      minimumLevel: item.min_stock_level,
      maximumLevel: item.max_stock_level,
      categoryId: item.category_id,
      locationId: item.location_id
    }))
  },
  transactions: testTransactions,
  forms: formData,
  selectors,
  urls
};
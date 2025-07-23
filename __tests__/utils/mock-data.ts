// Simple mock data factories without external dependencies
// Using basic JavaScript to avoid type issues with test-data-bot

let sequenceCounter = 0;

const getNextSequence = () => ++sequenceCounter;

// User mock data factory
export const createMockUser = (overrides: any = {}) => ({
  id: `user-${getNextSequence()}`,
  email: `user${getNextSequence()}@example.com`,
  name: `Test User ${getNextSequence()}`,
  role: 'user',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Inventory item mock data factory
export const createMockInventoryItem = (overrides: any = {}) => ({
  id: `item-${getNextSequence()}`,
  name: `Test Product ${getNextSequence()}`,
  description: 'Test product description',
  sku: `SKU${getNextSequence().toString().padStart(6, '0')}`,
  category: 'Electronics',
  price: 99.99,
  cost: 49.99,
  quantity: 100,
  min_stock: 10,
  max_stock: 500,
  location_id: `location-${getNextSequence()}`,
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Transaction mock data factory
export const createMockTransaction = (overrides: any = {}) => ({
  id: `transaction-${getNextSequence()}`,
  type: 'in',
  item_id: `item-${getNextSequence()}`,
  quantity: 10,
  unit_cost: 49.99,
  total_cost: 499.90,
  reference: `REF${getNextSequence()}`,
  notes: 'Test transaction',
  user_id: `user-${getNextSequence()}`,
  location_id: `location-${getNextSequence()}`,
  created_at: new Date().toISOString(),
  ...overrides,
});

// Location mock data factory
export const createMockLocation = (overrides: any = {}) => ({
  id: `location-${getNextSequence()}`,
  name: `Test Location ${getNextSequence()}`,
  address: '123 Test Street',
  city: 'Test City',
  state: 'Test State',
  zip_code: '12345',
  country: 'Test Country',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Category mock data factory
export const createMockCategory = (overrides: any = {}) => ({
  id: `category-${getNextSequence()}`,
  name: `Test Category ${getNextSequence()}`,
  description: 'Test category description',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Audit log mock data factory
export const createMockAuditLog = (overrides: any = {}) => ({
  id: `audit-${getNextSequence()}`,
  action: 'CREATE',
  entity_type: 'item',
  entity_id: `entity-${getNextSequence()}`,
  old_values: {},
  new_values: {},
  user_id: `user-${getNextSequence()}`,
  ip_address: '192.168.1.1',
  user_agent: 'Test User Agent',
  created_at: new Date().toISOString(),
  ...overrides,
});

// Dashboard metrics mock data factory
export const createMockMetrics = (overrides: any = {}) => ({
  total_items: 1000,
  low_stock_items: 5,
  total_value: 50000.00,
  recent_transactions: 25,
  active_locations: 3,
  total_users: 10,
  ...overrides,
});

// Stock warning mock data factory
export const createMockStockWarning = (overrides: any = {}) => ({
  id: `warning-${getNextSequence()}`,
  item_id: `item-${getNextSequence()}`,
  item_name: `Test Product ${getNextSequence()}`,
  current_stock: 2,
  min_stock: 10,
  location_name: `Test Location ${getNextSequence()}`,
  severity: 'low',
  created_at: new Date().toISOString(),
  ...overrides,
});

// Helper functions for creating arrays of mock data
export const createMockUsers = (count: number = 5) => 
  Array.from({ length: count }, () => createMockUser());

export const createMockInventoryItems = (count: number = 10) => 
  Array.from({ length: count }, () => createMockInventoryItem());

export const createMockTransactions = (count: number = 20) => 
  Array.from({ length: count }, () => createMockTransaction());

export const createMockLocations = (count: number = 3) => 
  Array.from({ length: count }, () => createMockLocation());

export const createMockCategories = (count: number = 5) => 
  Array.from({ length: count }, () => createMockCategory());

export const createMockAuditLogs = (count: number = 15) => 
  Array.from({ length: count }, () => createMockAuditLog());

export const createMockStockWarnings = (count: number = 8) => 
  Array.from({ length: count }, () => createMockStockWarning());

// Specific mock data for common scenarios
export const mockLowStockItem = createMockInventoryItem({
  quantity: 2,
  min_stock: 10,
  status: 'active'
});

export const mockOutOfStockItem = createMockInventoryItem({
  quantity: 0,
  min_stock: 5,
  status: 'active'
});

export const mockAdminUser = createMockUser({
  role: 'admin',
  status: 'active'
});

export const mockManagerUser = createMockUser({
  role: 'manager',
  status: 'active'
});

export const mockRegularUser = createMockUser({
  role: 'user',
  status: 'active'
});

// Reset sequence counter for tests
export const resetSequenceCounter = () => {
  sequenceCounter = 0;
};
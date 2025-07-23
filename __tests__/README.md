# Advanced Test Utilities Documentation

This directory contains comprehensive test utilities and frameworks for the LUMO2 inventory management application. The testing infrastructure provides advanced data factories, scenario builders, performance benchmarking, and sophisticated assertion utilities.

## 📁 Directory Structure

```
__tests__/
├── components/          # Component-specific tests
├── integration/         # Integration tests
├── e2e/                # End-to-end tests
├── examples/           # Example tests and demos
├── fixtures/           # Test data fixtures
├── helpers/            # Test helper utilities
├── lib/               # Library-specific tests
├── mocks/             # Mock implementations
├── setup/             # Test setup and configuration
└── utils/             # Advanced test utilities
```

## 🚀 Key Features

### 1. Advanced Data Factories (`utils/advanced-test-factories.ts`)

Sophisticated data generation with realistic constraints and relationships:

```typescript
import { createRealisticInventoryItem, createRelatedDataSet } from '../utils/advanced-test-factories'

// Create realistic inventory item with constraints
const item = createRealisticInventoryItem({
  category: 'Electronics',
  price: 299.99
})

// Create complete dataset with relationships
const dataset = createRelatedDataSet({
  userCount: 10,
  itemCount: 100,
  transactionCount: 500
})
```

**Features:**
- Realistic data generation using Faker.js
- Category-based pricing and stock constraints
- Role-based user permissions
- Relationship integrity between entities
- Specialized scenarios (low stock, high value, recent activity)

### 2. Test Scenario Builder (`utils/test-scenario-builder.ts`)

Multi-step test scenarios with performance tracking:

```typescript
import { TestScenarioBuilder, ScenarioTemplates } from '../utils/test-scenario-builder'

// Use pre-built scenarios
const result = await ScenarioTemplates.inventoryManagementWorkflow().execute()

// Create custom scenarios
const customScenario = new TestScenarioBuilder()
  .step('Setup Data', async (context) => {
    // Setup logic
    return { data: 'created' }
  })
  .step('Validate', async (context) => {
    // Validation logic
    return { validated: true }
  })

const result = await customScenario.execute()
```

**Pre-built Scenarios:**
- Inventory Management Workflow
- Authentication & Authorization
- Performance Testing
- Data Migration & Synchronization

### 3. Advanced Assertions (`utils/advanced-assertions.ts`)

Comprehensive assertion utilities for complex testing:

```typescript
import { 
  assertDatabaseConsistency, 
  assertRelationshipIntegrity,
  assertPerformance,
  assertDataIntegrity 
} from '../utils/advanced-assertions'

// Database consistency checks
await assertDatabaseConsistency({
  users: userData,
  inventory: inventoryData,
  transactions: transactionData
})

// Relationship integrity validation
assertRelationshipIntegrity(users, items, 'id', 'createdBy')

// Performance validation
assertPerformance(duration, 1000, 'Data generation')

// Data schema validation
assertDataIntegrity(items, {
  id: { required: true, type: 'string' },
  price: { required: true, type: 'number', min: 0 }
})
```

**Assertion Types:**
- Database consistency and relationships
- Performance and memory usage
- UI state (loading, error states)
- Form validation and accessibility
- API response structure
- Async operations with timeout

### 4. Enhanced Supabase Mocking (`mocks/supabase-mock.ts`)

Comprehensive Supabase client mocking with data store simulation:

```typescript
import { createEnhancedSupabaseMock } from '../mocks/supabase-mock'

const mockClient = createEnhancedSupabaseMock()

// Supports all Supabase operations
const { data, error } = await mockClient
  .from('inventory')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
```

**Features:**
- Complete query builder simulation
- In-memory data store with CRUD operations
- Filter, sort, and pagination support
- Authentication state management
- Real-time subscription mocking

### 5. MSW Integration (`mocks/msw-handlers.ts`, `utils/msw-utils.ts`)

Network-level API mocking with Mock Service Worker:

```typescript
import { server } from '../utils/msw-utils'
import { simulateNetworkError, simulateServerError } from '../utils/msw-utils'

// Error simulation
await simulateNetworkError()
await simulateServerError(500, 'Internal Server Error')

// Dynamic handler management
server.use(
  rest.get('/api/inventory', (req, res, ctx) => {
    return res(ctx.json({ data: mockData }))
  })
)
```

**Features:**
- Complete Supabase REST API endpoint coverage
- Query parameter parsing and filtering
- Error simulation (network, server, auth, timeout)
- Dynamic handler management
- Request/response logging

### 6. Authentication Test Utilities (`utils/auth-test-utils.tsx`)

Comprehensive authentication testing framework:

```typescript
import { 
  TestAuthProvider, 
  createTestUser, 
  mockAuthSession 
} from '../utils/auth-test-utils'

// Render with auth context
render(
  <TestAuthProvider user={createTestUser({ role: 'admin' })}>
    <YourComponent />
  </TestAuthProvider>
)

// Mock authentication flows
const session = mockAuthSession({
  user: createTestUser({ role: 'manager' }),
  expiresAt: Date.now() + 3600000
})
```

**Features:**
- Mock authentication context providers
- Role-based test user factories
- Session management utilities
- Permission testing helpers
- Multi-user scenario support

### 7. Performance Benchmarking

Built-in performance measurement and analysis:

```typescript
import { measurePerformance, benchmark } from '../utils/test-scenario-builder'

// Measure operation performance
const result = await measurePerformance('data-generation', () => {
  return createLargeDataset()
})

// Get performance statistics
const stats = benchmark.getStats('data-generation')
console.log(`Average: ${stats.mean}ms, P95: ${stats.p95}ms`)
```

**Metrics:**
- Mean, median, min, max execution times
- 95th and 99th percentile measurements
- Memory usage tracking
- Concurrent operation testing

## 🛠️ Setup and Configuration

### 1. Vitest Configuration (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})
```

### 2. Test Setup (`vitest.setup.ts`)

Global test configuration with MSW integration:

```typescript
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './__tests__/utils/msw-utils'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### 3. Database Management (`helpers/test-cleanup.ts`)

Advanced test isolation with transaction support:

```typescript
import { testDbManager } from '../helpers/test-cleanup'

// Transaction-based test isolation
beforeEach(() => {
  testDbManager.beginTransaction('test-name')
})

afterEach(() => {
  testDbManager.rollbackTransaction()
})
```

## 📋 Usage Examples

### Basic Test with Advanced Utilities

```typescript
import { describe, it, expect } from 'vitest'
import { createRealisticInventoryItem } from '../utils/advanced-test-factories'
import { assertDataIntegrity } from '../utils/advanced-assertions'

describe('Inventory Management', () => {
  it('should create valid inventory items', () => {
    const items = Array.from({ length: 10 }, () => createRealisticInventoryItem())
    
    assertDataIntegrity(items, {
      id: { required: true, type: 'string' },
      name: { required: true, type: 'string', minLength: 1 },
      price: { required: true, type: 'number', min: 0 },
      currentStock: { required: true, type: 'number', min: 0 }
    })
    
    expect(items).toHaveLength(10)
  })
})
```

### Complex Scenario Testing

```typescript
import { ScenarioTemplates } from '../utils/test-scenario-builder'

describe('E-commerce Workflow', () => {
  it('should handle complete inventory management workflow', async () => {
    const result = await ScenarioTemplates.inventoryManagementWorkflow().execute()
    
    expect(result.success).toBe(true)
    expect(result.steps).toHaveLength(6)
    
    // Verify workflow results
    const users = result.context.get('users')
    const items = result.context.get('items')
    const transactions = result.context.get('transactions')
    
    expect(users).toHaveLength(3)
    expect(items).toHaveLength(20)
    expect(transactions).toHaveLength(15)
  })
})
```

### Performance Testing

```typescript
import { measurePerformance, assertPerformance } from '../utils/test-scenario-builder'

describe('Performance Tests', () => {
  it('should meet performance requirements', async () => {
    const duration = await measurePerformance('bulk-operation', async () => {
      // Simulate bulk operation
      return processBulkData(largeDataset)
    })
    
    assertPerformance(duration, 2000, 'Bulk operation')
  })
})
```

## 🔧 Advanced Features

### 1. Test Data Relationships

Automatic relationship management between entities:

```typescript
const dataset = createRelatedDataSet({
  userCount: 5,
  itemCount: 50,
  transactionCount: 200
})

// All relationships are automatically maintained
// Items reference valid users, categories, and locations
// Transactions reference valid items and users
```

### 2. Realistic Data Constraints

Category-based realistic data generation:

```typescript
// Electronics items have higher prices and specific stock patterns
const electronicsItem = createRealisticInventoryItem({ category: 'Electronics' })
expect(electronicsItem.price).toBeGreaterThan(50)
expect(electronicsItem.sku).toMatch(/^ELE-\d{4}-[A-Z0-9]{4}$/)

// Clothing items have different constraints
const clothingItem = createRealisticInventoryItem({ category: 'Clothing' })
expect(clothingItem.price).toBeLessThan(electronicsItem.price)
```

### 3. Error Simulation

Comprehensive error testing capabilities:

```typescript
import { simulateNetworkError, simulateAuthError } from '../utils/msw-utils'

// Test network failure scenarios
await simulateNetworkError()
const result = await apiCall()
expect(result.error).toBeDefined()

// Test authentication failures
await simulateAuthError()
const authResult = await authenticatedApiCall()
expect(authResult.error.code).toBe('UNAUTHORIZED')
```

### 4. Memory Leak Detection

Built-in memory usage monitoring:

```typescript
import { assertMemoryUsage } from '../utils/advanced-assertions'

it('should not leak memory', async () => {
  const initialMemory = process.memoryUsage()
  
  // Perform memory-intensive operations
  await performBulkOperations()
  
  const finalMemory = process.memoryUsage()
  assertMemoryUsage(finalMemory, 100) // Max 100MB heap usage
})
```

## 🎯 Best Practices

### 1. Test Organization

- Use descriptive test names that explain the scenario
- Group related tests in describe blocks
- Use beforeEach/afterEach for proper cleanup
- Leverage test scenarios for complex workflows

### 2. Data Management

- Use realistic data factories instead of hardcoded values
- Maintain data relationships for integration tests
- Clean up test data after each test
- Use transactions for test isolation

### 3. Performance Testing

- Set realistic performance expectations
- Test with production-like data volumes
- Monitor memory usage in long-running tests
- Use benchmarking for regression detection

### 4. Error Handling

- Test both success and failure scenarios
- Use error simulation for network issues
- Validate error messages and codes
- Test retry and recovery mechanisms

## 🚨 Common Pitfalls

1. **Not cleaning up test data** - Always use proper cleanup utilities
2. **Hardcoded test data** - Use factories for maintainable tests
3. **Ignoring relationships** - Validate data integrity between entities
4. **Missing error scenarios** - Test failure cases as thoroughly as success cases
5. **Performance assumptions** - Always measure, don't assume performance

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Mock Service Worker](https://mswjs.io/)
- [Faker.js Documentation](https://fakerjs.dev/)

## 🤝 Contributing

When adding new test utilities:

1. Follow the existing patterns and naming conventions
2. Add comprehensive TypeScript types
3. Include usage examples in comments
4. Update this documentation
5. Add tests for the utilities themselves

## 📈 Metrics and Monitoring

The test suite provides comprehensive metrics:

- **Test Coverage**: Minimum 80% across all metrics
- **Performance Benchmarks**: Tracked across test runs
- **Memory Usage**: Monitored for leak detection
- **Error Simulation**: Coverage of failure scenarios

Use `npm run test:coverage` to generate detailed coverage reports.
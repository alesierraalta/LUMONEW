/**
 * Error Test Configuration for Inventory System
 * Provides utilities and configurations for comprehensive error testing
 */

export interface ErrorTestConfig {
  baseUrl: string
  timeout: number
  retryAttempts: number
  errorThresholds: {
    maxResponseTime: number
    maxErrorRate: number
  }
}

export const errorTestConfig: ErrorTestConfig = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 30000,
  retryAttempts: 3,
  errorThresholds: {
    maxResponseTime: 5000,
    maxErrorRate: 0.1 // 10%
  }
}

export interface TestUser {
  id: string
  email: string
  name: string
  role: string
  status: string
}

export interface TestData {
  valid: any
  invalid: any[]
  edgeCases: any[]
}

export const testUsers: TestUser[] = [
  {
    id: 'b0710d29-c03f-4076-890e-82e2da178ee5',
    email: 'testauth@example.com',
    name: 'Test Auth User',
    role: 'Administrador',
    status: 'active'
  },
  {
    id: '3d665a99-7636-4ef9-9316-f8065d010b26',
    email: 'alesierraalta@gmail.com',
    name: 'alesierraalta@gmail.com',
    role: 'admin',
    status: 'active'
  },
  {
    id: '847b89f3-7a49-4d10-9cd5-5a9c9edbc5af',
    email: 'pradasamuel1@gmail.com',
    name: 'asd',
    role: 'user',
    status: 'active'
  },
  {
    id: '9d894cce-876d-4980-b9c9-19470b03b664',
    email: 'nonexistent@example.com',
    name: 'Nonexistent User',
    role: 'user',
    status: 'active'
  }
]

export const testData: TestData = {
  valid: {
    name: 'Test Item',
    sku: 'TEST-001',
    category_id: 'b0710d29-c03f-4076-890e-82e2da178ee5',
    location_id: 'b0710d29-c03f-4076-890e-82e2da178ee5',
    unit_price: 10.50,
    quantity: 100,
    min_stock: 10,
    max_stock: 500,
    status: 'active',
    images: [],
    description: 'Test item description',
    barcode: '123456789',
    supplier: 'Test Supplier',
    unit_of_measure: 'unidad'
  },
  invalid: [
    {
      name: '',
      sku: '',
      category_id: '',
      location_id: '',
      unit_price: -1,
      quantity: -1,
      min_stock: -1,
      max_stock: -1,
      status: 'invalid'
    },
    {
      name: null,
      sku: null,
      category_id: null,
      location_id: null,
      unit_price: 'invalid',
      quantity: 'invalid',
      min_stock: 'invalid',
      max_stock: 'invalid',
      status: null
    },
    {
      // Missing required fields
      unit_price: 10.50,
      quantity: 100
    }
  ],
  edgeCases: [
    {
      name: 'A'.repeat(1000), // Very long name
      sku: 'A'.repeat(100), // Very long SKU
      category_id: 'b0710d29-c03f-4076-890e-82e2da178ee5',
      location_id: 'b0710d29-c03f-4076-890e-82e2da178ee5',
      unit_price: 0.01,
      quantity: 1,
      min_stock: 0,
      max_stock: 1,
      status: 'active'
    },
    {
      name: 'Test Item with Special Chars: !@#$%^&*()',
      sku: 'TEST-!@#$%',
      category_id: 'b0710d29-c03f-4076-890e-82e2da178ee5',
      location_id: 'b0710d29-c03f-4076-890e-82e2da178ee5',
      unit_price: 999999.99,
      quantity: 999999,
      min_stock: 999999,
      max_stock: 999999,
      status: 'active'
    },
    {
      name: '测试项目 🚀 ñáéíóú',
      sku: 'TEST-UNICODE-🚀',
      category_id: 'b0710d29-c03f-4076-890e-82e2da178ee5',
      location_id: 'b0710d29-c03f-4076-890e-82e2da178ee5',
      unit_price: 10.50,
      quantity: 100,
      min_stock: 10,
      max_stock: 500,
      status: 'active'
    }
  ]
}

export interface ErrorScenario {
  name: string
  description: string
  request: any
  expectedStatus: number[]
  expectedError?: string
  expectedMessage?: string
}

export const errorScenarios: ErrorScenario[] = [
  {
    name: 'Unauthenticated Request',
    description: 'Request without authentication should return 401',
    request: {
      method: 'POST',
      url: '/api/v1/inventory/bulk',
      data: {
        items: [testData.valid],
        operation: 'create'
      }
    },
    expectedStatus: [401],
    expectedError: 'Unauthorized',
    expectedMessage: 'User authentication required'
  },
  {
    name: 'Empty Items Array',
    description: 'Empty items array should return 400',
    request: {
      method: 'POST',
      url: '/api/v1/inventory/bulk',
      data: {
        items: [],
        operation: 'create'
      }
    },
    expectedStatus: [400],
    expectedError: 'Invalid request',
    expectedMessage: 'empty'
  },
  {
    name: 'Too Many Items',
    description: 'More than 100 items should return 400',
    request: {
      method: 'POST',
      url: '/api/v1/inventory/bulk',
      data: {
        items: Array(101).fill(testData.valid),
        operation: 'create'
      }
    },
    expectedStatus: [400],
    expectedError: 'Request too large',
    expectedMessage: '100 items'
  },
  {
    name: 'Invalid Operation',
    description: 'Invalid operation should return 400',
    request: {
      method: 'POST',
      url: '/api/v1/inventory/bulk',
      data: {
        items: [testData.valid],
        operation: 'invalid'
      }
    },
    expectedStatus: [400],
    expectedError: 'Invalid operation',
    expectedMessage: 'create" or "update'
  },
  {
    name: 'Missing Required Fields',
    description: 'Missing required fields should return 400',
    request: {
      method: 'POST',
      url: '/api/v1/inventory/bulk',
      data: {
        items: [testData.invalid[0]],
        operation: 'create'
      }
    },
    expectedStatus: [400],
    expectedError: 'required fields'
  },
  {
    name: 'Invalid Data Types',
    description: 'Invalid data types should return 400',
    request: {
      method: 'POST',
      url: '/api/v1/inventory/bulk',
      data: {
        items: [testData.invalid[1]],
        operation: 'create'
      }
    },
    expectedStatus: [400]
  },
  {
    name: 'Foreign Key Constraint',
    description: 'Invalid foreign keys should return 400',
    request: {
      method: 'POST',
      url: '/api/v1/inventory/bulk',
      data: {
        items: [{
          ...testData.valid,
          category_id: '00000000-0000-0000-0000-000000000000'
        }],
        operation: 'create'
      }
    },
    expectedStatus: [400],
    expectedError: 'foreign key'
  },
  {
    name: 'Duplicate SKU',
    description: 'Duplicate SKU should return 400',
    request: {
      method: 'POST',
      url: '/api/v1/inventory/bulk',
      data: {
        items: [testData.valid, testData.valid],
        operation: 'create'
      }
    },
    expectedStatus: [400],
    expectedError: 'duplicate'
  }
]

export interface PerformanceTestConfig {
  concurrentRequests: number
  requestDelay: number
  testDuration: number
  expectedThroughput: number
}

export const performanceTestConfig: PerformanceTestConfig = {
  concurrentRequests: 10,
  requestDelay: 100,
  testDuration: 30000, // 30 seconds
  expectedThroughput: 100 // requests per minute
}

export interface SecurityTestConfig {
  sqlInjectionPayloads: string[]
  xssPayloads: string[]
  pathTraversalPayloads: string[]
}

export const securityTestConfig: SecurityTestConfig = {
  sqlInjectionPayloads: [
    "'; DROP TABLE inventory; --",
    "'; DELETE FROM inventory; --",
    "' OR '1'='1",
    "'; INSERT INTO inventory VALUES ('hacked', 'hacked', 'hacked'); --"
  ],
  xssPayloads: [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "javascript:alert('XSS')",
    "<svg onload=alert('XSS')>"
  ],
  pathTraversalPayloads: [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
    "....//....//....//etc/passwd",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd"
  ]
}

export interface ErrorResponseValidator {
  validateErrorResponse(response: any): boolean
  validateErrorStructure(response: any): boolean
  validateErrorMessage(response: any): boolean
}

export const errorResponseValidator: ErrorResponseValidator = {
  validateErrorResponse: (response: any) => {
    return response && 
           typeof response === 'object' && 
           response.success === false &&
           typeof response.error === 'string' &&
           typeof response.message === 'string' &&
           typeof response.timestamp === 'string'
  },

  validateErrorStructure: (response: any) => {
    const requiredFields = ['success', 'error', 'message', 'timestamp']
    return requiredFields.every(field => field in response)
  },

  validateErrorMessage: (response: any) => {
    return response.message && 
           response.message.length > 0 &&
           response.message.length < 1000
  }
}

export interface TestResult {
  testName: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error?: string
  response?: any
}

export class ErrorTestRunner {
  private results: TestResult[] = []

  async runErrorScenario(scenario: ErrorScenario, request: any): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const response = await request[scenario.request.method.toLowerCase()](
        scenario.request.url,
        scenario.request.data
      )

      const duration = Date.now() - startTime
      const status = scenario.expectedStatus.includes(response.status()) ? 'passed' : 'failed'
      
      const result: TestResult = {
        testName: scenario.name,
        status,
        duration,
        response: {
          status: response.status(),
          data: await response.json().catch(() => null)
        }
      }

      if (status === 'failed') {
        result.error = `Expected status ${scenario.expectedStatus}, got ${response.status()}`
      }

      this.results.push(result)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const result: TestResult = {
        testName: scenario.name,
        status: 'failed',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      this.results.push(result)
      return result
    }
  }

  getResults(): TestResult[] {
    return this.results
  }

  getPassedTests(): TestResult[] {
    return this.results.filter(r => r.status === 'passed')
  }

  getFailedTests(): TestResult[] {
    return this.results.filter(r => r.status === 'failed')
  }

  getSuccessRate(): number {
    if (this.results.length === 0) return 0
    return this.getPassedTests().length / this.results.length
  }

  getAverageResponseTime(): number {
    if (this.results.length === 0) return 0
    return this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length
  }
}

export default {
  errorTestConfig,
  testUsers,
  testData,
  errorScenarios,
  performanceTestConfig,
  securityTestConfig,
  errorResponseValidator,
  ErrorTestRunner
}
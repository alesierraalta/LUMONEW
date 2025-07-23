import { expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'

// Advanced assertion utilities for complex testing scenarios
export class AdvancedAssertions {
  // Database state assertions
  static async assertDatabaseConsistency(tables: Record<string, any[]>): Promise<void> {
    for (const [tableName, expectedData] of Object.entries(tables)) {
      expect(expectedData).toBeDefined()
      expect(Array.isArray(expectedData)).toBe(true)
      
      // Check for duplicate IDs
      const ids = expectedData.map(item => item.id).filter(Boolean)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
      
      // Check for required fields
      expectedData.forEach((item, index) => {
        expect(item).toHaveProperty('id')
        if (item.created_at) {
          expect(new Date(item.created_at).getTime()).not.toBeNaN()
        }
        if (item.updated_at) {
          expect(new Date(item.updated_at).getTime()).not.toBeNaN()
        }
      })
    }
  }

  // Relationship integrity assertions
  static assertRelationshipIntegrity(
    parentTable: any[],
    childTable: any[],
    parentKey: string,
    childForeignKey: string
  ): void {
    const parentIds = new Set(parentTable.map(item => item[parentKey]))
    const childForeignKeys = childTable.map(item => item[childForeignKey]).filter(Boolean)
    
    childForeignKeys.forEach(foreignKey => {
      expect(parentIds.has(foreignKey)).toBe(true)
    })
  }

  // Performance assertions
  static assertPerformance(actualDuration: number, expectedMaxDuration: number, operation: string): void {
    expect(actualDuration).toBeLessThanOrEqual(expectedMaxDuration)
  }

  static assertMemoryUsage(memoryUsage: NodeJS.MemoryUsage, maxHeapMB: number): void {
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024
    expect(heapUsedMB).toBeLessThanOrEqual(maxHeapMB)
  }

  // UI state assertions
  static async assertLoadingState(container: HTMLElement, shouldBeLoading: boolean): Promise<void> {
    const loadingSelectors = [
      '[data-testid="loading"]',
      '[aria-label*="loading" i]',
      '.loading',
      '.spinner',
      '[role="progressbar"]'
    ]

    if (shouldBeLoading) {
      let foundLoading = false
      for (const selector of loadingSelectors) {
        const element = container.querySelector(selector)
        if (element) {
          foundLoading = true
          break
        }
      }
      expect(foundLoading).toBe(true)
    } else {
      for (const selector of loadingSelectors) {
        const elements = container.querySelectorAll(selector)
        elements.forEach(element => {
          expect(element).not.toBeVisible()
        })
      }
    }
  }

  static async assertErrorState(container: HTMLElement, expectedError?: string): Promise<void> {
    const errorElement = container.querySelector('[data-testid="error"], [role="alert"], .error')
    expect(errorElement).toBeInTheDocument()
    
    if (expectedError) {
      expect(errorElement).toHaveTextContent(expectedError)
    }
  }

  static async assertNoErrorState(container: HTMLElement): Promise<void> {
    const errorElements = container.querySelectorAll('[data-testid="error"], [role="alert"], .error')
    errorElements.forEach(element => {
      expect(element).not.toBeInTheDocument()
    })
  }

  // Form validation assertions
  static async assertFormValidation(
    form: HTMLElement,
    validationRules: Record<string, ValidationRule>
  ): Promise<void> {
    for (const [fieldName, rule] of Object.entries(validationRules)) {
      const field = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement
      expect(field).toBeInTheDocument()

      if (rule.required) {
        expect(field).toHaveAttribute('required')
      }

      if (rule.minLength) {
        expect(field).toHaveAttribute('minlength', rule.minLength.toString())
      }

      if (rule.maxLength) {
        expect(field).toHaveAttribute('maxlength', rule.maxLength.toString())
      }

      if (rule.pattern) {
        expect(field).toHaveAttribute('pattern', rule.pattern)
      }

      if (rule.type) {
        expect(field).toHaveAttribute('type', rule.type)
      }
    }
  }

  // Accessibility assertions
  static async assertAccessibility(container: HTMLElement): Promise<void> {
    // Check for proper heading hierarchy
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
    let previousLevel = 0
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1))
      if (previousLevel > 0) {
        expect(level).toBeLessThanOrEqual(previousLevel + 1)
      }
      previousLevel = level
    })

    // Check for alt text on images
    const images = container.querySelectorAll('img')
    images.forEach(img => {
      expect(img).toHaveAttribute('alt')
    })

    // Check for form labels
    const inputs = container.querySelectorAll('input, select, textarea')
    inputs.forEach(input => {
      const id = input.getAttribute('id')
      if (id) {
        const label = container.querySelector(`label[for="${id}"]`)
        const ariaLabel = input.getAttribute('aria-label')
        const ariaLabelledBy = input.getAttribute('aria-labelledby')
        
        expect(label || ariaLabel || ariaLabelledBy).toBeTruthy()
      }
    })

    // Check for keyboard navigation
    const interactiveElements = container.querySelectorAll(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    interactiveElements.forEach(element => {
      const tabIndex = element.getAttribute('tabindex')
      if (tabIndex !== null) {
        expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(-1)
      }
    })
  }

  // Data integrity assertions
  static assertDataIntegrity<T extends Record<string, any>>(
    data: T[],
    schema: DataSchema<T>
  ): void {
    data.forEach((item, index) => {
      for (const [field, rules] of Object.entries(schema)) {
        if (!rules) continue
        
        const value = item[field]
        
        if (rules.required && (value === undefined || value === null)) {
          throw new Error(`Required field '${field}' is missing at index ${index}`)
        }

        if (value !== undefined && value !== null) {
          if (rules.type && typeof value !== rules.type) {
            throw new Error(`Field '${field}' at index ${index} should be ${rules.type}, got ${typeof value}`)
          }

          if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
            throw new Error(`Field '${field}' at index ${index} should have minimum length ${rules.minLength}`)
          }

          if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
            throw new Error(`Field '${field}' at index ${index} should have maximum length ${rules.maxLength}`)
          }

          if (rules.min && typeof value === 'number' && value < rules.min) {
            throw new Error(`Field '${field}' at index ${index} should be >= ${rules.min}`)
          }

          if (rules.max && typeof value === 'number' && value > rules.max) {
            throw new Error(`Field '${field}' at index ${index} should be <= ${rules.max}`)
          }

          if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
            throw new Error(`Field '${field}' at index ${index} does not match required pattern`)
          }

          if (rules.enum && !rules.enum.includes(value)) {
            throw new Error(`Field '${field}' at index ${index} should be one of: ${rules.enum.join(', ')}`)
          }

          if (rules.validator && !rules.validator(value)) {
            throw new Error(`Field '${field}' at index ${index} failed custom validation`)
          }
        }
      }
    })
  }

  // API response assertions
  static assertApiResponse(response: any, expectedStructure: ApiResponseStructure): void {
    expect(response).toBeDefined()
    
    if (expectedStructure.hasData) {
      expect(response).toHaveProperty('data')
    }

    if (expectedStructure.hasError) {
      expect(response).toHaveProperty('error')
    }

    if (expectedStructure.hasCount) {
      expect(response).toHaveProperty('count')
      expect(typeof response.count).toBe('number')
    }

    if (expectedStructure.hasStatus) {
      expect(response).toHaveProperty('status')
      expect(typeof response.status).toBe('number')
    }

    if (expectedStructure.dataType === 'array') {
      expect(Array.isArray(response.data)).toBe(true)
    } else if (expectedStructure.dataType === 'object') {
      expect(typeof response.data).toBe('object')
      expect(response.data).not.toBeNull()
    }

    if (expectedStructure.minItems && Array.isArray(response.data)) {
      expect(response.data.length).toBeGreaterThanOrEqual(expectedStructure.minItems)
    }

    if (expectedStructure.maxItems && Array.isArray(response.data)) {
      expect(response.data.length).toBeLessThanOrEqual(expectedStructure.maxItems)
    }
  }

  // Async operation assertions
  static async assertAsyncOperation<T>(
    operation: () => Promise<T>,
    timeout: number = 5000,
    expectedResult?: (result: T) => boolean
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
        )
      ])

      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(timeout)

      if (expectedResult) {
        expect(expectedResult(result)).toBe(true)
      }

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      throw new Error(`Async operation failed after ${duration}ms: ${error}`)
    }
  }

  // Batch assertions for multiple conditions
  static assertAll(assertions: (() => void)[]): void {
    const errors: string[] = []
    
    assertions.forEach((assertion, index) => {
      try {
        assertion()
      } catch (error) {
        errors.push(`Assertion ${index + 1}: ${error}`)
      }
    })

    if (errors.length > 0) {
      throw new Error(`Multiple assertions failed:\n${errors.join('\n')}`)
    }
  }

  // Conditional assertions
  static assertIf(condition: boolean, assertion: () => void): void {
    if (condition) {
      assertion()
    }
  }

  // Retry assertions for flaky tests
  static async assertWithRetry(
    assertion: () => void | Promise<void>,
    maxRetries: number = 3,
    delay: number = 100
  ): Promise<void> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await assertion()
        return
      } catch (error) {
        lastError = error as Error
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt))
        }
      }
    }
    
    throw new Error(`Assertion failed after ${maxRetries} attempts. Last error: ${lastError?.message}`)
  }
}

// Type definitions
interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: string
  type?: string
}

type DataSchema<T> = {
  [K in keyof T]?: {
    required?: boolean
    type?: 'string' | 'number' | 'boolean' | 'object'
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: RegExp
    enum?: any[]
    validator?: (value: any) => boolean
  }
}

interface ApiResponseStructure {
  hasData?: boolean
  hasError?: boolean
  hasCount?: boolean
  hasStatus?: boolean
  dataType?: 'array' | 'object' | 'primitive'
  minItems?: number
  maxItems?: number
}

// Convenience functions
export const assertDatabaseConsistency = AdvancedAssertions.assertDatabaseConsistency
export const assertRelationshipIntegrity = AdvancedAssertions.assertRelationshipIntegrity
export const assertPerformance = AdvancedAssertions.assertPerformance
export const assertMemoryUsage = AdvancedAssertions.assertMemoryUsage
export const assertLoadingState = AdvancedAssertions.assertLoadingState
export const assertErrorState = AdvancedAssertions.assertErrorState
export const assertNoErrorState = AdvancedAssertions.assertNoErrorState
export const assertFormValidation = AdvancedAssertions.assertFormValidation
export const assertAccessibility = AdvancedAssertions.assertAccessibility
export const assertDataIntegrity = AdvancedAssertions.assertDataIntegrity
export const assertApiResponse = AdvancedAssertions.assertApiResponse
export const assertAsyncOperation = AdvancedAssertions.assertAsyncOperation
export const assertAll = AdvancedAssertions.assertAll
export const assertIf = AdvancedAssertions.assertIf
export const assertWithRetry = AdvancedAssertions.assertWithRetry

// Custom matchers for Vitest
export const customMatchers = {
  toHaveValidStructure(received: any, schema: DataSchema<any>) {
    try {
      AdvancedAssertions.assertDataIntegrity([received], schema)
      return {
        message: () => 'Expected data to have invalid structure',
        pass: true
      }
    } catch (error) {
      return {
        message: () => `Expected data to have valid structure: ${error}`,
        pass: false
      }
    }
  },

  toBeWithinPerformanceLimit(received: number, limit: number) {
    const pass = received <= limit
    return {
      message: () => pass 
        ? `Expected ${received}ms to exceed ${limit}ms`
        : `Expected ${received}ms to be within ${limit}ms limit`,
      pass
    }
  },

  toHaveRelationshipIntegrity(received: any[], parent: any[], parentKey: string, foreignKey: string) {
    try {
      AdvancedAssertions.assertRelationshipIntegrity(parent, received, parentKey, foreignKey)
      return {
        message: () => 'Expected relationship integrity to be invalid',
        pass: true
      }
    } catch (error) {
      return {
        message: () => `Expected valid relationship integrity: ${error}`,
        pass: false
      }
    }
  }
}
import { vi, expect } from 'vitest'
import userEvent from '@testing-library/user-event'

// Common test helpers and assertions
export const createMockFunction = () => vi.fn()

// User event setup
export const setupUserEvent = () => userEvent.setup()

// Common assertions
export const expectToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
}

export const expectNotToBeInDocument = (element: HTMLElement | null) => {
  expect(element).not.toBeInTheDocument()
}

export const expectToHaveClass = (element: HTMLElement, className: string) => {
  expect(element).toHaveClass(className)
}

export const expectToHaveAttribute = (element: HTMLElement, attribute: string, value?: string) => {
  if (value !== undefined) {
    expect(element).toHaveAttribute(attribute, value)
  } else {
    expect(element).toHaveAttribute(attribute)
  }
}

export const expectToBeDisabled = (element: HTMLElement) => {
  expect(element).toBeDisabled()
}

export const expectToBeEnabled = (element: HTMLElement) => {
  expect(element).not.toBeDisabled()
}

// Mock API responses
export const createMockApiResponse = <T>(data: T, error: any = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK'
})

export const createMockSupabaseResponse = <T>(data: T, error: any = null) => ({
  data,
  error,
  count: Array.isArray(data) ? data.length : data ? 1 : 0
})

// Mock Supabase query builder
export const createMockSupabaseQuery = (mockData: any, mockError: any = null) => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  like: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue(createMockSupabaseResponse(mockData, mockError)),
  then: vi.fn().mockResolvedValue(createMockSupabaseResponse(mockData, mockError))
})

// Form testing helpers
export const fillFormField = async (user: ReturnType<typeof userEvent.setup>, input: HTMLElement, value: string) => {
  await user.clear(input)
  await user.type(input, value)
}

export const selectOption = async (user: ReturnType<typeof userEvent.setup>, select: HTMLElement, option: string) => {
  await user.click(select)
  const optionElement = document.querySelector(`[data-value="${option}"]`) as HTMLElement
  if (optionElement) {
    await user.click(optionElement)
  }
}

export const clickButton = async (user: ReturnType<typeof userEvent.setup>, button: HTMLElement) => {
  await user.click(button)
}

// Table testing helpers
export const getTableRows = (container: HTMLElement) => {
  return container.querySelectorAll('tbody tr')
}

export const getTableHeaders = (container: HTMLElement) => {
  return container.querySelectorAll('thead th')
}

export const getTableCells = (row: Element) => {
  return row.querySelectorAll('td')
}

// Filter testing helpers
export const applySearchFilter = async (user: ReturnType<typeof userEvent.setup>, searchInput: HTMLElement, searchTerm: string) => {
  await fillFormField(user, searchInput, searchTerm)
}

export const applySelectFilter = async (user: ReturnType<typeof userEvent.setup>, selectElement: HTMLElement, value: string) => {
  await selectOption(user, selectElement, value)
}

export const clearFilters = async (user: ReturnType<typeof userEvent.setup>, clearButton: HTMLElement) => {
  await clickButton(user, clearButton)
}

// Modal/Dialog testing helpers
export const openModal = async (user: ReturnType<typeof userEvent.setup>, trigger: HTMLElement) => {
  await clickButton(user, trigger)
}

export const closeModal = async (user: ReturnType<typeof userEvent.setup>, closeButton: HTMLElement) => {
  await clickButton(user, closeButton)
}

export const expectModalToBeOpen = (container: HTMLElement) => {
  const modal = container.querySelector('[role="dialog"]') as HTMLElement
  expectToBeInDocument(modal)
}

export const expectModalToBeClosed = (container: HTMLElement) => {
  const modal = container.querySelector('[role="dialog"]') as HTMLElement
  expectNotToBeInDocument(modal)
}

// Accessibility testing helpers
export const expectToHaveAccessibleName = (element: HTMLElement, name: string) => {
  expect(element).toHaveAccessibleName(name)
}

export const expectToHaveRole = (element: HTMLElement, role: string) => {
  expect(element).toHaveAttribute('role', role)
}

export const expectToHaveAriaLabel = (element: HTMLElement, label: string) => {
  expect(element).toHaveAttribute('aria-label', label)
}

export const expectToHaveAriaExpanded = (element: HTMLElement, expanded: boolean) => {
  expect(element).toHaveAttribute('aria-expanded', expanded.toString())
}

// Loading state helpers
export const expectToShowLoading = (container: HTMLElement) => {
  const loadingElement = container.querySelector('[data-testid="loading"]') ||
                        container.querySelector('.loading') ||
                        container.querySelector('[aria-label*="loading" i]')
  expectToBeInDocument(loadingElement as HTMLElement)
}

export const expectNotToShowLoading = (container: HTMLElement) => {
  const loadingElement = container.querySelector('[data-testid="loading"]') ||
                        container.querySelector('.loading') ||
                        container.querySelector('[aria-label*="loading" i]')
  expectNotToBeInDocument(loadingElement as HTMLElement)
}

// Error state helpers
export const expectToShowError = (container: HTMLElement, errorMessage?: string) => {
  const errorElement = container.querySelector('[data-testid="error"]') ||
                      container.querySelector('.error') ||
                      container.querySelector('[role="alert"]')
  expectToBeInDocument(errorElement as HTMLElement)
  
  if (errorMessage) {
    expect(errorElement).toHaveTextContent(errorMessage)
  }
}

export const expectNotToShowError = (container: HTMLElement) => {
  const errorElement = container.querySelector('[data-testid="error"]') ||
                      container.querySelector('.error') ||
                      container.querySelector('[role="alert"]')
  expectNotToBeInDocument(errorElement as HTMLElement)
}

// Wait helpers
export const waitForElementToAppear = async (container: HTMLElement, selector: string) => {
  return new Promise<HTMLElement>((resolve) => {
    const observer = new MutationObserver(() => {
      const element = container.querySelector(selector) as HTMLElement
      if (element) {
        observer.disconnect()
        resolve(element)
      }
    })
    
    observer.observe(container, { childList: true, subtree: true })
    
    // Check if element already exists
    const existingElement = container.querySelector(selector) as HTMLElement
    if (existingElement) {
      observer.disconnect()
      resolve(existingElement)
    }
  })
}

// Date helpers for testing
export const formatDateForInput = (date: Date) => {
  return date.toISOString().slice(0, 16) // Format for datetime-local input
}

export const createDateRange = (startDays: number = -7, endDays: number = 0) => {
  const now = new Date()
  const start = new Date(now.getTime() + startDays * 24 * 60 * 60 * 1000)
  const end = new Date(now.getTime() + endDays * 24 * 60 * 60 * 1000)
  
  return { start, end }
}

// Cleanup helpers
export const cleanupMocks = () => {
  vi.clearAllMocks()
  vi.clearAllTimers()
}

export const resetTestEnvironment = () => {
  cleanupMocks()
  // Reset any global state if needed
}
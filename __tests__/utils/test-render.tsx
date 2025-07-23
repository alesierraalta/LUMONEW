import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// Mock providers that might be needed
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="auth-provider">{children}</div>
}

const MockToastProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="toast-provider">{children}</div>
}

// Custom render function with all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockAuthProvider>
      <MockToastProvider>
        {children}
      </MockToastProvider>
    </MockAuthProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Common test utilities
export const mockScrollIntoView = () => {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: vi.fn(),
    writable: true,
  })
}

export const mockIntersectionObserver = () => {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
}

export const mockResizeObserver = () => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
}

// Setup all common mocks
export const setupCommonMocks = () => {
  mockScrollIntoView()
  mockIntersectionObserver()
  mockResizeObserver()
}
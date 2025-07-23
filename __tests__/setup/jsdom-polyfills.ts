/**
 * JSDOM Polyfills for Radix UI Components
 * 
 * This file adds missing DOM methods that Radix UI components expect
 * but are not available in JSDOM testing environment.
 */

// Polyfill for hasPointerCapture method
Object.defineProperty(Element.prototype, 'hasPointerCapture', {
  value: function(pointerId: number) {
    return false
  },
  writable: true,
  configurable: true
})

// Polyfill for setPointerCapture method
Object.defineProperty(Element.prototype, 'setPointerCapture', {
  value: function(pointerId: number) {
    // No-op for testing
  },
  writable: true,
  configurable: true
})

// Polyfill for releasePointerCapture method
Object.defineProperty(Element.prototype, 'releasePointerCapture', {
  value: function(pointerId: number) {
    // No-op for testing
  },
  writable: true,
  configurable: true
})

// Polyfill for scrollIntoView method
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: function(options?: boolean | ScrollIntoViewOptions) {
    // No-op for testing
  },
  writable: true,
  configurable: true
})

// Polyfill for getBoundingClientRect method with more realistic values
const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect
Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
  value: function() {
    const rect = originalGetBoundingClientRect.call(this)
    // Return more realistic values for testing
    return {
      x: rect.x || 0,
      y: rect.y || 0,
      width: rect.width || 100,
      height: rect.height || 20,
      top: rect.top || 0,
      right: rect.right || 100,
      bottom: rect.bottom || 20,
      left: rect.left || 0,
      toJSON: () => rect
    }
  },
  writable: true,
  configurable: true
})

// Polyfill for ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    // No-op for testing
  }
  
  observe(target: Element, options?: ResizeObserverOptions) {
    // No-op for testing
  }
  
  unobserve(target: Element) {
    // No-op for testing
  }
  
  disconnect() {
    // No-op for testing
  }
}

// Polyfill for IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    // No-op for testing
  }
  
  observe(target: Element) {
    // No-op for testing
  }
  
  unobserve(target: Element) {
    // No-op for testing
  }
  
  disconnect() {
    // No-op for testing
  }
  
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
  
  readonly root: Element | null = null
  readonly rootMargin: string = '0px'
  readonly thresholds: ReadonlyArray<number> = []
}

// Polyfill for matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Polyfill for getComputedStyle
const originalGetComputedStyle = window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: (element: Element, pseudoElement?: string | null) => {
    const style = originalGetComputedStyle(element, pseudoElement)
    // Add missing properties that Radix UI might need
    return {
      ...style,
      transform: style.transform || 'none',
      transition: style.transition || 'none',
      animation: style.animation || 'none',
      getPropertyValue: (property: string) => {
        return style.getPropertyValue(property) || ''
      }
    }
  },
  writable: true,
  configurable: true
})

// Mock HTMLElement methods that might be missing
HTMLElement.prototype.scrollTo = HTMLElement.prototype.scrollTo || function() {}
HTMLElement.prototype.scroll = HTMLElement.prototype.scroll || function() {}

// Add focus and blur methods if missing
if (!HTMLElement.prototype.focus) {
  HTMLElement.prototype.focus = function() {
    // Trigger focus event
    this.dispatchEvent(new Event('focus', { bubbles: true }))
  }
}

if (!HTMLElement.prototype.blur) {
  HTMLElement.prototype.blur = function() {
    // Trigger blur event
    this.dispatchEvent(new Event('blur', { bubbles: true }))
  }
}

// Polyfill for DOMRect constructor
if (typeof DOMRect === 'undefined') {
  global.DOMRect = class DOMRect {
    constructor(
      public x: number = 0,
      public y: number = 0,
      public width: number = 0,
      public height: number = 0
    ) {}
    
    get top() { return this.y }
    get right() { return this.x + this.width }
    get bottom() { return this.y + this.height }
    get left() { return this.x }
    
    static fromRect(other?: DOMRectInit): DOMRect {
      return new DOMRect(other?.x, other?.y, other?.width, other?.height)
    }
    
    toJSON() {
      return {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        top: this.top,
        right: this.right,
        bottom: this.bottom,
        left: this.left
      }
    }
  }
}

// Suppress console warnings for missing descriptions in tests
const originalConsoleWarn = console.warn
console.warn = (...args: any[]) => {
  const message = args[0]
  if (typeof message === 'string' && message.includes('Missing `Description`')) {
    // Suppress Radix UI accessibility warnings in tests
    return
  }
  originalConsoleWarn.apply(console, args)
}

export {}
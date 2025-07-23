import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  cn,
  formatDate,
  formatCurrency,
  debounce,
  throttle,
  generateId,
  validateEmail,
  validatePhone,
  capitalizeFirst,
  truncateText,
  getInitials,
  sleep,
  isValidUrl,
  formatFileSize,
  getRandomColor,
  sortBy,
  groupBy,
  unique,
  formatNumber,
  formatDateTime,
  getStockStatus,
  getStatusColor,
  chunk
} from '@/lib/utils'

describe('Utils Library Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-2 py-1', 'bg-red-500')
      expect(result).toBe('px-2 py-1 bg-red-500')
    })

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class')
      expect(result).toBe('base-class conditional-class')
    })

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('px-2', 'px-4')
      expect(result).toBe('px-4')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle arrays and objects', () => {
      const result = cn(['px-2', 'py-1'], { 'bg-red-500': true, 'text-white': false })
      expect(result).toBe('px-2 py-1 bg-red-500')
    })
  })

  describe('formatDate', () => {
    it('should format Date object correctly', () => {
      const date = new Date('2023-12-25')
      const result = formatDate(date)
      expect(result).toMatch(/25 de diciembre de 2023|25 dic\. 2023/)
    })

    it('should format date string correctly', () => {
      const result = formatDate('2023-12-25')
      expect(result).toMatch(/25 de diciembre de 2023|25 dic\. 2023/)
    })

    it('should handle ISO date strings', () => {
      const result = formatDate('2023-12-25T10:30:00Z')
      expect(result).toMatch(/25 de diciembre de 2023|25 dic\. 2023/)
    })

    it('should handle invalid dates gracefully', () => {
      const result = formatDate('invalid-date')
      expect(result).toBe('Invalid Date')
    })
  })

  describe('formatCurrency', () => {
    it('should format USD currency by default', () => {
      const result = formatCurrency(1234.56)
      expect(result).toMatch(/1\.234,56\s*\$|1\.234,56\s*US\$/)
    })

    it('should format EUR currency', () => {
      const result = formatCurrency(1234.56, 'EUR')
      expect(result).toMatch(/1\.234,56\s*€/)
    })

    it('should handle zero amount', () => {
      const result = formatCurrency(0)
      expect(result).toMatch(/0,00\s*\$|0,00\s*US\$/)
    })

    it('should handle negative amounts', () => {
      const result = formatCurrency(-100)
      expect(result).toMatch(/-100,00\s*\$|-100,00\s*US\$/)
    })

    it('should handle large numbers', () => {
      const result = formatCurrency(1000000)
      expect(result).toMatch(/1\.000\.000,00\s*\$|1\.000\.000,00\s*US\$/)
    })
  })

  describe('debounce', () => {
    it('should delay function execution', async () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('test')
      expect(mockFn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledWith('test')
    })

    it('should cancel previous calls', async () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('first')
      debouncedFn('second')
      debouncedFn('third')

      vi.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('third')
    })

    it('should handle multiple arguments', async () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1', 'arg2', 'arg3')
      vi.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
    })
  })

  describe('throttle', () => {
    it('should limit function execution', async () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn('first')
      throttledFn('second')
      throttledFn('third')

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('first')
    })

    it('should allow execution after throttle period', async () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn('first')
      vi.advanceTimersByTime(100)
      throttledFn('second')

      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenNthCalledWith(1, 'first')
      expect(mockFn).toHaveBeenNthCalledWith(2, 'second')
    })
  })

  describe('generateId', () => {
    it('should generate a string ID', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('should generate unique IDs', () => {
      const ids = Array.from({ length: 100 }, () => generateId())
      const uniqueIds = Array.from(new Set(ids))
      expect(uniqueIds.length).toBe(ids.length)
    })

    it('should generate alphanumeric IDs', () => {
      const id = generateId()
      expect(id).toMatch(/^[a-z0-9]+$/)
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('user+tag@example.org')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test..test@example.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(validateEmail('a@b.c')).toBe(true)
      expect(validateEmail('test@example')).toBe(false)
      expect(validateEmail('test @example.com')).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhone('+1234567890')).toBe(true)
      expect(validatePhone('1234567890')).toBe(true)
      expect(validatePhone('+44 20 7946 0958')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('abc123')).toBe(false)
      expect(validatePhone('0123456789')).toBe(false)
      expect(validatePhone('+0123456789')).toBe(false)
      expect(validatePhone('')).toBe(false)
    })

    it('should handle phone numbers with spaces', () => {
      expect(validatePhone('+1 234 567 890')).toBe(true)
      expect(validatePhone('1 234 567 890')).toBe(true)
    })
  })

  describe('capitalizeFirst', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello')
      expect(capitalizeFirst('WORLD')).toBe('World')
      expect(capitalizeFirst('tEST')).toBe('Test')
    })

    it('should handle single character', () => {
      expect(capitalizeFirst('a')).toBe('A')
      expect(capitalizeFirst('Z')).toBe('Z')
    })

    it('should handle empty string', () => {
      expect(capitalizeFirst('')).toBe('')
    })

    it('should handle special characters', () => {
      expect(capitalizeFirst('123abc')).toBe('123abc')
      expect(capitalizeFirst('!hello')).toBe('!hello')
    })
  })

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that should be truncated'
      const result = truncateText(text, 20)
      expect(result).toBe('This is a very long ...')
      expect(result.length).toBe(23) // 20 + '...'
    })

    it('should not truncate short text', () => {
      const text = 'Short text'
      const result = truncateText(text, 20)
      expect(result).toBe(text)
    })

    it('should handle exact length', () => {
      const text = 'Exactly twenty chars'
      const result = truncateText(text, 20)
      expect(result).toBe(text)
    })

    it('should handle empty string', () => {
      expect(truncateText('', 10)).toBe('')
    })
  })

  describe('getInitials', () => {
    it('should get initials from names', () => {
      expect(getInitials('John', 'Doe')).toBe('JD')
      expect(getInitials('jane', 'smith')).toBe('JS')
      expect(getInitials('ALICE', 'COOPER')).toBe('AC')
    })

    it('should handle single character names', () => {
      expect(getInitials('A', 'B')).toBe('AB')
    })

    it('should handle empty names', () => {
      expect(getInitials('', '')).toBe('')
      expect(getInitials('John', '')).toBe('J')
      expect(getInitials('', 'Doe')).toBe('D')
    })
  })

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const promise = sleep(100)
      vi.advanceTimersByTime(100)
      await expect(promise).resolves.toBeUndefined()
    })

    it('should not resolve before specified time', async () => {
      const promise = sleep(100)
      vi.advanceTimersByTime(50)
      
      let resolved = false
      promise.then(() => { resolved = true })
      
      await vi.runOnlyPendingTimersAsync()
      expect(resolved).toBe(false)
    })
  })

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://localhost:3000')).toBe(true)
      expect(isValidUrl('ftp://files.example.com')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('http://')).toBe(false)
      expect(isValidUrl('')).toBe(false)
      expect(isValidUrl('javascript:alert(1)')).toBe(true) // Valid URL scheme
    })

    it('should handle edge cases', () => {
      expect(isValidUrl('mailto:test@example.com')).toBe(true)
      expect(isValidUrl('tel:+1234567890')).toBe(true)
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })

    it('should handle decimal values', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(2621440)).toBe('2.5 MB')
    })

    it('should handle large numbers', () => {
      expect(formatFileSize(5368709120)).toBe('5 GB')
    })
  })

  describe('getRandomColor', () => {
    it('should return a valid Tailwind color class', () => {
      const color = getRandomColor()
      expect(color).toMatch(/^bg-(red|blue|green|yellow|purple|pink|indigo|teal)-500$/)
    })

    it('should return different colors on multiple calls', () => {
      const colors = Array.from({ length: 20 }, () => getRandomColor())
      const uniqueColors = Array.from(new Set(colors))
      expect(uniqueColors.length).toBeGreaterThan(1)
    })
  })

  describe('sortBy', () => {
    const testData = [
      { name: 'John', age: 30 },
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 35 }
    ]

    it('should sort by key in ascending order', () => {
      const result = sortBy(testData, 'age')
      expect(result[0].age).toBe(25)
      expect(result[1].age).toBe(30)
      expect(result[2].age).toBe(35)
    })

    it('should sort by key in descending order', () => {
      const result = sortBy(testData, 'age', 'desc')
      expect(result[0].age).toBe(35)
      expect(result[1].age).toBe(30)
      expect(result[2].age).toBe(25)
    })

    it('should sort by string key', () => {
      const result = sortBy(testData, 'name')
      expect(result[0].name).toBe('Alice')
      expect(result[1].name).toBe('Bob')
      expect(result[2].name).toBe('John')
    })

    it('should not mutate original array', () => {
      const original = [...testData]
      sortBy(testData, 'age')
      expect(testData).toEqual(original)
    })
  })

  describe('groupBy', () => {
    const testData = [
      { category: 'A', value: 1 },
      { category: 'B', value: 2 },
      { category: 'A', value: 3 },
      { category: 'C', value: 4 }
    ]

    it('should group items by key', () => {
      const result = groupBy(testData, 'category')
      expect(result.A).toHaveLength(2)
      expect(result.B).toHaveLength(1)
      expect(result.C).toHaveLength(1)
    })

    it('should preserve item properties', () => {
      const result = groupBy(testData, 'category')
      expect(result.A[0]).toEqual({ category: 'A', value: 1 })
      expect(result.A[1]).toEqual({ category: 'A', value: 3 })
    })

    it('should handle empty array', () => {
      const result = groupBy([], 'category')
      expect(result).toEqual({})
    })
  })

  describe('unique', () => {
    it('should remove duplicates from array', () => {
      const result = unique([1, 2, 2, 3, 3, 3, 4])
      expect(result).toEqual([1, 2, 3, 4])
    })

    it('should handle string arrays', () => {
      const result = unique(['a', 'b', 'a', 'c', 'b'])
      expect(result).toEqual(['a', 'b', 'c'])
    })

    it('should handle empty array', () => {
      const result = unique([])
      expect(result).toEqual([])
    })

    it('should preserve order of first occurrence', () => {
      const result = unique([3, 1, 2, 1, 3])
      expect(result).toEqual([3, 1, 2])
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with Spanish locale', () => {
      expect(formatNumber(1234)).toBe('1.234')
      expect(formatNumber(1234567)).toBe('1.234.567')
    })

    it('should handle decimal numbers', () => {
      expect(formatNumber(1234.56)).toBe('1.234,56')
    })

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0')
    })

    it('should handle negative numbers', () => {
      expect(formatNumber(-1234)).toBe('-1.234')
    })
  })

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const result = formatDateTime('2023-12-25T15:30:00')
      expect(result).toMatch(/25 dic\. 2023, 15:30|25 de dic\. de 2023, 15:30/)
    })

    it('should handle Date objects', () => {
      const date = new Date('2023-12-25T15:30:00')
      const result = formatDateTime(date)
      expect(result).toMatch(/25 dic\. 2023, 15:30|25 de dic\. de 2023, 15:30/)
    })
  })

  describe('getStockStatus', () => {
    it('should return low status when current <= min', () => {
      expect(getStockStatus(5, 10, 100)).toBe('low')
      expect(getStockStatus(10, 10, 100)).toBe('low')
    })

    it('should return high status when current >= max', () => {
      expect(getStockStatus(100, 10, 100)).toBe('high')
      expect(getStockStatus(150, 10, 100)).toBe('high')
    })

    it('should return normal status when min < current < max', () => {
      expect(getStockStatus(50, 10, 100)).toBe('normal')
      expect(getStockStatus(25, 10, 100)).toBe('normal')
    })
  })

  describe('getStatusColor', () => {
    it('should return correct colors for known statuses', () => {
      expect(getStatusColor('low')).toBe('text-red-600 bg-red-100')
      expect(getStatusColor('normal')).toBe('text-green-600 bg-green-100')
      expect(getStatusColor('high')).toBe('text-blue-600 bg-blue-100')
      expect(getStatusColor('active')).toBe('text-green-600 bg-green-100')
      expect(getStatusColor('inactive')).toBe('text-gray-600 bg-gray-100')
      expect(getStatusColor('pending')).toBe('text-yellow-600 bg-yellow-100')
    })

    it('should return default color for unknown statuses', () => {
      expect(getStatusColor('unknown')).toBe('text-gray-600 bg-gray-100')
      expect(getStatusColor('')).toBe('text-gray-600 bg-gray-100')
    })
  })

  describe('chunk', () => {
    it('should split array into chunks of specified size', () => {
      const result = chunk([1, 2, 3, 4, 5, 6, 7], 3)
      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]])
    })

    it('should handle exact divisions', () => {
      const result = chunk([1, 2, 3, 4], 2)
      expect(result).toEqual([[1, 2], [3, 4]])
    })

    it('should handle empty array', () => {
      const result = chunk([], 3)
      expect(result).toEqual([])
    })

    it('should handle chunk size larger than array', () => {
      const result = chunk([1, 2], 5)
      expect(result).toEqual([[1, 2]])
    })

    it('should handle chunk size of 1', () => {
      const result = chunk([1, 2, 3], 1)
      expect(result).toEqual([[1], [2], [3]])
    })
  })

  describe('Integration scenarios', () => {
    it('should work together for data processing pipeline', () => {
      const rawData = [
        { name: 'john doe', email: 'JOHN@EXAMPLE.COM', status: 'active', value: 1000 },
        { name: 'jane smith', email: 'jane@test.com', status: 'inactive', value: 2500 },
        { name: 'bob wilson', email: 'invalid-email', status: 'pending', value: 1500 }
      ]

      // Process data using multiple utils
      const processedData = rawData
        .filter(item => validateEmail(item.email.toLowerCase()))
        .map(item => ({
          ...item,
          name: capitalizeFirst(item.name.split(' ')[0]) + ' ' + capitalizeFirst(item.name.split(' ')[1]),
          initials: getInitials(item.name.split(' ')[0], item.name.split(' ')[1]),
          formattedValue: formatCurrency(item.value),
          statusColor: getStatusColor(item.status)
        }))

      expect(processedData).toHaveLength(2) // Invalid email filtered out
      expect(processedData[0].name).toBe('John Doe')
      expect(processedData[0].initials).toBe('JD')
      expect(processedData[0].formattedValue).toMatch(/1\.000,00/)
    })

    it('should handle complex sorting and grouping scenarios', () => {
      const inventory = [
        { category: 'Electronics', name: 'Laptop', stock: 5, minStock: 10 },
        { category: 'Electronics', name: 'Phone', stock: 15, minStock: 5 },
        { category: 'Furniture', name: 'Chair', stock: 8, minStock: 10 },
        { category: 'Furniture', name: 'Desk', stock: 20, minStock: 5 }
      ]

      // Group by category and add stock status
      const grouped = groupBy(
        inventory.map(item => ({
          ...item,
          stockStatus: getStockStatus(item.stock, item.minStock, item.minStock * 3),
          statusColor: getStatusColor(getStockStatus(item.stock, item.minStock, item.minStock * 3))
        })),
        'category'
      )

      // Sort each group by stock level
      Object.keys(grouped).forEach(category => {
        grouped[category] = sortBy(grouped[category], 'stock', 'desc')
      })

      expect(grouped.Electronics).toHaveLength(2)
      expect(grouped.Furniture).toHaveLength(2)
      expect(grouped.Electronics[0].name).toBe('Phone') // Higher stock first
      expect(grouped.Electronics[1].stockStatus).toBe('low') // Laptop has low stock
    })
  })
})
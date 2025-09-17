/**
 * Pagination Utilities - Optimized pagination for API endpoints
 * Implements cursor-based and offset-based pagination strategies
 */

export interface PaginationParams {
  page?: number
  limit?: number
  cursor?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
    nextCursor?: string
    prevCursor?: string
  }
}

export interface CursorPaginationResult<T> {
  data: T[]
  pagination: {
    cursor?: string
    limit: number
    hasNext: boolean
    hasPrev: boolean
    nextCursor?: string
    prevCursor?: string
  }
}

export class PaginationHelper {
  /**
   * Parse pagination parameters from request
   */
  static parseParams(searchParams: URLSearchParams): PaginationParams {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const cursor = searchParams.get('cursor') || undefined
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    return {
      page,
      limit,
      cursor,
      sortBy,
      sortOrder
    }
  }

  /**
   * Create pagination result for offset-based pagination
   */
  static createResult<T>(
    data: T[],
    total: number,
    params: PaginationParams
  ): PaginationResult<T> {
    const { page, limit } = params
    const totalPages = Math.ceil(total / (limit || 10))
    const hasNext = (page || 1) < totalPages
    const hasPrev = (page || 1) > 1

    return {
      data,
      pagination: {
        page: page || 1,
        limit: limit || 10,
        total,
        totalPages,
        hasNext,
        hasPrev,
        nextCursor: hasNext ? this.encodeCursor((page || 1) + 1, (limit || 10).toString()) : undefined,
        prevCursor: hasPrev ? this.encodeCursor((page || 1) - 1, (limit || 10).toString()) : undefined
      }
    }
  }

  /**
   * Create pagination result for cursor-based pagination
   */
  static createCursorResult<T>(
    data: T[],
    params: PaginationParams,
    hasMore: boolean = false
  ): CursorPaginationResult<T> {
    const { limit, cursor } = params
    const hasNext = hasMore
    const hasPrev = !!cursor

    // Generate cursors based on data
    let nextCursor: string | undefined
    let prevCursor: string | undefined

    if (data.length > 0) {
      const lastItem = data[data.length - 1] as any
      const firstItem = data[0] as any

      if (hasNext) {
        nextCursor = this.encodeCursor(lastItem.id, lastItem.created_at)
      }

      if (hasPrev) {
        prevCursor = this.encodeCursor(firstItem.id, firstItem.created_at)
      }
    }

    return {
      data,
      pagination: {
        cursor,
        limit: limit || 10,
        hasNext,
        hasPrev,
        nextCursor,
        prevCursor
      }
    }
  }

  /**
   * Encode cursor for pagination
   */
  static encodeCursor(id: string | number, timestamp?: string | Date): string {
    const data = { id, timestamp: timestamp?.toString() }
    return Buffer.from(JSON.stringify(data)).toString('base64')
  }

  /**
   * Decode cursor for pagination
   */
  static decodeCursor(cursor: string): { id: string; timestamp?: string } | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
      return JSON.parse(decoded)
    } catch {
      return null
    }
  }

  /**
   * Generate pagination links for API responses
   */
  static generateLinks(
    baseUrl: string,
    pagination: PaginationResult<any>['pagination'],
    additionalParams: Record<string, string> = {}
  ): Record<string, string> {
    const { page, limit, hasNext, hasPrev, nextCursor, prevCursor } = pagination
    const links: Record<string, string> = {}

    const params = new URLSearchParams({
      ...additionalParams,
      limit: limit.toString()
    })

    if (hasPrev) {
      params.set('page', (page - 1).toString())
      links.prev = `${baseUrl}?${params.toString()}`
    }

    if (hasNext) {
      params.set('page', (page + 1).toString())
      links.next = `${baseUrl}?${params.toString()}`
    }

    if (nextCursor) {
      params.delete('page')
      params.set('cursor', nextCursor)
      links.nextCursor = `${baseUrl}?${params.toString()}`
    }

    if (prevCursor) {
      params.delete('page')
      params.set('cursor', prevCursor)
      links.prevCursor = `${baseUrl}?${params.toString()}`
    }

    return links
  }

  /**
   * Validate pagination parameters
   */
  static validateParams(params: PaginationParams): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (params.page && (params.page < 1 || params.page > 10000)) {
      errors.push('Page must be between 1 and 10000')
    }

    if (params.limit && (params.limit < 1 || params.limit > 100)) {
      errors.push('Limit must be between 1 and 100')
    }

    if (params.sortOrder && !['asc', 'desc'].includes(params.sortOrder)) {
      errors.push('Sort order must be "asc" or "desc"')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get optimal page size based on data type
   */
  static getOptimalPageSize(dataType: string): number {
    const pageSizes: Record<string, number> = {
      inventory: 20,
      users: 25,
      categories: 50,
      locations: 50,
      audit_logs: 15,
      projects: 20,
      transactions: 30
    }

    return pageSizes[dataType] || 20
  }

  /**
   * Calculate offset for database queries
   */
  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit
  }

  /**
   * Build Supabase query with pagination
   */
  static buildSupabaseQuery(
    query: any,
    params: PaginationParams,
    countQuery?: any
  ): { dataQuery: any; countQuery?: any } {
    const { page, limit, sortBy, sortOrder } = params
    const offset = this.calculateOffset(page || 1, limit || 10)

    // Apply sorting
    const dataQuery = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + (limit || 10) - 1)

    // Apply count query if provided
    let countQueryResult = countQuery
    if (countQueryResult) {
      countQueryResult = countQueryResult.select('*', { count: 'exact', head: true })
    }

    return {
      dataQuery,
      countQuery: countQueryResult
    }
  }

  /**
   * Build cursor-based Supabase query
   */
  static buildCursorQuery(
    query: any,
    params: PaginationParams,
    cursorField: string = 'created_at'
  ): any {
    const { cursor, limit, sortBy, sortOrder } = params

    if (cursor) {
      const decoded = this.decodeCursor(cursor)
      if (decoded) {
        const operator = sortOrder === 'asc' ? 'gt' : 'lt'
        query = query.filter(cursorField, operator, decoded.timestamp)
      }
    }

    return query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .limit((limit || 10) + 1) // Get one extra to check if there are more
  }

  /**
   * Process cursor-based results
   */
  static processCursorResults<T>(
    results: T[],
    limit: number
  ): { data: T[]; hasMore: boolean } {
    const hasMore = results.length > limit
    const data = hasMore ? results.slice(0, limit) : results

    return { data, hasMore }
  }
}

// Export utility functions
export const {
  parseParams,
  createResult,
  createCursorResult,
  encodeCursor,
  decodeCursor,
  generateLinks,
  validateParams,
  getOptimalPageSize,
  calculateOffset,
  buildSupabaseQuery,
  buildCursorQuery,
  processCursorResults
} = PaginationHelper
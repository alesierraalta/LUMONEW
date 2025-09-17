/**
 * Request Batcher - Intelligent request batching system
 * Optimizes multiple API calls by batching them together
 */

export interface BatchRequest {
  id: string
  endpoint: string
  method: string
  params: any
  priority: 'high' | 'medium' | 'low'
  timestamp: number
  resolve: (result: any) => void
  reject: (error: any) => void
}

export interface BatchConfig {
  maxBatchSize: number
  maxWaitTime: number
  enablePrioritization: boolean
  enableDeduplication: boolean
}

export interface BatchResult {
  id: string
  success: boolean
  data?: any
  error?: string
}

export class RequestBatcher {
  private pendingRequests = new Map<string, BatchRequest>()
  private batchTimers = new Map<string, NodeJS.Timeout>()
  private requestId = 0

  constructor(
    private config: BatchConfig = {
      maxBatchSize: 10,
      maxWaitTime: 50, // 50ms
      enablePrioritization: true,
      enableDeduplication: true
    }
  ) {}

  /**
   * Add request to batch queue
   */
  async batchRequest<T>(
    endpoint: string,
    method: string = 'GET',
    params: any = {},
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = `req_${++this.requestId}_${Date.now()}`
      const batchKey = this.getBatchKey(endpoint, method)
      
      // Check for duplicate requests if deduplication is enabled
      if (this.config.enableDeduplication) {
        const duplicateKey = this.getDuplicateKey(endpoint, method, params)
        const existing = this.findDuplicateRequest(duplicateKey)
        
        if (existing) {
          // Piggyback on existing request
          const originalResolve = existing.resolve
          existing.resolve = (result: any) => {
            originalResolve(result)
            resolve(result)
          }
          
          const originalReject = existing.reject
          existing.reject = (error: any) => {
            originalReject(error)
            reject(error)
          }
          
          return
        }
      }

      const request: BatchRequest = {
        id,
        endpoint,
        method,
        params,
        priority,
        timestamp: Date.now(),
        resolve,
        reject
      }

      this.pendingRequests.set(id, request)

      // Check if we should execute immediately
      if (priority === 'high' || this.shouldExecuteImmediately(batchKey)) {
        this.executeBatch(batchKey)
        return
      }

      // Set or reset batch timer
      this.setBatchTimer(batchKey)
    })
  }

  /**
   * Generate batch key for grouping similar requests
   */
  private getBatchKey(endpoint: string, method: string): string {
    return `${method}:${endpoint}`
  }

  /**
   * Generate duplicate key for deduplication
   */
  private getDuplicateKey(endpoint: string, method: string, params: any): string {
    const paramsString = JSON.stringify(params)
    return `${method}:${endpoint}:${paramsString}`
  }

  /**
   * Find duplicate request
   */
  private findDuplicateRequest(duplicateKey: string): BatchRequest | null {
    for (const request of Array.from(this.pendingRequests.values())) {
      const requestKey = this.getDuplicateKey(request.endpoint, request.method, request.params)
      if (requestKey === duplicateKey) {
        return request
      }
    }
    return null
  }

  /**
   * Check if batch should be executed immediately
   */
  private shouldExecuteImmediately(batchKey: string): boolean {
    const requests = this.getRequestsForBatch(batchKey)
    return requests.length >= this.config.maxBatchSize
  }

  /**
   * Get requests for specific batch
   */
  private getRequestsForBatch(batchKey: string): BatchRequest[] {
    return Array.from(this.pendingRequests.values()).filter(req => 
      this.getBatchKey(req.endpoint, req.method) === batchKey
    )
  }

  /**
   * Set batch timer
   */
  private setBatchTimer(batchKey: string): void {
    // Clear existing timer
    const existingTimer = this.batchTimers.get(batchKey)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.executeBatch(batchKey)
    }, this.config.maxWaitTime)

    this.batchTimers.set(batchKey, timer)
  }

  /**
   * Execute batch of requests
   */
  private async executeBatch(batchKey: string): Promise<void> {
    const requests = this.getRequestsForBatch(batchKey)
    
    if (requests.length === 0) return

    // Clear timer
    const timer = this.batchTimers.get(batchKey)
    if (timer) {
      clearTimeout(timer)
      this.batchTimers.delete(batchKey)
    }

    // Sort by priority if enabled
    if (this.config.enablePrioritization) {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      requests.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }
        return a.timestamp - b.timestamp
      })
    }

    // Remove requests from pending queue
    requests.forEach(req => this.pendingRequests.delete(req.id))

    try {
      // Execute requests
      const results = await this.executeRequestBatch(requests)
      
      // Resolve individual requests
      results.forEach((result, index) => {
        const request = requests[index]
        if (result.success) {
          request.resolve(result.data)
        } else {
          request.reject(new Error(result.error || 'Batch request failed'))
        }
      })
    } catch (error) {
      // Reject all requests in case of batch failure
      requests.forEach(request => {
        request.reject(error)
      })
    }
  }

  /**
   * Execute batch of requests (to be implemented based on specific needs)
   */
  private async executeRequestBatch(requests: BatchRequest[]): Promise<BatchResult[]> {
    // Group requests by endpoint and method
    const grouped = this.groupRequestsByEndpoint(requests)
    const results: BatchResult[] = []

    for (const [key, groupedRequests] of Array.from(grouped.entries())) {
      const [method, endpoint] = key.split(':')
      
      try {
        if (method === 'GET' && this.canBatchGetRequests(endpoint)) {
          // Batch GET requests
          const batchResult = await this.executeBatchGet(endpoint, groupedRequests)
          results.push(...batchResult)
        } else {
          // Execute requests individually
          for (const request of groupedRequests) {
            try {
              const data = await this.executeSingleRequest(request)
              results.push({
                id: request.id,
                success: true,
                data
              })
            } catch (error) {
              results.push({
                id: request.id,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          }
        }
      } catch (error) {
        // Mark all requests in group as failed
        groupedRequests.forEach(request => {
          results.push({
            id: request.id,
            success: false,
            error: error instanceof Error ? error.message : 'Batch execution failed'
          })
        })
      }
    }

    return results
  }

  /**
   * Group requests by endpoint and method
   */
  private groupRequestsByEndpoint(requests: BatchRequest[]): Map<string, BatchRequest[]> {
    const grouped = new Map<string, BatchRequest[]>()
    
    requests.forEach(request => {
      const key = this.getBatchKey(request.endpoint, request.method)
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(request)
    })
    
    return grouped
  }

  /**
   * Check if GET requests can be batched for this endpoint
   */
  private canBatchGetRequests(endpoint: string): boolean {
    // Define endpoints that support batching
    const batchableEndpoints = [
      '/api/inventory/items?limit=999999',
      '/api/categories',
      '/api/locations',
      '/api/users'
    ]
    
    return batchableEndpoints.some(batchable => endpoint.startsWith(batchable))
  }

  /**
   * Execute batch GET requests
   */
  private async executeBatchGet(endpoint: string, requests: BatchRequest[]): Promise<BatchResult[]> {
    // Combine parameters from all requests
    const combinedParams = this.combineGetParams(requests)
    
    try {
      // Execute single request with combined parameters
      const response = await fetch(`${endpoint}?${new URLSearchParams(combinedParams).toString()}`)
      const data = await response.json()
      
      // Split results back to individual requests
      return this.splitBatchGetResults(data, requests)
    } catch (error) {
      // Return error for all requests
      return requests.map(request => ({
        id: request.id,
        success: false,
        error: error instanceof Error ? error.message : 'Batch GET failed'
      }))
    }
  }

  /**
   * Combine parameters from multiple GET requests
   */
  private combineGetParams(requests: BatchRequest[]): Record<string, string> {
    const combined: Record<string, string> = {}
    
    // For now, just use parameters from the first request
    // This could be enhanced to intelligently combine parameters
    if (requests.length > 0) {
      Object.assign(combined, requests[0].params)
    }
    
    return combined
  }

  /**
   * Split batch GET results back to individual requests
   */
  private splitBatchGetResults(data: any, requests: BatchRequest[]): BatchResult[] {
    // For now, return the same data to all requests
    // This could be enhanced to split results based on request parameters
    return requests.map(request => ({
      id: request.id,
      success: true,
      data
    }))
  }

  /**
   * Execute single request
   */
  private async executeSingleRequest(request: BatchRequest): Promise<any> {
    const url = new URL(request.endpoint, window.location.origin)
    
    // Add parameters to URL for GET requests
    if (request.method === 'GET' && request.params) {
      Object.entries(request.params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    const fetchOptions: RequestInit = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    // Add body for non-GET requests
    if (request.method !== 'GET' && request.params) {
      fetchOptions.body = JSON.stringify(request.params)
    }

    const response = await fetch(url.toString(), fetchOptions)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response.json()
  }

  /**
   * Get batch statistics
   */
  getStats(): {
    pendingRequests: number
    activeBatches: number
    totalProcessed: number
  } {
    return {
      pendingRequests: this.pendingRequests.size,
      activeBatches: this.batchTimers.size,
      totalProcessed: this.requestId
    }
  }

  /**
   * Clear all pending requests and timers
   */
  clear(): void {
    // Clear all timers
    this.batchTimers.forEach(timer => clearTimeout(timer))
    this.batchTimers.clear()

    // Reject all pending requests
    this.pendingRequests.forEach(request => {
      request.reject(new Error('Request batcher cleared'))
    })
    this.pendingRequests.clear()
  }
}

// Export singleton instance
export const requestBatcher = new RequestBatcher()

// Utility functions
export function batchRequest<T>(
  endpoint: string,
  method: string = 'GET',
  params: any = {},
  priority: 'high' | 'medium' | 'low' = 'medium'
): Promise<T> {
  return requestBatcher.batchRequest<T>(endpoint, method, params, priority)
}

export function getBatchStats() {
  return requestBatcher.getStats()
}

export function clearBatcher() {
  requestBatcher.clear()
}
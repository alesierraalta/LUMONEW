/**
 * Service role key validation utility
 * Provides centralized validation and client creation for service role operations
 */

import { createClient } from '@supabase/supabase-js'
import { APIError } from '../utils/api-error-handler'
import { Logger } from '../utils/logger'
import { EnvironmentConfig } from '../config/environment'

export class ServiceRoleValidator {
  /**
   * Check if service role key is available
   */
  static hasServiceRoleKey(): boolean {
    return !!(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
  }
  
  /**
   * Require service role key for operation
   * Throws error if not available
   */
  static requireServiceRole(): void {
    if (!this.hasServiceRoleKey()) {
      Logger.security('Service role key required but not available', {
        operation: 'requireServiceRole',
        timestamp: new Date().toISOString()
      })
      
      throw new APIError(
        500, 
        'Service role key required for this operation',
        'SERVICE_ROLE_REQUIRED'
      )
    }
  }
  
  /**
   * Create service role client with validation
   */
  static createServiceClient() {
    this.requireServiceRole()
    
    const config = EnvironmentConfig.getDatabaseConfig()
    
    if (!config.serviceRoleKey) {
      throw new APIError(
        500,
        'Service role key not configured',
        'SERVICE_ROLE_NOT_CONFIGURED'
      )
    }
    
    try {
      const client = createClient(config.url, config.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      Logger.debug('Service role client created successfully')
      return client
    } catch (error) {
      Logger.error('Failed to create service role client:', error)
      throw new APIError(
        500,
        'Failed to create service role client',
        'SERVICE_CLIENT_CREATION_FAILED'
      )
    }
  }
  
  /**
   * Validate service role key format
   */
  static validateServiceRoleKey(key: string): boolean {
    if (!key || typeof key !== 'string') {
      return false
    }
    
    // Service role keys should be JWT tokens
    const parts = key.split('.')
    if (parts.length !== 3) {
      return false
    }
    
    try {
      // Basic JWT structure validation
      const header = JSON.parse(atob(parts[0]))
      const payload = JSON.parse(atob(parts[1]))
      
      // Check if it's a service role key
      if (payload.role !== 'service_role') {
        return false
      }
      
      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return false
      }
      
      return true
    } catch (error) {
      Logger.warn('Invalid service role key format:', error)
      return false
    }
  }
  
  /**
   * Get service role client info (for debugging)
   */
  static getServiceClientInfo(): Record<string, any> {
    const hasKey = this.hasServiceRoleKey()
    const config = EnvironmentConfig.getDatabaseConfig()
    
    return {
      hasServiceRoleKey: hasKey,
      supabaseUrl: EnvironmentConfig.getMaskedURL(),
      keyConfigured: !!config.serviceRoleKey,
      keyValid: hasKey ? this.validateServiceRoleKey(config.serviceRoleKey!) : false
    }
  }
  
  /**
   * Execute operation with service role client
   */
  static async withServiceClient<T>(
    operation: (client: any) => Promise<T>,
    operationName: string = 'service_operation'
  ): Promise<T> {
    const client = this.createServiceClient()
    
    try {
      Logger.debug(`Executing service role operation: ${operationName}`)
      const result = await operation(client)
      Logger.debug(`Service role operation completed: ${operationName}`)
      return result
    } catch (error) {
      Logger.error(`Service role operation failed: ${operationName}`, error)
      throw error
    }
  }
  
  /**
   * Check if current environment supports service role operations
   */
  static canPerformServiceRoleOperations(): boolean {
    return this.hasServiceRoleKey() && EnvironmentConfig.isProduction() || EnvironmentConfig.isDevelopment()
  }
  
  /**
   * Log service role operation attempt
   */
  static logServiceRoleOperation(
    operation: string, 
    success: boolean, 
    details?: any
  ): void {
    Logger.security('Service role operation', {
      operation,
      success,
      details: EnvironmentConfig.isDevelopment() ? details : '[REDACTED]',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    })
  }
  
  /**
   * Validate service role permissions for specific operations
   */
  static validateServiceRolePermissions(operation: string): void {
    const allowedOperations = [
      'user_management',
      'audit_logging',
      'data_migration',
      'system_maintenance',
      'bulk_operations'
    ]
    
    if (!allowedOperations.includes(operation)) {
      Logger.security('Unauthorized service role operation attempted', {
        operation,
        timestamp: new Date().toISOString()
      })
      
      throw new APIError(
        403,
        'Operation not allowed with service role',
        'SERVICE_ROLE_OPERATION_NOT_ALLOWED'
      )
    }
  }
}
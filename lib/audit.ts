import { createClient as createBrowserClient } from './supabase/client'
import { getServiceRoleClient } from './supabase/service-role'
import { ensureUserExists } from './auth/user-sync'
import type { SupabaseClient } from '@supabase/supabase-js'

// Use browser client for regular operations (compatible with both server and client)
const supabase = createBrowserClient()

// Enhanced audit log interface
export interface AuditLog {
  id: string
  user_id: string | null
  user_email: string | null
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'EXPORT' | 'IMPORT' | 'BULK_OPERATION'
  table_name: string
  record_id: string
  old_values: any | null
  new_values: any | null
  ip_address: string | null
  user_agent: string | null
  session_id: string | null
  created_at: string
  metadata?: {
    action_type?: string
    affected_fields?: string[]
    bulk_operation_id?: string
    reason?: string
    notes?: string
    record_count?: number
    error?: string
    [key: string]: any
  }
}

// Audit service with comprehensive tracking
export class AuditService {
  private static instance: AuditService
  private currentUser: any = null
  private sessionId: string | null = null

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService()
    }
    return AuditService.instance
  }

  // Set current user context
  setUserContext(user: any, sessionId?: string) {
    this.currentUser = user
    this.sessionId = sessionId || null
  }

  // Get client information (client-side compatible)
  private async getClientInfo() {
    try {
      // For client-side components, we'll use browser APIs when available
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'server-side'
      const ipAddress = null // Set to null instead of invalid IP format
      
      return {
        ip_address: ipAddress,
        user_agent: userAgent
      }
    } catch (error) {
      console.warn('Could not get client info:', error)
      return {
        ip_address: null,
        user_agent: null
      }
    }
  }

  // Get supabase client for audit operations
  private getSupabaseClient(providedClient?: SupabaseClient): SupabaseClient {
    // Use provided client if available (should be authenticated server client)
    if (providedClient) {
      return providedClient
    }
    
    // Check if we're in a server environment where service role key is available
    if (typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        return getServiceRoleClient()
      } catch (error) {
        console.warn('Could not create service client for audit operations:', error)
        return supabase
      }
    }
    
    // For client-side operations, use the regular browser client
    // Note: This means audit operations from client-side will use user permissions
    return supabase
  }

  // Log any operation with comprehensive details
  async logOperation(params: {
    operation: AuditLog['operation']
    table_name: string
    record_id: string
    old_values?: any
    new_values?: any
    user_id?: string
    user_email?: string
    metadata?: AuditLog['metadata']
    supabaseClient?: SupabaseClient
  }) {
    try {
      const clientInfo = await this.getClientInfo()
      
      // Get user ID and ensure user exists in users table
      const userId = params.user_id || this.currentUser?.id || null
      
      // If we have a user ID, try to ensure the user exists in the users table
      if (userId && typeof window === 'undefined') {
        // Only attempt user sync on server-side to avoid browser context issues
        try {
          await ensureUserExists(userId)
        } catch (syncError) {
          console.warn('Could not sync user, will proceed without user reference:', syncError)
        }
      }
      
      const auditEntry = {
        user_id: userId,
        user_email: params.user_email || this.currentUser?.email || null,
        operation: params.operation,
        table_name: params.table_name,
        record_id: params.record_id,
        old_values: params.old_values || null,
        new_values: params.new_values || null,
        session_id: this.sessionId,
        ...clientInfo,
        metadata: params.metadata || null
      }

      // Use provided client or get fallback client
      const client = this.getSupabaseClient(params.supabaseClient)
      
      const { data, error } = await client
        .from('audit_logs')
        .insert([auditEntry])
        .select()
        .single()

      if (error) {
        // If it's a foreign key constraint error, try again without user_id
        if (error.code === '23503' && error.message.includes('user_id')) {
          console.warn('User ID not found in users table, logging audit without user reference')
          const auditEntryWithoutUser = {
            ...auditEntry,
            user_id: null,
            metadata: {
              ...auditEntry.metadata,
              original_user_id: userId,
              note: 'User ID not found in users table - user sync may be needed'
            }
          }
          
          const { data: retryData, error: retryError } = await client
            .from('audit_logs')
            .insert([auditEntryWithoutUser])
            .select()
            .single()
            
          if (retryError) {
            console.error('Audit logging failed on retry:', retryError)
            return null
          }
          
          return retryData
        }
        
        console.error('Audit logging failed:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Audit logging error:', error)
      return null
    }
  }

  // Log CREATE operations
  async logCreate(table_name: string, record_id: string, new_values: any, metadata?: AuditLog['metadata'], supabaseClient?: SupabaseClient) {
    return this.logOperation({
      operation: 'INSERT',
      table_name,
      record_id,
      new_values,
      metadata: {
        ...metadata,
        action_type: 'create'
      },
      supabaseClient
    })
  }

  // Log UPDATE operations with field-level tracking
  async logUpdate(table_name: string, record_id: string, old_values: any, new_values: any, metadata?: AuditLog['metadata'], supabaseClient?: SupabaseClient) {
    // Identify changed fields
    const affected_fields = Object.keys(new_values).filter(key =>
      JSON.stringify(old_values[key]) !== JSON.stringify(new_values[key])
    )

    return this.logOperation({
      operation: 'UPDATE',
      table_name,
      record_id,
      old_values,
      new_values,
      metadata: {
        ...metadata,
        action_type: 'update',
        affected_fields
      },
      supabaseClient
    })
  }

  // Log DELETE operations
  async logDelete(table_name: string, record_id: string, old_values: any, metadata?: AuditLog['metadata'], supabaseClient?: SupabaseClient) {
    return this.logOperation({
      operation: 'DELETE',
      table_name,
      record_id,
      old_values,
      metadata: {
        ...metadata,
        action_type: 'delete'
      },
      supabaseClient
    })
  }

  // Log user authentication events
  async logAuth(operation: 'LOGIN' | 'LOGOUT', user_id: string, user_email: string, metadata?: AuditLog['metadata']) {
    return this.logOperation({
      operation,
      table_name: 'users',
      record_id: user_id,
      user_id,
      user_email,
      metadata: {
        ...metadata,
        action_type: operation.toLowerCase()
      }
    })
  }

  // Log bulk operations
  async logBulkOperation(operation_type: string, table_name: string, affected_records: string[], metadata?: AuditLog['metadata']) {
    const bulk_operation_id = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Log each affected record
    const promises = affected_records.map(record_id => 
      this.logOperation({
        operation: 'BULK_OPERATION',
        table_name,
        record_id,
        metadata: {
          ...metadata,
          action_type: operation_type,
          bulk_operation_id
        }
      })
    )

    return Promise.all(promises)
  }

  // Log data export/import operations
  async logDataOperation(operation: 'EXPORT' | 'IMPORT', table_name: string, record_count: number, metadata?: AuditLog['metadata']) {
    return this.logOperation({
      operation,
      table_name,
      record_id: `${operation.toLowerCase()}_${Date.now()}`,
      metadata: {
        ...metadata,
        action_type: operation.toLowerCase(),
        record_count
      }
    })
  }
// Get recent audit logs
  async getRecentLogs(limit: number = 10, supabaseClient?: SupabaseClient): Promise<AuditLog[]> {
    try {
      const client = this.getSupabaseClient(supabaseClient)
      const { data, error } = await client
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting recent audit logs:', error)
      throw error
    }
  }

  // Get audit logs with advanced filtering
  async getAuditLogs(filters: {
    limit?: number
    offset?: number
    user_id?: string
    user_email?: string
    table_name?: string
    operation?: string
    date_from?: string
    date_to?: string
    search?: string
  } = {}, supabaseClient?: SupabaseClient) {
    const client = this.getSupabaseClient(supabaseClient)
    let query = client
      .from('audit_logs')
      .select(`
        *,
        users (id, name, email)
      `)

    // Apply filters
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    
    if (filters.user_email) {
      query = query.ilike('user_email', `%${filters.user_email}%`)
    }
    
    if (filters.table_name) {
      query = query.eq('table_name', filters.table_name)
    }
    
    if (filters.operation) {
      query = query.eq('operation', filters.operation)
    }
    
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    if (filters.search) {
      query = query.or(`
        user_email.ilike.%${filters.search}%,
        table_name.ilike.%${filters.search}%,
        operation.ilike.%${filters.search}%,
        record_id.ilike.%${filters.search}%
      `)
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(filters.limit || 50)

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching audit logs:', error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  }

  // Get audit statistics
  async getAuditStats(date_from?: string, date_to?: string, supabaseClient?: SupabaseClient) {
    try {
      const client = this.getSupabaseClient(supabaseClient)
      let query = client
        .from('audit_logs')
        .select('operation, table_name, created_at')

      if (date_from) {
        query = query.gte('created_at', date_from)
      }
      
      if (date_to) {
        query = query.lte('created_at', date_to)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching audit stats:', error)
        return null
      }

      // Calculate statistics
      const stats = {
        total_operations: data?.length || 0,
        operations_by_type: {} as Record<string, number>,
        operations_by_table: {} as Record<string, number>,
        recent_activity: data?.slice(0, 10) || []
      }

      data?.forEach(log => {
        // Count by operation type
        stats.operations_by_type[log.operation] = (stats.operations_by_type[log.operation] || 0) + 1
        
        // Count by table
        stats.operations_by_table[log.table_name] = (stats.operations_by_table[log.table_name] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('Error calculating audit stats:', error)
      return null
    }
  }

  // Get recent activity for dashboard
  async getRecentActivity(limit: number = 10, supabaseClient?: SupabaseClient) {
    const client = this.getSupabaseClient(supabaseClient)
    const { data, error } = await client
      .from('audit_logs')
      .select(`
        *,
        users (id, name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent activity:', error)
      return []
    }

    return data || []
  }

  // Get user activity history
  async getUserActivity(user_id: string, limit: number = 20, supabaseClient?: SupabaseClient) {
    const client = this.getSupabaseClient(supabaseClient)
    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching user activity:', error)
      return []
    }

    return data || []
  }

  // Clean up old audit logs (for maintenance)
  async cleanupOldLogs(days_to_keep: number = 90, supabaseClient?: SupabaseClient) {
    const cutoff_date = new Date()
    cutoff_date.setDate(cutoff_date.getDate() - days_to_keep)

    const client = this.getSupabaseClient(supabaseClient)
    const { error } = await client
      .from('audit_logs')
      .delete()
      .lt('created_at', cutoff_date.toISOString())

    if (error) {
      console.error('Error cleaning up audit logs:', error)
      return false
    }

    return true
  }
}

// Export singleton instance
export const auditService = AuditService.getInstance()

// Helper function to create audit-aware database operations
export function withAudit<T extends (...args: any[]) => Promise<any>>(
  operation: T,
  auditParams: {
    table_name: string
    operation_type: 'INSERT' | 'UPDATE' | 'DELETE'
    get_record_id: (result: any) => string
    get_old_values?: () => Promise<any>
    get_new_values?: (result: any) => any
  }
): T {
  return (async (...args: any[]) => {
    try {
      // Get old values for updates/deletes
      const old_values = auditParams.get_old_values ? await auditParams.get_old_values() : null
      
      // Execute the operation
      const result = await operation(...args)
      
      // Get record ID and new values
      const record_id = auditParams.get_record_id(result)
      const new_values = auditParams.get_new_values ? auditParams.get_new_values(result) : null
      
      // Log the operation
      await auditService.logOperation({
        operation: auditParams.operation_type,
        table_name: auditParams.table_name,
        record_id,
        old_values,
        new_values
      })
      
      return result
    } catch (error) {
      // Log failed operations too
      await auditService.logOperation({
        operation: auditParams.operation_type,
        table_name: auditParams.table_name,
        record_id: 'failed',
        metadata: {
          action_type: 'failed_operation',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      
      throw error
    }
  }) as T
}
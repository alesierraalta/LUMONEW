import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Service role client for server-side operations that bypass RLS
// This should ONLY be used on the server side for audit operations
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service role operations')
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Singleton instance for server-side use only
let serviceRoleClient: ReturnType<typeof createServiceRoleClient> | null = null

export function getServiceRoleClient() {
  if (!serviceRoleClient) {
    serviceRoleClient = createServiceRoleClient()
  }
  return serviceRoleClient
}
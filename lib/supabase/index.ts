// Main Supabase utilities export
export { createClient as createServerClient } from './server'
export { createClient as createBrowserClient } from './client'
export { createServiceRoleClient, getServiceRoleClient } from './service-role'
export type { Database } from './types'

// Re-export common types from Supabase
export type {
  SupabaseClient,
  User,
  Session,
  AuthError,
  PostgrestError
} from '@supabase/supabase-js'
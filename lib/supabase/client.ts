import { createBrowserClient } from '@supabase/ssr'

// Singleton instance to prevent multiple GoTrueClient instances
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Return existing instance if available
  if (clientInstance) {
    return clientInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not defined')
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseAnonKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined')
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }

  console.log('🔧 Creating Supabase browser client with URL:', supabaseUrl.substring(0, 30) + '...')

  try {
    clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ Supabase browser client created successfully')
    return clientInstance
  } catch (error) {
    console.error('❌ Failed to create Supabase browser client:', error)
    throw error
  }
}
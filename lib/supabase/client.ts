import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
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
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ Supabase browser client created successfully')
    return client
  } catch (error) {
    console.error('❌ Failed to create Supabase browser client:', error)
    throw error
  }
}
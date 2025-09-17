import { getServiceRoleClient } from '../supabase/service-role'
import type { User } from '@supabase/supabase-js'

/**
 * Service for synchronizing Supabase Auth users with application users table
 */
export class UserSyncService {
  private static instance: UserSyncService
  
  static getInstance(): UserSyncService {
    if (!UserSyncService.instance) {
      UserSyncService.instance = new UserSyncService()
    }
    return UserSyncService.instance
  }

  /**
   * Manually sync a specific auth user to the users table
   * This is useful for handling edge cases or manual synchronization
   */
  async syncAuthUser(authUser: User): Promise<boolean> {
    try {
      const supabase = getServiceRoleClient()
      
      const userData = {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.email || 'Unknown User',
        role: authUser.user_metadata?.role || 'user',
        status: 'active' as const,
        created_at: authUser.created_at,
        updated_at: new Date().toISOString()
      }

      const { error } = await (supabase as any)
        .from('users')
        .upsert(userData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Error syncing user:', error)
        return false
      }

      console.log(`✅ User ${authUser.email} synced successfully`)
      return true
    } catch (error) {
      console.error('Error in syncAuthUser:', error)
      return false
    }
  }

  /**
   * Sync all auth users that are missing from the users table
   * This is useful for initial setup or fixing sync issues
   */
  async syncAllMissingUsers(): Promise<{ synced: number; errors: number }> {
    try {
      const supabase = getServiceRoleClient()
      
      // Get all auth users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        console.error('Error fetching auth users:', authError)
        return { synced: 0, errors: 1 }
      }

      // Get existing users in the users table
      const { data: existingUsers, error: usersError } = await supabase
        .from('users')
        .select('id')

      if (usersError) {
        console.error('Error fetching existing users:', usersError)
        return { synced: 0, errors: 1 }
      }

      const existingUserIds = new Set((existingUsers as any[])?.map((u: any) => u.id) || [])
      const missingUsers = authUsers.users.filter(user => !existingUserIds.has(user.id))

      console.log(`Found ${missingUsers.length} users to sync`)

      let synced = 0
      let errors = 0

      // Sync each missing user
      for (const user of missingUsers) {
        const success = await this.syncAuthUser(user)
        if (success) {
          synced++
        } else {
          errors++
        }
      }

      return { synced, errors }
    } catch (error) {
      console.error('Error in syncAllMissingUsers:', error)
      return { synced: 0, errors: 1 }
    }
  }

  /**
   * Check if a user exists in the users table
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const supabase = getServiceRoleClient()
      
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()

      return !error && !!data
    } catch (error) {
      console.error('Error checking user existence:', error)
      return false
    }
  }

  /**
   * Get user info from the users table
   */
  async getUser(userId: string) {
    try {
      const supabase = getServiceRoleClient()
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getUser:', error)
      return null
    }
  }
}

// Export singleton instance
export const userSyncService = UserSyncService.getInstance()

// Helper function to ensure user exists before audit operations
export async function ensureUserExists(userId: string): Promise<boolean> {
  const exists = await userSyncService.userExists(userId)
  
  if (!exists) {
    console.warn(`User ${userId} not found in users table, attempting to sync...`)
    
    try {
      const supabase = getServiceRoleClient()
      const { data: authUser, error } = await supabase.auth.admin.getUserById(userId)
      
      if (error || !authUser.user) {
        console.error('Could not fetch auth user for sync:', error)
        return false
      }
      
      return await userSyncService.syncAuthUser(authUser.user)
    } catch (error) {
      console.error('Error ensuring user exists:', error)
      return false
    }
  }
  
  return true
}
/**
 * Server Location Service - For API routes and server-side operations
 * Uses server-side Supabase client with proper authentication context
 */

import { createClient } from '../supabase/server-with-retry'

export interface Location {
  id: string
  name: string
  address?: string
  created_at: string
  updated_at: string
}

export class ServerLocationService {
  /**
   * Get all locations
   */
  async getAll(): Promise<Location[]> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name')

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching locations:', error)
      throw error
    }
  }

  /**
   * Get location by ID
   */
  async getById(id: string): Promise<Location> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error(`Error fetching location ${id}:`, error)
      throw error
    }
  }

  /**
   * Create new location
   */
  async create(location: {
    name: string
    address?: string
  }): Promise<Location> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('locations')
        .insert([location])
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error creating location:', error)
      throw error
    }
  }

  /**
   * Update location
   */
  async update(id: string, updates: Partial<{
    name: string
    address: string
  }>): Promise<Location> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error(`Error updating location ${id}:`, error)
      throw error
    }
  }

  /**
   * Delete location
   */
  async delete(id: string): Promise<void> {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error(`Error deleting location ${id}:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const serverLocationService = new ServerLocationService()
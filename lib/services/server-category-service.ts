/**
 * Server Category Service - For API routes and server-side operations
 * Uses server-side Supabase client with proper authentication context
 */

import { createClient } from '../supabase/server-with-retry'

export interface Category {
  id: string
  name: string
  description?: string
  color: string
  created_at: string
  updated_at: string
}

export class ServerCategoryService {
  /**
   * Get all categories
   */
  async getAll(): Promise<Category[]> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<Category> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error)
      throw error
    }
  }

  /**
   * Create new category
   */
  async create(category: {
    name: string
    description?: string
    color: string
  }): Promise<Category> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  }

  /**
   * Update category
   */
  async update(id: string, updates: Partial<{
    name: string
    description: string
    color: string
  }>): Promise<Category> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error(`Error updating category ${id}:`, error)
      throw error
    }
  }

  /**
   * Delete category
   */
  async delete(id: string): Promise<void> {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const serverCategoryService = new ServerCategoryService()
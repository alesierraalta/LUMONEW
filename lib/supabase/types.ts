// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: string
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          status?: 'active' | 'inactive'
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          address: string | null
          type: string
          capacity: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          type: string
          capacity?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          type?: string
          capacity?: number | null
          updated_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          name: string
          sku: string
          category_id: string
          location_id: string
          quantity: number
          min_stock: number
          max_stock: number
          unit_price: number
          status: 'active' | 'inactive' | 'discontinued'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sku: string
          category_id: string
          location_id: string
          quantity: number
          min_stock: number
          max_stock: number
          unit_price: number
          status?: 'active' | 'inactive' | 'discontinued'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sku?: string
          category_id?: string
          location_id?: string
          quantity?: number
          min_stock?: number
          max_stock?: number
          unit_price?: number
          status?: 'active' | 'inactive' | 'discontinued'
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values: any | null
          new_values: any | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values?: any | null
          new_values?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          table_name?: string
          record_id?: string
          old_values?: any | null
          new_values?: any | null
        }
      }
      deleted_items: {
        Row: {
          id: string
          original_table_name: string
          original_record_id: string
          original_data: any
          deleted_by: string | null
          deleted_by_name: string | null
          deleted_at: string | null
          deletion_reason: string | null
          expires_at: string | null
          recovery_count: number | null
          last_recovered_at: string | null
          metadata: any | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          original_table_name: string
          original_record_id: string
          original_data: any
          deleted_by?: string | null
          deleted_by_name?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          expires_at?: string | null
          recovery_count?: number | null
          last_recovered_at?: string | null
          metadata?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          original_table_name?: string
          original_record_id?: string
          original_data?: any
          deleted_by?: string | null
          deleted_by_name?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          expires_at?: string | null
          recovery_count?: number | null
          last_recovered_at?: string | null
          metadata?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      recovery_logs: {
        Row: {
          id: string
          deleted_item_id: string | null
          recovered_by: string | null
          recovered_by_name: string | null
          recovered_at: string | null
          recovery_reason: string | null
          recovery_method: string | null
          success: boolean | null
          error_message: string | null
          metadata: any | null
          created_at: string | null
        }
        Insert: {
          id?: string
          deleted_item_id?: string | null
          recovered_by?: string | null
          recovered_by_name?: string | null
          recovered_at?: string | null
          recovery_reason?: string | null
          recovery_method?: string | null
          success?: boolean | null
          error_message?: string | null
          metadata?: any | null
          created_at?: string | null
        }
        Update: {
          id?: string
          deleted_item_id?: string | null
          recovered_by?: string | null
          recovered_by_name?: string | null
          recovered_at?: string | null
          recovery_reason?: string | null
          recovery_method?: string | null
          success?: boolean | null
          error_message?: string | null
          metadata?: any | null
          created_at?: string | null
        }
      }
      cleanup_logs: {
        Row: {
          id: string
          cleanup_type: string
          items_processed: number | null
          items_deleted: number | null
          errors_count: number | null
          started_at: string | null
          completed_at: string | null
          executed_by: string | null
          metadata: any | null
          created_at: string | null
        }
        Insert: {
          id?: string
          cleanup_type: string
          items_processed?: number | null
          items_deleted?: number | null
          errors_count?: number | null
          started_at?: string | null
          completed_at?: string | null
          executed_by?: string | null
          metadata?: any | null
          created_at?: string | null
        }
        Update: {
          id?: string
          cleanup_type?: string
          items_processed?: number | null
          items_deleted?: number | null
          errors_count?: number | null
          started_at?: string | null
          completed_at?: string | null
          executed_by?: string | null
          metadata?: any | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/types';

type DeletedItem = Database['public']['Tables']['deleted_items']['Row'];
type RecoveryLog = Database['public']['Tables']['recovery_logs']['Row'];
type CleanupLog = Database['public']['Tables']['cleanup_logs']['Row'];

export interface DeletedItemWithDetails extends DeletedItem {
  is_expired: boolean;
  days_until_expiry: number;
}

export interface DeletedItemsStats {
  total_deleted_items: number;
  expired_items: number;
  recoverable_items: number;
  items_by_table: Record<string, number>;
  recent_deletions: number;
  total_recoveries: number;
}

export interface DeletedItemsFilters {
  table_name?: string;
  user_id?: string;
  limit?: number;
  offset?: number;
}

export class DeletedItemsService {
  private supabase;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  /**
   * Get deleted items with pagination and filtering
   */
  async getDeletedItems(filters: DeletedItemsFilters = {}): Promise<{
    items: DeletedItemWithDetails[];
    total: number;
  }> {
    // Build query
    let query = this.supabase
      .from('deleted_items')
      .select('*')
      .order('deleted_at', { ascending: false });

    // Apply filters
    if (filters.table_name) {
      query = query.eq('original_table_name', filters.table_name);
    }
    if (filters.user_id) {
      query = query.eq('deleted_by', filters.user_id);
    }

    // Apply pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch deleted items: ${error.message}`);
    }

    // Get total count with same filters
    let countQuery = this.supabase
      .from('deleted_items')
      .select('*', { count: 'exact', head: true });

    if (filters.table_name) {
      countQuery = countQuery.eq('original_table_name', filters.table_name);
    }
    if (filters.user_id) {
      countQuery = countQuery.eq('deleted_by', filters.user_id);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Failed to get deleted items count: ${countError.message}`);
    }

    // Add computed fields
    const items: DeletedItemWithDetails[] = (data || []).map(item => ({
      ...item,
      is_expired: new Date(item.expires_at || '') < new Date(),
      days_until_expiry: Math.ceil(
        (new Date(item.expires_at || '').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    return {
      items,
      total: count || 0,
    };
  }

  /**
   * Get deleted items statistics
   */
  async getStats(): Promise<DeletedItemsStats> {
    // Get total count
    const { count: totalCount, error: totalError } = await this.supabase
      .from('deleted_items')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      throw new Error(`Failed to fetch total count: ${totalError.message}`);
    }

    // Get expired items count
    const { count: expiredCount, error: expiredError } = await this.supabase
      .from('deleted_items')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', new Date().toISOString());

    if (expiredError) {
      throw new Error(`Failed to fetch expired count: ${expiredError.message}`);
    }

    // Get recent deletions (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { count: recentCount, error: recentError } = await this.supabase
      .from('deleted_items')
      .select('*', { count: 'exact', head: true })
      .gte('deleted_at', yesterday.toISOString());

    if (recentError) {
      throw new Error(`Failed to fetch recent count: ${recentError.message}`);
    }

    // Get items by table
    const { data: tableData, error: tableError } = await this.supabase
      .from('deleted_items')
      .select('original_table_name');

    if (tableError) {
      throw new Error(`Failed to fetch table data: ${tableError.message}`);
    }

    const items_by_table = (tableData || []).reduce((acc: Record<string, number>, item) => {
      acc[item.original_table_name] = (acc[item.original_table_name] || 0) + 1;
      return acc;
    }, {});

    // Get total recoveries
    const { count: recoveryCount, error: recoveryError } = await this.supabase
      .from('recovery_logs')
      .select('*', { count: 'exact', head: true });

    if (recoveryError) {
      throw new Error(`Failed to fetch recovery count: ${recoveryError.message}`);
    }

    return {
      total_deleted_items: totalCount || 0,
      expired_items: expiredCount || 0,
      recoverable_items: (totalCount || 0) - (expiredCount || 0),
      items_by_table,
      recent_deletions: recentCount || 0,
      total_recoveries: recoveryCount || 0,
    };
  }

  /**
   * Recover a deleted item
   */
  async recoverItem(itemId: string, reason?: string): Promise<boolean> {
    // Get the deleted item
    const { data: deletedItem, error: fetchError } = await this.supabase
      .from('deleted_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (fetchError || !deletedItem) {
      throw new Error('Deleted item not found');
    }

    // Insert back into original table
    const { error: insertError } = await this.supabase
      .from(deletedItem.original_table_name)
      .insert(deletedItem.original_data);

    if (insertError) {
      throw new Error(`Failed to restore item: ${insertError.message}`);
    }

    // Log the recovery
    const { error: logError } = await this.supabase
      .from('recovery_logs')
      .insert({
        deleted_item_id: itemId,
        recovered_by: deletedItem.deleted_by,
        recovery_reason: reason || 'Manual recovery',
        success: true,
      });

    if (logError) {
      console.warn('Failed to log recovery:', logError.message);
    }

    // Delete from deleted_items
    const { error: deleteError } = await this.supabase
      .from('deleted_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      throw new Error(`Failed to remove from deleted items: ${deleteError.message}`);
    }

    return true;
  }

  /**
   * Get recovery logs for a specific deleted item
   */
  async getRecoveryLogs(itemId: string): Promise<RecoveryLog[]> {
    const { data, error } = await this.supabase
      .from('recovery_logs')
      .select('*')
      .eq('deleted_item_id', itemId)
      .order('recovered_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch recovery logs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all recovery logs with pagination
   */
  async getAllRecoveryLogs(limit = 50, offset = 0): Promise<{
    logs: RecoveryLog[];
    total: number;
  }> {
    const { data, error } = await this.supabase
      .from('recovery_logs')
      .select('*')
      .order('recovered_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch recovery logs: ${error.message}`);
    }

    const { count, error: countError } = await this.supabase
      .from('recovery_logs')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to get recovery logs count: ${countError.message}`);
    }

    return {
      logs: data || [],
      total: count || 0,
    };
  }

  /**
   * Get cleanup logs
   */
  async getCleanupLogs(limit = 50, offset = 0): Promise<{
    logs: CleanupLog[];
    total: number;
  }> {
    const { data, error } = await this.supabase
      .from('cleanup_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch cleanup logs: ${error.message}`);
    }

    const { count, error: countError } = await this.supabase
      .from('cleanup_logs')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to get cleanup logs count: ${countError.message}`);
    }

    return {
      logs: data || [],
      total: count || 0,
    };
  }

  /**
   * Manually trigger cleanup of expired items
   */
  async manualCleanup(): Promise<{ success: boolean; deleted_count: number; message: string }> {
    const { data, error } = await this.supabase.rpc('manual_cleanup_expired_items');

    if (error) {
      throw new Error(`Failed to run manual cleanup: ${error.message}`);
    }

    return data;
  }

  /**
   * Get deleted items by table name
   */
  async getDeletedItemsByTable(tableName: string, limit = 50, offset = 0): Promise<{
    items: DeletedItemWithDetails[];
    total: number;
  }> {
    return this.getDeletedItems({
      table_name: tableName,
      limit,
      offset,
    });
  }

  /**
   * Get deleted items by user
   */
  async getDeletedItemsByUser(userId: string, limit = 50, offset = 0): Promise<{
    items: DeletedItemWithDetails[];
    total: number;
  }> {
    return this.getDeletedItems({
      user_id: userId,
      limit,
      offset,
    });
  }

  /**
   * Search deleted items by content
   */
  async searchDeletedItems(query: string, limit = 50, offset = 0): Promise<{
    items: DeletedItemWithDetails[];
    total: number;
  }> {
    const { data, error } = await this.supabase
      .from('deleted_items')
      .select('*')
      .or(`original_data::text.ilike.%${query}%,deletion_reason.ilike.%${query}%`)
      .order('deleted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to search deleted items: ${error.message}`);
    }

    const { count, error: countError } = await this.supabase
      .from('deleted_items')
      .select('*', { count: 'exact', head: true })
      .or(`original_data::text.ilike.%${query}%,deletion_reason.ilike.%${query}%`);

    if (countError) {
      throw new Error(`Failed to get search results count: ${countError.message}`);
    }

    return {
      items: data || [],
      total: count || 0,
    };
  }

  /**
   * Get available table names for filtering
   */
  async getAvailableTables(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('deleted_items')
      .select('original_table_name')
      .order('original_table_name');

    if (error) {
      throw new Error(`Failed to fetch available tables: ${error.message}`);
    }

    // Get unique table names
    const uniqueTables = [...new Set(data?.map(item => item.original_table_name) || [])];
    return uniqueTables;
  }

  /**
   * Get deleted items that are about to expire (within 7 days)
   */
  async getItemsExpiringSoon(days = 7): Promise<DeletedItemWithDetails[]> {
    const { data, error } = await this.supabase
      .from('deleted_items')
      .select('*')
      .gte('expires_at', new Date().toISOString())
      .lte('expires_at', new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString())
      .order('expires_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch items expiring soon: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Bulk recover multiple items
   */
  async bulkRecoverItems(itemIds: string[], reason?: string): Promise<{
    success: boolean;
    recovered_count: number;
    errors: string[];
  }> {
    const results = await Promise.allSettled(
      itemIds.map(id => this.recoverItem(id, reason))
    );

    const recovered_count = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;

    const errors = results
      .filter(result => result.status === 'rejected')
      .map(result => (result as PromiseRejectedResult).reason.message);

    return {
      success: errors.length === 0,
      recovered_count,
      errors,
    };
  }
}

// Export singleton instance
export const deletedItemsService = new DeletedItemsService();


'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trash2, 
  RotateCcw, 
  Clock, 
  Database, 
  Users, 
  AlertTriangle,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { DeletedItemsTableSimple } from './deleted-items-table-simple';
import { DeletedItemsStats } from './deleted-items-stats';
import { RecoveryLogsTable } from './recovery-logs-table';
import { CleanupLogsTable } from './cleanup-logs-table';
import { DeletedItemsFilters } from './deleted-items-filters';
import { deletedItemsService, DeletedItemsStats as StatsType } from '@/lib/services/deleted-items-service';

export function DeletedItemsDashboard() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<{
    table_name?: string;
    user_id?: string;
    search?: string;
  }>({});

  const loadStats = async () => {
    try {
      const statsData = await deletedItemsService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deleted Items</h1>
          <p className="text-muted-foreground">
            Manage and recover deleted items from the last 6 months
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deleted Items</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_deleted_items}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recent_deletions} deleted in last 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recoverable Items</CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.recoverable_items}</div>
              <p className="text-xs text-muted-foreground">
                Can be recovered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Items</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expired_items}</div>
              <p className="text-xs text-muted-foreground">
                Permanently deleted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recoveries</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_recoveries}</div>
              <p className="text-xs text-muted-foreground">
                Items recovered
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Items by Table */}
      {stats?.items_by_table && Object.keys(stats.items_by_table).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Items by Table
            </CardTitle>
            <CardDescription>
              Distribution of deleted items across different tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.items_by_table).map(([table, count]) => (
                <Badge key={table} variant="secondary" className="text-sm">
                  {table}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Deleted Items</TabsTrigger>
          <TabsTrigger value="recovery-logs">Recovery Logs</TabsTrigger>
          <TabsTrigger value="cleanup-logs">Cleanup Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <DeletedItemsFilters onFiltersChange={setFilters} />
          <DeletedItemsTableSimple filters={filters} />
        </TabsContent>

        <TabsContent value="recovery-logs" className="space-y-4">
          <RecoveryLogsTable />
        </TabsContent>

        <TabsContent value="cleanup-logs" className="space-y-4">
          <CleanupLogsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}


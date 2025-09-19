'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  User,
  Database
} from 'lucide-react';
import { deletedItemsService } from '@/lib/services/deleted-items-service';

interface DeletedItemsFiltersProps {
  onFiltersChange?: (filters: {
    table_name?: string;
    user_id?: string;
    search?: string;
  }) => void;
}

export function DeletedItemsFilters({ onFiltersChange }: DeletedItemsFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAvailableTables = async () => {
    try {
      setLoading(true);
      const tables = await deletedItemsService.getAvailableTables();
      setAvailableTables(tables);
    } catch (error) {
      console.error('Failed to load available tables:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableTables();
  }, []);

  useEffect(() => {
    const filters = {
      ...(selectedTable && selectedTable !== 'all' && { table_name: selectedTable }),
      ...(selectedUser && selectedUser !== 'all' && { user_id: selectedUser }),
      ...(searchQuery && { search: searchQuery }),
    };
    
    onFiltersChange?.(filters);
  }, [selectedTable, selectedUser, searchQuery, onFiltersChange]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTable('all');
    setSelectedUser('all');
  };

  const hasActiveFilters = searchQuery || (selectedTable && selectedTable !== 'all') || (selectedUser && selectedUser !== 'all');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
        <CardDescription>
          Filter deleted items by table, user, or search content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table Filter */}
          <div className="space-y-2">
            <Label htmlFor="table">Table</Label>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger>
                <SelectValue placeholder="All tables" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tables</SelectItem>
                {availableTables.map((table) => (
                  <SelectItem key={table} value={table}>
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      {table}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Filter */}
          <div className="space-y-2">
            <Label htmlFor="user">User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {/* TODO: Load users from API */}
                <SelectItem value="current">Current user</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  <Search className="h-3 w-3" />
                  Search: {searchQuery}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedTable && (
                <Badge variant="secondary" className="gap-1">
                  <Database className="h-3 w-3" />
                  Table: {selectedTable}
                  <button
                    onClick={() => setSelectedTable('all')}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedUser && (
                <Badge variant="secondary" className="gap-1">
                  <User className="h-3 w-3" />
                  User: {selectedUser}
                  <button
                    onClick={() => setSelectedUser('all')}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


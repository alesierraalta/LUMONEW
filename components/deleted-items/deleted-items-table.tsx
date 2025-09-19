'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  RotateCcw, 
  Eye, 
  MoreHorizontal, 
  Calendar,
  User,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2
} from 'lucide-react';
import { deletedItemsService, DeletedItemWithDetails } from '@/lib/services/deleted-items-service';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/components/ui/toast';

interface DeletedItemsTableProps {
  filters?: {
    table_name?: string;
    user_id?: string;
    limit?: number;
    offset?: number;
  };
}

export function DeletedItemsTable({ filters = {} }: DeletedItemsTableProps) {
  const { addToast } = useToast();
  const [items, setItems] = useState<DeletedItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DeletedItemWithDetails | null>(null);
  const [recoveryReason, setRecoveryReason] = useState('');
  const [bulkRecoveryReason, setBulkRecoveryReason] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);

  const loadItems = async () => {
    try {
      setLoading(true);
      const result = await deletedItemsService.getDeletedItems({
        ...filters,
        limit: pageSize,
        offset: currentPage * pageSize,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load deleted items:', error);
      addToast({ type: 'error', title: 'Failed to load deleted items' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [filters, currentPage]);

  const handleRecoverItem = async (item: DeletedItemWithDetails, reason?: string) => {
    try {
      await deletedItemsService.recoverItem(item.id, reason);
      addToast({ type: 'success', title: 'Item recovered successfully' });
      setRecoveryDialogOpen(false);
      setSelectedItem(null);
      setRecoveryReason('');
      loadItems();
    } catch (error) {
      console.error('Failed to recover item:', error);
      addToast({ type: 'error', title: 'Failed to recover item' });
    }
  };

  const handleBulkRecover = async () => {
    if (selectedItems.length === 0) return;

    try {
      const result = await deletedItemsService.bulkRecoverItems(
        selectedItems,
        bulkRecoveryReason
      );

      if (result.success) {
        addToast({ type: 'success', title: `Successfully recovered ${result.recovered_count} items` });
      } else {
        addToast({ type: 'error', title: `Failed to recover some items: ${result.errors.join(', ')}` });
      }

      setSelectedItems([]);
      setBulkRecoveryReason('');
      loadItems();
    } catch (error) {
      console.error('Failed to bulk recover items:', error);
      addToast({ type: 'error', title: 'Failed to recover items' });
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const getStatusBadge = (item: DeletedItemWithDetails) => {
    if (item.is_expired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (item.days_until_expiry <= 7) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        Expires Soon
      </Badge>;
    }
    
    return <Badge variant="default" className="bg-green-100 text-green-800">
      Recoverable
    </Badge>;
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedItems.length} items selected
                </span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Bulk Recover
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Recover Items</DialogTitle>
                      <DialogDescription>
                        Recover {selectedItems.length} selected items
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bulk-reason">Recovery Reason (Optional)</Label>
                        <Textarea
                          id="bulk-reason"
                          value={bulkRecoveryReason}
                          onChange={(e) => setBulkRecoveryReason(e.target.value)}
                          placeholder="Enter reason for recovery..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBulkRecoveryReason('')}>
                        Cancel
                      </Button>
                      <Button onClick={handleBulkRecover}>
                        Recover Items
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItems([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Deleted Items</CardTitle>
          <CardDescription>
            {total} total items • {items.filter(item => !item.is_expired).length} recoverable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === items.length && items.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Elemento Eliminado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Eliminado por</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{item.original_table_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{item.original_record_id}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{item.deleted_by_name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(item.deleted_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(item.expires_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item.recovery_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedItem(item);
                              setRecoveryDialogOpen(true);
                            }}
                            disabled={item.is_expired}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedItem(item);
                              setRecoveryDialogOpen(true);
                            }}
                            disabled={item.is_expired}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Recover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, total)} of {total} items
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recovery Dialog */}
      <Dialog open={recoveryDialogOpen} onOpenChange={setRecoveryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recover Deleted Item</DialogTitle>
            <DialogDescription>
              Review the deleted item details and provide a reason for recovery
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Table</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{selectedItem.original_table_name}</span>
                  </div>
                </div>
                <div>
                  <Label>Record ID</Label>
                  <div className="font-mono text-sm mt-1">{selectedItem.original_record_id}</div>
                </div>
                <div>
                  <Label>Deleted By</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedItem.deleted_by_name || 'Unknown'}</span>
                  </div>
                </div>
                <div>
                  <Label>Deleted At</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(selectedItem.deleted_at)}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Original Data</Label>
                <div className="mt-1 p-3 bg-muted rounded-md max-h-40 overflow-auto">
                  <pre className="text-xs">
                    {JSON.stringify(selectedItem.original_data, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <Label htmlFor="recovery-reason">Recovery Reason (Optional)</Label>
                <Textarea
                  id="recovery-reason"
                  value={recoveryReason}
                  onChange={(e) => setRecoveryReason(e.target.value)}
                  placeholder="Enter reason for recovery..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecoveryDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedItem && handleRecoverItem(selectedItem, recoveryReason)}
              disabled={selectedItem?.is_expired}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Recover Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


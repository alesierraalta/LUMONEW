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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RotateCcw, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { deletedItemsService } from '@/lib/services/deleted-items-service';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/components/ui/toast';

interface RecoveryLog {
  id: string;
  deleted_item_id: string;
  recovered_by: string;
  recovered_by_name: string;
  recovered_at: string;
  recovery_reason: string | null;
  recovery_method: string;
  success: boolean;
  error_message: string | null;
  metadata: any;
  created_at: string;
}

export function RecoveryLogsTable() {
  const { addToast } = useToast();
  const [logs, setLogs] = useState<RecoveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const result = await deletedItemsService.getAllRecoveryLogs(pageSize, currentPage * pageSize);
      setLogs(result.logs);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load recovery logs:', error);
      addToast({ type: 'error', title: 'Failed to load recovery logs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentPage]);

  const getStatusBadge = (success: boolean, errorMessage: string | null) => {
    if (success) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Success
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    }
  };

  const getMethodBadge = (method: string) => {
    const variants = {
      manual: 'default',
      automatic: 'secondary',
      bulk: 'outline',
    } as const;

    return (
      <Badge variant={variants[method as keyof typeof variants] || 'default'}>
        {method}
      </Badge>
    );
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Recovery Logs
            </CardTitle>
            <CardDescription>
              Track all recovery operations for deleted items
            </CardDescription>
          </div>
          <Button onClick={loadLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Item ID</TableHead>
                <TableHead>Recovered By</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Recovered At</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {getStatusBadge(log.success, log.error_message)}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{log.deleted_item_id}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{log.recovered_by_name || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getMethodBadge(log.recovery_method)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(log.recovered_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {log.recovery_reason || 'No reason provided'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {log.error_message && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm truncate max-w-32" title={log.error_message}>
                          {log.error_message}
                        </span>
                      </div>
                    )}
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
              Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, total)} of {total} logs
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

        {logs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No recovery logs found
          </div>
        )}
      </CardContent>
    </Card>
  );
}


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
  Trash2, 
  Calendar, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  Database
} from 'lucide-react';
import { deletedItemsService } from '@/lib/services/deleted-items-service';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/components/ui/toast';

interface CleanupLog {
  id: string;
  cleanup_type: string;
  items_processed: number;
  items_deleted: number;
  errors_count: number;
  started_at: string;
  completed_at: string | null;
  executed_by: string | null;
  metadata: any;
  created_at: string;
}

export function CleanupLogsTable() {
  const { addToast } = useToast();
  const [logs, setLogs] = useState<CleanupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const result = await deletedItemsService.getCleanupLogs(pageSize, currentPage * pageSize);
      setLogs(result.logs);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load cleanup logs:', error);
      addToast({ type: 'error', title: 'Failed to load cleanup logs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentPage]);

  const getStatusBadge = (log: CleanupLog) => {
    if (log.completed_at) {
      if (log.errors_count > 0) {
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Completed with errors
          </Badge>
        );
      } else {
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      }
    } else {
      return (
        <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          Running
        </Badge>
      );
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      expired_items: 'default',
      manual_cleanup: 'secondary',
      bulk_cleanup: 'outline',
      scheduled_cleanup: 'default',
    } as const;

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'default'}>
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
  };

  const formatDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return 'Running...';
    
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const duration = end.getTime() - start.getTime();
    
    if (duration < 1000) return '< 1s';
    if (duration < 60000) return `${Math.round(duration / 1000)}s`;
    return `${Math.round(duration / 60000)}m`;
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
              <Trash2 className="h-5 w-5" />
              Cleanup Logs
            </CardTitle>
            <CardDescription>
              Track automatic and manual cleanup operations
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
                <TableHead>Type</TableHead>
                <TableHead>Items Processed</TableHead>
                <TableHead>Items Deleted</TableHead>
                <TableHead>Errors</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Executed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {getStatusBadge(log)}
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(log.cleanup_type)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{log.items_processed}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{log.items_deleted}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.errors_count > 0 ? (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">{log.errors_count}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">0</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(log.started_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatDuration(log.started_at, log.completed_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {log.executed_by ? 'User' : 'System'}
                    </span>
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
            No cleanup logs found
          </div>
        )}
      </CardContent>
    </Card>
  );
}


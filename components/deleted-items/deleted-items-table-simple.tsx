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
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { deletedItemsService, DeletedItemWithDetails } from '@/lib/services/deleted-items-service';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/toast';

interface DeletedItemsTableProps {
  filters?: {
    table_name?: string;
    user_id?: string;
    limit?: number;
    offset?: number;
  };
}

export function DeletedItemsTableSimple({ filters = {} }: DeletedItemsTableProps) {
  const { addToast } = useToast();
  const [items, setItems] = useState<DeletedItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DeletedItemWithDetails | null>(null);
  const [recoveryReason, setRecoveryReason] = useState('');
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
      addToast({ type: 'error', title: 'Error al cargar elementos eliminados' });
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
      addToast({ type: 'success', title: 'Elemento recuperado exitosamente' });
      setRecoveryDialogOpen(false);
      setSelectedItem(null);
      setRecoveryReason('');
      loadItems();
    } catch (error) {
      console.error('Failed to recover item:', error);
      addToast({ type: 'error', title: 'Error al recuperar elemento' });
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

  // Get a friendly name for the deleted item
  const getItemName = (item: DeletedItemWithDetails) => {
    const data = item.original_data;
    if (data.name) return data.name;
    if (data.title) return data.title;
    if (data.email) return data.email;
    if (data.username) return data.username;
    if (data.description) return data.description;
    return `ID: ${item.original_record_id}`;
  };

  // Get a friendly table name
  const getTableName = (tableName: string) => {
    const tableNames: { [key: string]: string } = {
      'users': 'Usuario',
      'categories': 'Categoría',
      'inventory': 'Inventario',
      'locations': 'Ubicación',
      'roles': 'Rol',
      'transactions': 'Transacción',
      'projects': 'Proyecto',
      'project_items': 'Item de Proyecto',
      'project_status_history': 'Historial de Estado',
      'project_attachments': 'Adjunto de Proyecto',
      'workflow_items': 'Item de Flujo',
      'cl_tasks': 'Tarea CL',
      'cl_task_notes': 'Nota de Tarea CL',
      'cl_task_attachments': 'Adjunto de Tarea CL',
      'cl_task_history': 'Historial de Tarea CL',
      'imp_tasks': 'Tarea IMP',
      'imp_task_notes': 'Nota de Tarea IMP',
      'imp_task_attachments': 'Adjunto de Tarea IMP',
      'imp_task_history': 'Historial de Tarea IMP',
      'cl_task_work_data': 'Datos de Trabajo CL'
    };
    return tableNames[tableName] || tableName;
  };

  const getStatusBadge = (item: DeletedItemWithDetails) => {
    if (item.is_expired) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    
    if (item.days_until_expiry <= 7) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        Expira Pronto
      </Badge>;
    }
    
    return <Badge variant="default" className="bg-green-100 text-green-800">
      Recuperable
    </Badge>;
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
                  {selectedItems.length} elementos seleccionados
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    // Handle bulk recovery
                    addToast({ type: 'info', title: 'Función de recuperación masiva en desarrollo' });
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Recuperar Seleccionados
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItems([])}
              >
                Limpiar Selección
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Elementos Eliminados</CardTitle>
          <CardDescription>
            {total} elementos totales • {items.filter(item => !item.is_expired).length} recuperables
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
                        <span className="font-medium">{getItemName(item)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTableName(item.original_table_name)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{item.deleted_by_name || 'Usuario desconocido'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item)}
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
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedItem(item);
                              setRecoveryDialogOpen(true);
                            }}
                            disabled={item.is_expired}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Recuperar
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
                Mostrando {currentPage * pageSize + 1} a {Math.min((currentPage + 1) * pageSize, total)} de {total} elementos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                >
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {currentPage + 1} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  Siguiente
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
            <DialogTitle>Recuperar Elemento Eliminado</DialogTitle>
            <DialogDescription>
              Revisa los detalles del elemento eliminado y proporciona una razón para la recuperación
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Elemento</Label>
                  <div className="mt-1 font-medium">{getItemName(selectedItem)}</div>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{getTableName(selectedItem.original_table_name)}</Badge>
                  </div>
                </div>
                <div>
                  <Label>Eliminado por</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedItem.deleted_by_name || 'Usuario desconocido'}</span>
                  </div>
                </div>
                <div>
                  <Label>Fecha de eliminación</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(selectedItem.deleted_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Datos originales</Label>
                <div className="mt-1 p-3 bg-muted rounded-md max-h-40 overflow-auto">
                  <pre className="text-xs">
                    {JSON.stringify(selectedItem.original_data, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <Label htmlFor="recovery-reason">Razón de recuperación (Opcional)</Label>
                <Textarea
                  id="recovery-reason"
                  value={recoveryReason}
                  onChange={(e) => setRecoveryReason(e.target.value)}
                  placeholder="Ingresa la razón para la recuperación..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecoveryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedItem && handleRecoverItem(selectedItem, recoveryReason)}
              disabled={selectedItem?.is_expired}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Recuperar Elemento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Package,
  FileText,
  CreditCard,
  Truck,
  Receipt,
  Mail,
  Building,
  MapPin
} from 'lucide-react'
import { ProjectItem, WORKFLOW_CONFIGS, ProjectStatus, ProductType } from '@/lib/types'

interface WorkflowTrackerProps {
  item: ProjectItem
  onStatusUpdate: (itemId: string, newStatus: string, notes?: string, cost?: number) => Promise<void>
  readonly?: boolean
}

export function WorkflowTracker({ item, onStatusUpdate, readonly = false }: WorkflowTrackerProps) {
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [costIncurred, setCostIncurred] = useState<number | undefined>()
  const [updating, setUpdating] = useState(false)

  const workflowConfig = WORKFLOW_CONFIGS[item.productType]
  
  const getStatusIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      Package,
      FileText,
      CreditCard,
      Truck,
      CheckCircle,
      Receipt,
      Mail,
      Building,
      MapPin
    }
    return icons[iconName] || Clock
  }

  const getStatusIndex = (status: string) => {
    return workflowConfig.statuses.findIndex(s => s.key === status)
  }

  const currentStatusIndex = getStatusIndex(item.currentStatus)

  const handleStatusClick = (status: string) => {
    if (readonly) return
    
    const statusConfig = workflowConfig.statuses.find(s => s.key === status)
    const currentConfig = workflowConfig.statuses.find(s => s.key === item.currentStatus)
    
    // Check if this status can be reached from current status
    if (currentConfig && !currentConfig.allowedNextStatuses.includes(status as ProjectStatus)) {
      return
    }
    
    setSelectedStatus(status)
    setShowUpdateModal(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedStatus) return
    
    setUpdating(true)
    try {
      await onStatusUpdate(item.id, selectedStatus, notes, costIncurred)
      setShowUpdateModal(false)
      setNotes('')
      setCostIncurred(undefined)
    } finally {
      setUpdating(false)
    }
  }

  const isStatusClickable = (status: string) => {
    if (readonly) return false
    
    const statusIndex = getStatusIndex(status)
    const currentConfig = workflowConfig.statuses.find(s => s.key === item.currentStatus)
    
    // Can only click on next allowed statuses
    return currentConfig?.allowedNextStatuses.includes(status as ProjectStatus) || false
  }

  const getStatusStyle = (status: string) => {
    const statusIndex = getStatusIndex(status)
    const statusConfig = workflowConfig.statuses.find(s => s.key === status)
    
    if (status === item.currentStatus) {
      return {
        backgroundColor: statusConfig?.color || '#3b82f6',
        color: 'white',
        border: `2px solid ${statusConfig?.color || '#3b82f6'}`
      }
    } else if (statusIndex < currentStatusIndex) {
      return {
        backgroundColor: '#22c55e',
        color: 'white',
        border: '2px solid #22c55e'
      }
    } else if (isStatusClickable(status)) {
      return {
        backgroundColor: 'white',
        color: statusConfig?.color || '#3b82f6',
        border: `2px solid ${statusConfig?.color || '#3b82f6'}`,
        cursor: 'pointer'
      }
    } else {
      return {
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
        border: '2px solid #e5e7eb'
      }
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Flujo de Trabajo - {item.productName}</h3>
          <Badge variant="outline" className="text-xs">
            Tipo: {item.productType}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {workflowConfig.statuses.find(s => s.key === item.currentStatus)?.description}
        </p>
      </div>

      {/* Workflow Steps */}
      <div className="space-y-4">
        {workflowConfig.statuses.map((status, index) => {
          const StatusIcon = getStatusIcon(status.icon)
          const style = getStatusStyle(status.key)
          const isCompleted = getStatusIndex(status.key) < currentStatusIndex
          const isCurrent = status.key === item.currentStatus
          const isClickable = isStatusClickable(status.key)

          return (
            <div key={status.key} className="flex items-center">
              {/* Status Circle */}
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 hover:scale-105"
                style={style}
                onClick={() => handleStatusClick(status.key)}
                role={isClickable ? 'button' : 'presentation'}
                tabIndex={isClickable ? 0 : -1}
              >
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <StatusIcon className="w-6 h-6" />
                )}
              </div>

              {/* Status Info */}
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{status.label}</h4>
                  {isCurrent && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      Actual
                    </Badge>
                  )}
                  {isCompleted && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      Completado
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{status.description}</p>
                
                {/* Show relevant dates/costs for current/completed statuses */}
                {(isCurrent || isCompleted) && (
                  <div className="mt-2 text-xs text-gray-500">
                    {status.key === 'pagar_cotizacion' && item.quotationAmount && (
                      <span>Monto: ${item.quotationAmount.toLocaleString()}</span>
                    )}
                    {status.key === 'coordinar_envio_pagar_flete' && item.shippingCost && (
                      <span>Flete: ${item.shippingCost.toLocaleString()}</span>
                    )}
                    {status.key === 'pagar_pi_proveedor' && item.supplierPIAmount && (
                      <span>PI: ${item.supplierPIAmount.toLocaleString()}</span>
                    )}
                    {status.key === 'pagar_arancel_aduanas' && item.customsDutyAmount && (
                      <span>Arancel: ${item.customsDutyAmount.toLocaleString()}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Arrow to next step */}
              {index < workflowConfig.statuses.length - 1 && (
                <div className="ml-4">
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Status History */}
      {item.statusHistory && item.statusHistory.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium mb-3">Historial de Cambios</h4>
          <div className="space-y-2">
            {item.statusHistory
              .sort((a, b) => new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime())
              .slice(0, 5)
              .map((history) => (
                <div key={history.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">
                      {workflowConfig.statuses.find(s => s.key === history.toStatus)?.label}
                    </span>
                    <span className="text-gray-500 ml-2">
                      por {history.changedByName}
                    </span>
                  </div>
                  <span className="text-gray-400">
                    {new Date(history.changeDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Estado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">
                Cambiar estado a: <strong>
                  {workflowConfig.statuses.find(s => s.key === selectedStatus)?.label}
                </strong>
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agregar comentarios sobre este cambio de estado..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="cost">Costo Incurrido (opcional)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={costIncurred || ''}
                onChange={(e) => setCostIncurred(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowUpdateModal(false)}
                disabled={updating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updating ? 'Actualizando...' : 'Actualizar Estado'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 
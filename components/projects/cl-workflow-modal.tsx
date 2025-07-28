'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  DollarSign, 
  Truck, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  AlertCircle
} from 'lucide-react'

interface CLWorkflowModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: CLWorkflowData) => void
  projectId: string
}

interface CLWorkflowData {
  productName: string
  productDescription: string
  quantity: number
  quotationAmount?: number
  quotationNotes?: string
  paymentNotes?: string
  shippingCost?: number
  shippingNotes?: string
  completionNotes?: string
}

const CL_STEPS = [
  {
    id: 'solicitar_cotizacion',
    title: 'Solicitar Cotización',
    description: 'Solicitar cotización del producto',
    icon: FileText,
    color: 'blue'
  },
  {
    id: 'pagar_cotizacion',
    title: 'Pagar Cotización',
    description: 'Realizar el pago de la cotización',
    icon: DollarSign,
    color: 'green'
  },
  {
    id: 'coordinar_envio',
    title: 'Coordinar Envío y Pagar Flete',
    description: 'Coordinar el envío y pagar el flete',
    icon: Truck,
    color: 'orange'
  },
  {
    id: 'recibido',
    title: 'Recibido',
    description: 'Producto recibido correctamente',
    icon: CheckCircle,
    color: 'green'
  }
]

export function CLWorkflowModal({ isOpen, onClose, onComplete, projectId }: CLWorkflowModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [workflowData, setWorkflowData] = useState<CLWorkflowData>({
    productName: '',
    productDescription: '',
    quantity: 1
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, CL_STEPS.length - 1))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleComplete = () => {
    if (validateCurrentStep()) {
      onComplete(workflowData)
      onClose()
    }
  }

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {}
    
    switch (currentStep) {
      case 0: // Solicitar cotización
        if (!workflowData.productName.trim()) {
          newErrors.productName = 'El nombre del producto es requerido'
        }
        if (workflowData.quantity < 1) {
          newErrors.quantity = 'La cantidad debe ser mayor a 0'
        }
        break
      case 1: // Pagar cotización
        if (!workflowData.quotationAmount || workflowData.quotationAmount <= 0) {
          newErrors.quotationAmount = 'El monto de la cotización es requerido'
        }
        break
      case 2: // Coordinar envío
        if (!workflowData.shippingCost || workflowData.shippingCost <= 0) {
          newErrors.shippingCost = 'El costo del flete es requerido'
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const updateWorkflowData = (field: keyof CLWorkflowData, value: any) => {
    setWorkflowData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const renderStepContent = () => {
    const step = CL_STEPS[currentStep]
    
    switch (currentStep) {
      case 0: // Solicitar cotización
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nombre del Producto *
              </label>
              <Input
                value={workflowData.productName}
                onChange={(e) => updateWorkflowData('productName', e.target.value)}
                placeholder="Ingresa el nombre del producto"
                className={errors.productName ? 'border-red-500' : ''}
              />
              {errors.productName && (
                <p className="text-red-500 text-sm mt-1">{errors.productName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Descripción
              </label>
              <Textarea
                value={workflowData.productDescription}
                onChange={(e) => updateWorkflowData('productDescription', e.target.value)}
                placeholder="Descripción detallada del producto"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Cantidad *
              </label>
              <Input
                type="number"
                min="1"
                value={workflowData.quantity}
                onChange={(e) => updateWorkflowData('quantity', parseInt(e.target.value) || 1)}
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Notas de Cotización
              </label>
              <Textarea
                value={workflowData.quotationNotes}
                onChange={(e) => updateWorkflowData('quotationNotes', e.target.value)}
                placeholder="Notas adicionales para la cotización"
                rows={2}
              />
            </div>
          </div>
        )
        
      case 1: // Pagar cotización
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Resumen del Producto
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                <strong>{workflowData.productName}</strong> (Cantidad: {workflowData.quantity})
              </p>
              {workflowData.productDescription && (
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                  {workflowData.productDescription}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Monto de la Cotización * (USD)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={workflowData.quotationAmount || ''}
                onChange={(e) => updateWorkflowData('quotationAmount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.quotationAmount ? 'border-red-500' : ''}
              />
              {errors.quotationAmount && (
                <p className="text-red-500 text-sm mt-1">{errors.quotationAmount}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Notas del Pago
              </label>
              <Textarea
                value={workflowData.paymentNotes}
                onChange={(e) => updateWorkflowData('paymentNotes', e.target.value)}
                placeholder="Método de pago, referencia, etc."
                rows={2}
              />
            </div>
          </div>
        )
        
      case 2: // Coordinar envío
        return (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Cotización Pagada
              </h4>
              <p className="text-sm text-green-600 dark:text-green-300">
                Monto: ${workflowData.quotationAmount?.toFixed(2)}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Costo del Flete * (USD)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={workflowData.shippingCost || ''}
                onChange={(e) => updateWorkflowData('shippingCost', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.shippingCost ? 'border-red-500' : ''}
              />
              {errors.shippingCost && (
                <p className="text-red-500 text-sm mt-1">{errors.shippingCost}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Notas del Envío
              </label>
              <Textarea
                value={workflowData.shippingNotes}
                onChange={(e) => updateWorkflowData('shippingNotes', e.target.value)}
                placeholder="Empresa de envío, tracking, fecha estimada, etc."
                rows={3}
              />
            </div>
          </div>
        )
        
      case 3: // Recibido
        return (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                ✅ Resumen Completo
              </h4>
              <div className="space-y-2 text-sm text-green-600 dark:text-green-300">
                <p><strong>Producto:</strong> {workflowData.productName}</p>
                <p><strong>Cantidad:</strong> {workflowData.quantity}</p>
                <p><strong>Cotización:</strong> ${workflowData.quotationAmount?.toFixed(2)}</p>
                <p><strong>Flete:</strong> ${workflowData.shippingCost?.toFixed(2)}</p>
                <p><strong>Total:</strong> ${((workflowData.quotationAmount || 0) + (workflowData.shippingCost || 0)).toFixed(2)}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Notas de Recepción
              </label>
              <Textarea
                value={workflowData.completionNotes}
                onChange={(e) => updateWorkflowData('completionNotes', e.target.value)}
                placeholder="Estado del producto recibido, observaciones, etc."
                rows={3}
              />
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  const currentStepData = CL_STEPS[currentStep]
  const IconComponent = currentStepData.icon
  const progress = ((currentStep + 1) / CL_STEPS.length) * 100

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Flujo CL - Cotización
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso</span>
              <span>{currentStep + 1} de {CL_STEPS.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps */}
          <div className="flex justify-between mb-4">
            {CL_STEPS.map((step, index) => {
              const StepIcon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center mb-2
                    ${isActive ? 'bg-blue-600 text-white' : 
                      isCompleted ? 'bg-green-600 text-white' : 
                      'bg-gray-200 dark:bg-gray-700 text-gray-400'}
                  `}>
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs text-center ${isActive ? 'font-medium' : ''}`}>
                    {step.title}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Current Step Content */}
          <Card className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">{currentStepData.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {currentStepData.description}
                  </p>
                </div>
              </div>
              
              {renderStepContent()}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t dark:border-gray-700">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
              )}
            </div>
            
            <div>
              {currentStep < CL_STEPS.length - 1 ? (
                <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completar Pedido
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
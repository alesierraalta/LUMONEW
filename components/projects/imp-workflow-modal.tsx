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
  Receipt, 
  DollarSign, 
  Send, 
  Plane,
  Ship,
  Truck, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  AlertCircle
} from 'lucide-react'

interface IMPWorkflowModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: IMPWorkflowData) => void
  projectId: string
}

interface IMPWorkflowData {
  productName: string
  productDescription: string
  quantity: number
  supplierName: string
  supplierContact: string
  piAmount?: number
  piNotes?: string
  shippingLabelNotes?: string
  shippingType?: 'aereo' | 'maritimo'
  // Aéreo
  airFreightCost?: number
  airFreightNotes?: string
  // Marítimo
  seaFreightCost?: number
  seaFreightNotes?: string
  coordinationNotes?: string
  // Común
  customsDutyAmount?: number
  customsNotes?: string
  completionNotes?: string
}

const getIMPSteps = (shippingType?: 'aereo' | 'maritimo') => {
  const baseSteps = [
    {
      id: 'pagar_pi_proveedor',
      title: 'Pagar PI a Proveedor',
      description: 'Realizar el pago del PI al proveedor',
      icon: DollarSign,
      color: 'green'
    },
    {
      id: 'enviar_etiqueta',
      title: 'Enviar Etiqueta de Envío',
      description: 'Enviar etiqueta de envío al proveedor',
      icon: Send,
      color: 'blue'
    },
    {
      id: 'decision_envio',
      title: 'Decisión: Aéreo vs Marítimo',
      description: 'Seleccionar tipo de envío',
      icon: shippingType === 'aereo' ? Plane : shippingType === 'maritimo' ? Ship : AlertCircle,
      color: 'orange'
    }
  ]

  if (shippingType === 'aereo') {
    baseSteps.push({
      id: 'pagar_flete_aereo',
      title: 'Pagar Flete Aéreo',
      description: 'Realizar el pago del flete aéreo',
      icon: Plane,
      color: 'blue'
    })
  } else if (shippingType === 'maritimo') {
    baseSteps.push(
      {
        id: 'pagar_flete_maritimo',
        title: 'Pagar Flete Mercancía Vzla',
        description: 'Pagar flete de mercancía a Venezuela',
        icon: Ship,
        color: 'blue'
      },
      {
        id: 'coordinar_envio',
        title: 'Coordinar Envío',
        description: 'Coordinar el envío de la mercancía',
        icon: Truck,
        color: 'orange'
      }
    )
  }

  baseSteps.push(
    {
      id: 'pagar_arancel',
      title: 'Pagar Arancel Aduana',
      description: 'Realizar el pago del arancel de aduana',
      icon: Receipt,
      color: 'purple'
    },
    {
      id: 'recibido',
      title: 'Recibido',
      description: 'Producto recibido correctamente',
      icon: CheckCircle,
      color: 'green'
    }
  )

  return baseSteps
}

export function IMPWorkflowModal({ isOpen, onClose, onComplete, projectId }: IMPWorkflowModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [workflowData, setWorkflowData] = useState<IMPWorkflowData>({
    productName: '',
    productDescription: '',
    quantity: 1,
    supplierName: '',
    supplierContact: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const steps = getIMPSteps(workflowData.shippingType)

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
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
    const currentStepId = steps[currentStep].id
    
    switch (currentStepId) {
      case 'pagar_pi_proveedor':
        if (!workflowData.productName.trim()) {
          newErrors.productName = 'El nombre del producto es requerido'
        }
        if (!workflowData.supplierName.trim()) {
          newErrors.supplierName = 'El nombre del proveedor es requerido'
        }
        if (workflowData.quantity < 1) {
          newErrors.quantity = 'La cantidad debe ser mayor a 0'
        }
        if (!workflowData.piAmount || workflowData.piAmount <= 0) {
          newErrors.piAmount = 'El monto del PI es requerido'
        }
        break
      case 'decision_envio':
        if (!workflowData.shippingType) {
          newErrors.shippingType = 'Debe seleccionar el tipo de envío'
        }
        break
      case 'pagar_flete_aereo':
        if (!workflowData.airFreightCost || workflowData.airFreightCost <= 0) {
          newErrors.airFreightCost = 'El costo del flete aéreo es requerido'
        }
        break
      case 'pagar_flete_maritimo':
        if (!workflowData.seaFreightCost || workflowData.seaFreightCost <= 0) {
          newErrors.seaFreightCost = 'El costo del flete marítimo es requerido'
        }
        break
      case 'pagar_arancel':
        if (!workflowData.customsDutyAmount || workflowData.customsDutyAmount <= 0) {
          newErrors.customsDutyAmount = 'El monto del arancel es requerido'
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const updateWorkflowData = (field: keyof IMPWorkflowData, value: any) => {
    setWorkflowData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleShippingTypeChange = (type: 'aereo' | 'maritimo') => {
    updateWorkflowData('shippingType', type)
    // Reset step to recalculate steps array
    setCurrentStep(Math.min(currentStep, 2))
  }

  const renderStepContent = () => {
    const currentStepId = steps[currentStep].id
    
    switch (currentStepId) {
      case 'pagar_pi_proveedor':
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
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
                  Monto PI * (USD)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={workflowData.piAmount || ''}
                  onChange={(e) => updateWorkflowData('piAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={errors.piAmount ? 'border-red-500' : ''}
                />
                {errors.piAmount && (
                  <p className="text-red-500 text-sm mt-1">{errors.piAmount}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Proveedor *
              </label>
              <Input
                value={workflowData.supplierName}
                onChange={(e) => updateWorkflowData('supplierName', e.target.value)}
                placeholder="Nombre del proveedor"
                className={errors.supplierName ? 'border-red-500' : ''}
              />
              {errors.supplierName && (
                <p className="text-red-500 text-sm mt-1">{errors.supplierName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Contacto del Proveedor
              </label>
              <Input
                value={workflowData.supplierContact}
                onChange={(e) => updateWorkflowData('supplierContact', e.target.value)}
                placeholder="Email, teléfono, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Notas del PI
              </label>
              <Textarea
                value={workflowData.piNotes}
                onChange={(e) => updateWorkflowData('piNotes', e.target.value)}
                placeholder="Método de pago, referencia, etc."
                rows={2}
              />
            </div>
          </div>
        )
        
      case 'enviar_etiqueta':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                PI Pagado
              </h4>
              <p className="text-sm text-green-600 dark:text-green-300">
                Proveedor: {workflowData.supplierName} | Monto: ${workflowData.piAmount?.toFixed(2)}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Notas de la Etiqueta de Envío
              </label>
              <Textarea
                value={workflowData.shippingLabelNotes}
                onChange={(e) => updateWorkflowData('shippingLabelNotes', e.target.value)}
                placeholder="Detalles sobre la etiqueta enviada, tracking, etc."
                rows={3}
              />
            </div>
          </div>
        )
        
      case 'decision_envio':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Etiqueta Enviada
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Selecciona el tipo de envío para continuar con el proceso
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-3">
                Tipo de Envío *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Card 
                  className={`p-4 cursor-pointer transition-colors ${
                    workflowData.shippingType === 'aereo' 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => handleShippingTypeChange('aereo')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Plane className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Aéreo</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Envío rápido por aire
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card 
                  className={`p-4 cursor-pointer transition-colors ${
                    workflowData.shippingType === 'maritimo' 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => handleShippingTypeChange('maritimo')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Ship className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Marítimo</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Envío económico por mar
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
              {errors.shippingType && (
                <p className="text-red-500 text-sm mt-2">{errors.shippingType}</p>
              )}
            </div>
          </div>
        )
        
      case 'pagar_flete_aereo':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                <Plane className="w-4 h-4" />
                Envío Aéreo Seleccionado
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Procesando envío rápido por aire
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Costo del Flete Aéreo * (USD)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={workflowData.airFreightCost || ''}
                onChange={(e) => updateWorkflowData('airFreightCost', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.airFreightCost ? 'border-red-500' : ''}
              />
              {errors.airFreightCost && (
                <p className="text-red-500 text-sm mt-1">{errors.airFreightCost}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Notas del Flete Aéreo
              </label>
              <Textarea
                value={workflowData.airFreightNotes}
                onChange={(e) => updateWorkflowData('airFreightNotes', e.target.value)}
                placeholder="Aerolínea, tracking, fecha estimada, etc."
                rows={2}
              />
            </div>
          </div>
        )
        
      case 'pagar_flete_maritimo':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                <Ship className="w-4 h-4" />
                Envío Marítimo Seleccionado
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Procesando envío económico por mar
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Costo del Flete Marítimo * (USD)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={workflowData.seaFreightCost || ''}
                onChange={(e) => updateWorkflowData('seaFreightCost', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.seaFreightCost ? 'border-red-500' : ''}
              />
              {errors.seaFreightCost && (
                <p className="text-red-500 text-sm mt-1">{errors.seaFreightCost}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Notas del Flete Marítimo
              </label>
              <Textarea
                value={workflowData.seaFreightNotes}
                onChange={(e) => updateWorkflowData('seaFreightNotes', e.target.value)}
                placeholder="Naviera, contenedor, puerto, etc."
                rows={2}
              />
            </div>
          </div>
        )
        
      case 'coordinar_envio':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Flete Marítimo Pagado
              </h4>
              <p className="text-sm text-green-600 dark:text-green-300">
                Monto: ${workflowData.seaFreightCost?.toFixed(2)}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Notas de Coordinación de Envío
              </label>
              <Textarea
                value={workflowData.coordinationNotes}
                onChange={(e) => updateWorkflowData('coordinationNotes', e.target.value)}
                placeholder="Detalles de coordinación, fechas, contactos, etc."
                rows={3}
              />
            </div>
          </div>
        )
        
      case 'pagar_arancel':
        return (
          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                Flete Procesado
              </h4>
              <p className="text-sm text-orange-600 dark:text-orange-300">
                {workflowData.shippingType === 'aereo' 
                  ? `Flete Aéreo: $${workflowData.airFreightCost?.toFixed(2)}`
                  : `Flete Marítimo: $${workflowData.seaFreightCost?.toFixed(2)}`
                }
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Monto del Arancel de Aduana * (USD)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={workflowData.customsDutyAmount || ''}
                onChange={(e) => updateWorkflowData('customsDutyAmount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.customsDutyAmount ? 'border-red-500' : ''}
              />
              {errors.customsDutyAmount && (
                <p className="text-red-500 text-sm mt-1">{errors.customsDutyAmount}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Notas del Arancel
              </label>
              <Textarea
                value={workflowData.customsNotes}
                onChange={(e) => updateWorkflowData('customsNotes', e.target.value)}
                placeholder="Detalles del proceso aduanero, documentos, etc."
                rows={2}
              />
            </div>
          </div>
        )
        
      case 'recibido':
        const totalCost = (workflowData.piAmount || 0) + 
                         (workflowData.shippingType === 'aereo' ? (workflowData.airFreightCost || 0) : (workflowData.seaFreightCost || 0)) + 
                         (workflowData.customsDutyAmount || 0)
        
        return (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                ✅ Resumen Completo - Importación
              </h4>
              <div className="space-y-2 text-sm text-green-600 dark:text-green-300">
                <p><strong>Producto:</strong> {workflowData.productName}</p>
                <p><strong>Cantidad:</strong> {workflowData.quantity}</p>
                <p><strong>Proveedor:</strong> {workflowData.supplierName}</p>
                <p><strong>PI:</strong> ${workflowData.piAmount?.toFixed(2)}</p>
                <p><strong>Tipo de Envío:</strong> {workflowData.shippingType === 'aereo' ? 'Aéreo' : 'Marítimo'}</p>
                <p><strong>Flete:</strong> ${workflowData.shippingType === 'aereo' 
                  ? workflowData.airFreightCost?.toFixed(2) 
                  : workflowData.seaFreightCost?.toFixed(2)}</p>
                <p><strong>Arancel:</strong> ${workflowData.customsDutyAmount?.toFixed(2)}</p>
                <p><strong>Total:</strong> ${totalCost.toFixed(2)}</p>
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

  const currentStepData = steps[currentStep]
  const IconComponent = currentStepData.icon
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-600" />
            Flujo IMP - Importación
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso</span>
              <span>{currentStep + 1} de {steps.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps */}
          <div className="flex justify-between mb-4 overflow-x-auto">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1 min-w-0">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center mb-2
                    ${isActive ? 'bg-purple-600 text-white' : 
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
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <IconComponent className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} className="bg-purple-600 hover:bg-purple-700">
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
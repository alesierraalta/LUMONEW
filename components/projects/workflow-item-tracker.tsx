'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  DollarSign, 
  Truck, 
  CheckCircle, 
  Send, 
  Plane, 
  Ship, 
  Receipt,
  Package,
  ArrowRight,
  Clock,
  AlertCircle
} from 'lucide-react'

// Import step modals
import { 
  CLStep1Modal, 
  CLStep2Modal, 
  CLStep3Modal, 
  CLStep4Modal 
} from './cl-step-modals'
import { 
  IMPStep1Modal, 
  IMPStep2Modal, 
  IMPStep3Modal, 
  IMPStep4AModal, 
  IMPStep4BModal, 
  IMPStep5Modal, 
  IMPStep6Modal, 
  IMPStep7Modal 
} from './imp-step-modals'

// Types for workflow states
interface WorkflowItem {
  id: string
  projectId: string
  productType: 'CL' | 'IMP' | 'LU'
  productName: string
  currentStep: string
  stepData: Record<string, any>
  createdAt: string
  updatedAt: string
}

// CL Steps Configuration
const CL_STEPS = [
  {
    id: 'cl_step1',
    title: 'Solicitar Cotización',
    description: 'Solicitar cotización del producto',
    icon: FileText,
    color: 'blue'
  },
  {
    id: 'cl_step2',
    title: 'Pagar Cotización',
    description: 'Realizar el pago de la cotización',
    icon: DollarSign,
    color: 'green'
  },
  {
    id: 'cl_step3',
    title: 'Coordinar Envío',
    description: 'Coordinar el envío y pagar el flete',
    icon: Truck,
    color: 'orange'
  },
  {
    id: 'cl_step4',
    title: 'Recibido',
    description: 'Producto recibido correctamente',
    icon: CheckCircle,
    color: 'green'
  }
]

// IMP Steps Configuration (dynamic based on shipping type)
const getIMPSteps = (shippingType?: 'aereo' | 'maritimo') => {
  const baseSteps = [
    {
      id: 'imp_step1',
      title: 'Pagar PI a Proveedor',
      description: 'Realizar el pago del PI al proveedor',
      icon: DollarSign,
      color: 'green'
    },
    {
      id: 'imp_step2',
      title: 'Enviar Etiqueta',
      description: 'Enviar etiqueta de envío al proveedor',
      icon: Send,
      color: 'blue'
    },
    {
      id: 'imp_step3',
      title: 'Decisión Envío',
      description: 'Seleccionar tipo de envío',
      icon: shippingType === 'aereo' ? Plane : shippingType === 'maritimo' ? Ship : AlertCircle,
      color: 'orange'
    }
  ]

  if (shippingType === 'aereo') {
    baseSteps.push({
      id: 'imp_step4a',
      title: 'Pagar Flete Aéreo',
      description: 'Realizar el pago del flete aéreo',
      icon: Plane,
      color: 'blue'
    })
  } else if (shippingType === 'maritimo') {
    baseSteps.push(
      {
        id: 'imp_step4b',
        title: 'Pagar Flete Marítimo',
        description: 'Pagar flete de mercancía a Venezuela',
        icon: Ship,
        color: 'blue'
      },
      {
        id: 'imp_step5',
        title: 'Coordinar Envío',
        description: 'Coordinar el envío de la mercancía',
        icon: Truck,
        color: 'orange'
      }
    )
  }

  baseSteps.push(
    {
      id: 'imp_step6',
      title: 'Pagar Arancel',
      description: 'Realizar el pago del arancel de aduana',
      icon: Receipt,
      color: 'purple'
    },
    {
      id: 'imp_step7',
      title: 'Recibido',
      description: 'Producto recibido correctamente',
      icon: CheckCircle,
      color: 'green'
    }
  )

  return baseSteps
}

interface WorkflowItemTrackerProps {
  item: WorkflowItem
  onStepComplete: (itemId: string, stepId: string, stepData: any) => void
  onItemUpdate: (itemId: string) => void
}

export function WorkflowItemTracker({ item, onStepComplete, onItemUpdate }: WorkflowItemTrackerProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null)

  // Get steps configuration based on item type
  const getSteps = () => {
    if (item.productType === 'CL') {
      return CL_STEPS
    } else if (item.productType === 'IMP') {
      return getIMPSteps(item.stepData.shippingType)
    }
    return []
  }

  const steps = getSteps()
  const currentStepIndex = steps.findIndex(step => step.id === item.currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  // Get next step
  const getNextStep = () => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length - 1) {
      return steps[currentStepIndex + 1]
    }
    return null
  }

  const nextStep = getNextStep()
  const isCompleted = item.currentStep === steps[steps.length - 1]?.id

  // Handle step completion
  const handleStepComplete = (stepId: string, stepData: any) => {
    onStepComplete(item.id, stepId, stepData)
    setActiveModal(null)
  }

  // Get current step info
  const getCurrentStepInfo = () => {
    return steps.find(step => step.id === item.currentStep) || steps[0]
  }

  const currentStepInfo = getCurrentStepInfo()
  const CurrentIcon = currentStepInfo.icon

  // Render step modals
  const renderStepModals = () => {
    if (item.productType === 'CL') {
      return (
        <>
          <CLStep1Modal
            isOpen={activeModal === 'cl_step1'}
            onClose={() => setActiveModal(null)}
            onComplete={(data) => handleStepComplete('cl_step2', data)}
            projectId={item.projectId}
          />
          <CLStep2Modal
            isOpen={activeModal === 'cl_step2'}
            onClose={() => setActiveModal(null)}
            onComplete={(data) => handleStepComplete('cl_step3', data)}
            projectId={item.projectId}
            itemData={{
              productName: item.stepData.productName || item.productName,
              quantity: item.stepData.quantity || 1,
              productDescription: item.stepData.productDescription
            }}
          />
          <CLStep3Modal
            isOpen={activeModal === 'cl_step3'}
            onClose={() => setActiveModal(null)}
            onComplete={(data) => handleStepComplete('cl_step4', data)}
            projectId={item.projectId}
            itemData={{
              productName: item.stepData.productName || item.productName,
              quantity: item.stepData.quantity || 1,
              quotationAmount: item.stepData.quotationAmount || 0
            }}
          />
          <CLStep4Modal
            isOpen={activeModal === 'cl_step4'}
            onClose={() => setActiveModal(null)}
            onComplete={(data) => handleStepComplete('completed', data)}
            projectId={item.projectId}
            itemData={{
              productName: item.stepData.productName || item.productName,
              quantity: item.stepData.quantity || 1,
              quotationAmount: item.stepData.quotationAmount || 0,
              shippingCost: item.stepData.shippingCost || 0
            }}
          />
        </>
      )
    } else if (item.productType === 'IMP') {
      return (
        <>
          <IMPStep1Modal
            isOpen={activeModal === 'imp_step1'}
            onClose={() => setActiveModal(null)}
            onComplete={(data) => handleStepComplete('imp_step2', data)}
            projectId={item.projectId}
          />
          <IMPStep2Modal
            isOpen={activeModal === 'imp_step2'}
            onClose={() => setActiveModal(null)}
            onComplete={(data) => handleStepComplete('imp_step3', data)}
            projectId={item.projectId}
            itemData={{
              productName: item.stepData.productName || item.productName,
              supplierName: item.stepData.supplierName || '',
              piAmount: item.stepData.piAmount || 0
            }}
          />
          <IMPStep3Modal
            isOpen={activeModal === 'imp_step3'}
            onClose={() => setActiveModal(null)}
            onComplete={(data) => {
              const nextStepId = data.shippingType === 'aereo' ? 'imp_step4a' : 'imp_step4b'
              handleStepComplete(nextStepId, data)
            }}
            projectId={item.projectId}
          />
          <IMPStep4AModal
            isOpen={activeModal === 'imp_step4a'}
            onClose={() => setActiveModal(null)}
            onComplete={(data) => handleStepComplete('imp_step6', data)}
            projectId={item.projectId}
          />
          <IMPStep4BModal
            isOpen={activeModal === 'imp_step4b'}
            onClose={() => setActiveModal(null)}
            onComplete={(data) => handleStepComplete('imp_step5', data)}
            projectId={item.projectId}
          />
          <IMPStep5Modal
            isOpen={activeModal === 'imp_step5'}
            onClose={() => setActiveModal(null)}
            onComplete={(data) => handleStepComplete('imp_step6', data)}
            projectId={item.projectId}
            itemData={{
              seaFreightCost: item.stepData.seaFreightCost || 0
            }}
          />
          <IMPStep6Modal
            isOpen={activeModal === 'imp_step6'}
            onClose={() => setActiveModal(null)}
            onComplete={(data) => handleStepComplete('imp_step7', data)}
            projectId={item.projectId}
            itemData={{
              shippingType: item.stepData.shippingType || 'aereo',
              airFreightCost: item.stepData.airFreightCost,
              seaFreightCost: item.stepData.seaFreightCost
            }}
          />
          <IMPStep7Modal
            isOpen={activeModal === 'imp_step7'}
            onClose={() => setActiveModal(null)}
            onComplete={(data) => handleStepComplete('completed', data)}
            projectId={item.projectId}
            itemData={{
              productName: item.stepData.productName || item.productName,
              quantity: item.stepData.quantity || 1,
              supplierName: item.stepData.supplierName || '',
              piAmount: item.stepData.piAmount || 0,
              shippingType: item.stepData.shippingType || 'aereo',
              airFreightCost: item.stepData.airFreightCost,
              seaFreightCost: item.stepData.seaFreightCost,
              customsDutyAmount: item.stepData.customsDutyAmount || 0
            }}
          />
        </>
      )
    }
    return null
  }

  // Get status color
  const getStatusColor = () => {
    if (isCompleted) return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    if (currentStepIndex >= 0) return 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    return 'bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
  }

  return (
    <>
      <Card className={`p-4 ${getStatusColor()}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <CurrentIcon className={`w-5 h-5 ${
                  isCompleted ? 'text-green-600' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{item.productName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={item.productType === 'CL' ? 'default' : 'secondary'}>
                    {item.productType}
                  </Badge>
                  <Badge variant={isCompleted ? 'default' : 'outline'}>
                    {isCompleted ? 'Completado' : currentStepInfo.title}
                  </Badge>
                </div>
              </div>
            </div>
            
            {isCompleted && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Recibido</span>
              </div>
            )}
          </div>

          {/* Progress */}
          {!isCompleted && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso</span>
                <span>{currentStepIndex + 1} de {steps.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Current Step Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {isCompleted ? 'Proceso Completado' : `Paso Actual: ${currentStepInfo.title}`}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  {isCompleted ? 'Todos los pasos han sido completados' : currentStepInfo.description}
                </p>
              </div>
              
              {!isCompleted && nextStep && (
                <Button
                  onClick={() => setActiveModal(nextStep.id)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continuar
                </Button>
              )}
            </div>
          </div>

          {/* Steps Timeline (for completed or in-progress items) */}
          {currentStepIndex > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm font-medium mb-3">Historial de Pasos</p>
              <div className="space-y-2">
                {steps.slice(0, currentStepIndex + 1).map((step, index) => {
                  const StepIcon = step.icon
                  const isCurrentStep = index === currentStepIndex
                  
                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center
                        ${isCurrentStep 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-green-600 text-white'
                        }
                      `}>
                        <StepIcon className="w-3 h-3" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="text-xs text-gray-500">{step.description}</p>
                      </div>
                      {isCurrentStep && (
                        <Clock className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Render step modals */}
      {renderStepModals()}
    </>
  )
}

// Main component to display all workflow items
interface WorkflowItemsListProps {
  items: WorkflowItem[]
  onStepComplete: (itemId: string, stepId: string, stepData: any) => void
  onItemUpdate: (itemId: string) => void
}

export function WorkflowItemsList({ items, onStepComplete, onItemUpdate }: WorkflowItemsListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          No hay items de flujo en este proyecto
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <WorkflowItemTracker
          key={item.id}
          item={item}
          onStepComplete={onStepComplete}
          onItemUpdate={onItemUpdate}
        />
      ))}
    </div>
  )
} 
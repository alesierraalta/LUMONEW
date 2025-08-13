'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { FileText, DollarSign, Truck, CheckCircle } from 'lucide-react'

// Interfaces for each step
interface CLStep1Data {
  productName: string
  productDescription: string
  quantity: number
  quotationNotes?: string
}

interface CLStep2Data {
  quotationAmount: number
  paymentNotes?: string
}

interface CLStep3Data {
  shippingCost: number
  shippingNotes?: string
}

interface CLStep4Data {
  completionNotes?: string
}

// Step 1: Solicitar Cotización
interface CLStep1ModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: CLStep1Data) => void
  projectId: string
}

export function CLStep1Modal({ isOpen, onClose, onComplete, projectId }: CLStep1ModalProps) {
  const [formData, setFormData] = useState<CLStep1Data>({
    productName: '',
    productDescription: '',
    quantity: 1
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.productName.trim()) {
      newErrors.productName = 'El nombre del producto es requerido'
    }
    if (formData.quantity < 1) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onComplete(formData)
      onClose()
    }
  }

  const updateFormData = (field: keyof CLStep1Data, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby="cl-step1-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Paso 1: Solicitar Cotización
          </DialogTitle>
        </DialogHeader>
        <p id="cl-step1-desc" className="sr-only">Formulario para solicitar la cotización del producto.</p>

        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nombre del Producto *
            </label>
            <Input
              value={formData.productName}
              onChange={(e) => updateFormData('productName', e.target.value)}
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
              value={formData.productDescription}
              onChange={(e) => updateFormData('productDescription', e.target.value)}
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
              value={formData.quantity}
              onChange={(e) => updateFormData('quantity', parseInt(e.target.value) || 1)}
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
              value={formData.quotationNotes}
              onChange={(e) => updateFormData('quotationNotes', e.target.value)}
              placeholder="Notas adicionales para la cotización"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              Solicitar Cotización
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Step 2: Pagar Cotización
interface CLStep2ModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: CLStep2Data) => void
  projectId: string
  itemData: {
    productName: string
    quantity: number
    productDescription?: string
  }
}

export function CLStep2Modal({ isOpen, onClose, onComplete, projectId, itemData }: CLStep2ModalProps) {
  const [formData, setFormData] = useState<CLStep2Data>({
    quotationAmount: 0
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.quotationAmount || formData.quotationAmount <= 0) {
      newErrors.quotationAmount = 'El monto de la cotización es requerido'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onComplete(formData)
      onClose()
    }
  }

  const updateFormData = (field: keyof CLStep2Data, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby="cl-step2-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Paso 2: Pagar Cotización
          </DialogTitle>
        </DialogHeader>
        <p id="cl-step2-desc" className="sr-only">Formulario para registrar el pago de la cotización.</p>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Producto Cotizado
            </h4>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              <strong>{itemData.productName}</strong> (Cantidad: {itemData.quantity})
            </p>
            {itemData.productDescription && (
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                {itemData.productDescription}
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
              value={formData.quotationAmount || ''}
              onChange={(e) => updateFormData('quotationAmount', parseFloat(e.target.value) || 0)}
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
              value={formData.paymentNotes}
              onChange={(e) => updateFormData('paymentNotes', e.target.value)}
              placeholder="Método de pago, referencia, etc."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              Confirmar Pago
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Step 3: Coordinar Envío y Pagar Flete
interface CLStep3ModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: CLStep3Data) => void
  projectId: string
  itemData: {
    productName: string
    quantity: number
    quotationAmount: number
  }
}

export function CLStep3Modal({ isOpen, onClose, onComplete, projectId, itemData }: CLStep3ModalProps) {
  const [formData, setFormData] = useState<CLStep3Data>({
    shippingCost: 0
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.shippingCost || formData.shippingCost <= 0) {
      newErrors.shippingCost = 'El costo del flete es requerido'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onComplete(formData)
      onClose()
    }
  }

  const updateFormData = (field: keyof CLStep3Data, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby="cl-step3-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-600" />
            Paso 3: Coordinar Envío y Pagar Flete
          </DialogTitle>
        </DialogHeader>
        <p id="cl-step3-desc" className="sr-only">Formulario para coordinar el envío y registrar el flete.</p>

        <div className="space-y-4 py-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              Cotización Pagada
            </h4>
            <p className="text-sm text-green-600 dark:text-green-300">
              {itemData.productName} - ${itemData.quotationAmount.toFixed(2)}
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
              value={formData.shippingCost || ''}
              onChange={(e) => updateFormData('shippingCost', parseFloat(e.target.value) || 0)}
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
              value={formData.shippingNotes}
              onChange={(e) => updateFormData('shippingNotes', e.target.value)}
              placeholder="Empresa de envío, tracking, fecha estimada, etc."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700">
              Confirmar Envío
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Step 4: Recibido
interface CLStep4ModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: CLStep4Data) => void
  projectId: string
  itemData: {
    productName: string
    quantity: number
    quotationAmount: number
    shippingCost: number
  }
}

export function CLStep4Modal({ isOpen, onClose, onComplete, projectId, itemData }: CLStep4ModalProps) {
  const [formData, setFormData] = useState<CLStep4Data>({})

  const handleSubmit = () => {
    onComplete(formData)
    onClose()
  }

  const updateFormData = (field: keyof CLStep4Data, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const totalCost = itemData.quotationAmount + itemData.shippingCost

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby="cl-step4-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Paso 4: Marcar como Recibido
          </DialogTitle>
        </DialogHeader>
        <p id="cl-step4-desc" className="sr-only">Formulario para completar el proceso de cotización.</p>

        <div className="space-y-4 py-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              ✅ Resumen Final
            </h4>
            <div className="space-y-2 text-sm text-green-600 dark:text-green-300">
              <p><strong>Producto:</strong> {itemData.productName}</p>
              <p><strong>Cantidad:</strong> {itemData.quantity}</p>
              <p><strong>Cotización:</strong> ${itemData.quotationAmount.toFixed(2)}</p>
              <p><strong>Flete:</strong> ${itemData.shippingCost.toFixed(2)}</p>
              <p><strong>Total:</strong> ${totalCost.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Notas de Recepción
            </label>
            <Textarea
              value={formData.completionNotes}
              onChange={(e) => updateFormData('completionNotes', e.target.value)}
              placeholder="Estado del producto recibido, observaciones, etc."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              Confirmar Recepción
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
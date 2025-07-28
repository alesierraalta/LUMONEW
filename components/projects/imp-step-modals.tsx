'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { DollarSign, Send, Plane, Ship, Truck, Receipt, CheckCircle } from 'lucide-react'

// Interfaces for each step
interface IMPStep1Data {
  productName: string
  productDescription: string
  quantity: number
  supplierName: string
  supplierContact: string
  piAmount: number
  piNotes?: string
}

interface IMPStep2Data {
  shippingLabelNotes?: string
}

interface IMPStep3Data {
  shippingType: 'aereo' | 'maritimo'
}

interface IMPStep4AData {
  airFreightCost: number
  airFreightNotes?: string
}

interface IMPStep4BData {
  seaFreightCost: number
  seaFreightNotes?: string
}

interface IMPStep5Data {
  coordinationNotes?: string
}

interface IMPStep6Data {
  customsDutyAmount: number
  customsNotes?: string
}

interface IMPStep7Data {
  completionNotes?: string
}

// Step 1: Pagar PI a Proveedor
interface IMPStep1ModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: IMPStep1Data) => void
  projectId: string
}

export function IMPStep1Modal({ isOpen, onClose, onComplete, projectId }: IMPStep1ModalProps) {
  const [formData, setFormData] = useState<IMPStep1Data>({
    productName: '',
    productDescription: '',
    quantity: 1,
    supplierName: '',
    supplierContact: '',
    piAmount: 0
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.productName.trim()) {
      newErrors.productName = 'El nombre del producto es requerido'
    }
    if (!formData.supplierName.trim()) {
      newErrors.supplierName = 'El nombre del proveedor es requerido'
    }
    if (formData.quantity < 1) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0'
    }
    if (!formData.piAmount || formData.piAmount <= 0) {
      newErrors.piAmount = 'El monto del PI es requerido'
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

  const updateFormData = (field: keyof IMPStep1Data, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Paso 1: Pagar PI a Proveedor
          </DialogTitle>
        </DialogHeader>

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
                Monto PI * (USD)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.piAmount || ''}
                onChange={(e) => updateFormData('piAmount', parseFloat(e.target.value) || 0)}
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
              value={formData.supplierName}
              onChange={(e) => updateFormData('supplierName', e.target.value)}
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
              value={formData.supplierContact}
              onChange={(e) => updateFormData('supplierContact', e.target.value)}
              placeholder="Email, teléfono, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Notas del PI
            </label>
            <Textarea
              value={formData.piNotes}
              onChange={(e) => updateFormData('piNotes', e.target.value)}
              placeholder="Método de pago, referencia, etc."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              Confirmar Pago PI
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Step 2: Enviar Etiqueta de Envío
interface IMPStep2ModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: IMPStep2Data) => void
  projectId: string
  itemData: {
    productName: string
    supplierName: string
    piAmount: number
  }
}

export function IMPStep2Modal({ isOpen, onClose, onComplete, projectId, itemData }: IMPStep2ModalProps) {
  const [formData, setFormData] = useState<IMPStep2Data>({})

  const handleSubmit = () => {
    onComplete(formData)
    onClose()
  }

  const updateFormData = (field: keyof IMPStep2Data, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Paso 2: Enviar Etiqueta de Envío
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              PI Pagado
            </h4>
            <p className="text-sm text-green-600 dark:text-green-300">
              Proveedor: {itemData.supplierName} | Monto: ${itemData.piAmount.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Notas de la Etiqueta de Envío
            </label>
            <Textarea
              value={formData.shippingLabelNotes}
              onChange={(e) => updateFormData('shippingLabelNotes', e.target.value)}
              placeholder="Detalles sobre la etiqueta enviada, tracking, etc."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              Confirmar Envío de Etiqueta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Step 3: Decisión Aéreo vs Marítimo
interface IMPStep3ModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: IMPStep3Data) => void
  projectId: string
}

export function IMPStep3Modal({ isOpen, onClose, onComplete, projectId }: IMPStep3ModalProps) {
  const [formData, setFormData] = useState<IMPStep3Data | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData?.shippingType) {
      newErrors.shippingType = 'Debe seleccionar el tipo de envío'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm() && formData) {
      onComplete(formData)
      onClose()
    }
  }

  const handleShippingTypeChange = (type: 'aereo' | 'maritimo') => {
    setFormData({ shippingType: type })
    if (errors.shippingType) {
      setErrors(prev => ({ ...prev, shippingType: '' }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-orange-600" />
            Paso 3: Decisión de Tipo de Envío
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
                  formData?.shippingType === 'aereo' 
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
                  formData?.shippingType === 'maritimo' 
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

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700">
              Confirmar Tipo de Envío
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Step 4A: Pagar Flete Aéreo
interface IMPStep4AModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: IMPStep4AData) => void
  projectId: string
}

export function IMPStep4AModal({ isOpen, onClose, onComplete, projectId }: IMPStep4AModalProps) {
  const [formData, setFormData] = useState<IMPStep4AData>({
    airFreightCost: 0
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.airFreightCost || formData.airFreightCost <= 0) {
      newErrors.airFreightCost = 'El costo del flete aéreo es requerido'
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

  const updateFormData = (field: keyof IMPStep4AData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-600" />
            Paso 4: Pagar Flete Aéreo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
              value={formData.airFreightCost || ''}
              onChange={(e) => updateFormData('airFreightCost', parseFloat(e.target.value) || 0)}
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
              value={formData.airFreightNotes}
              onChange={(e) => updateFormData('airFreightNotes', e.target.value)}
              placeholder="Aerolínea, tracking, fecha estimada, etc."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              Confirmar Pago Flete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Step 4B: Pagar Flete Marítimo
interface IMPStep4BModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: IMPStep4BData) => void
  projectId: string
}

export function IMPStep4BModal({ isOpen, onClose, onComplete, projectId }: IMPStep4BModalProps) {
  const [formData, setFormData] = useState<IMPStep4BData>({
    seaFreightCost: 0
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.seaFreightCost || formData.seaFreightCost <= 0) {
      newErrors.seaFreightCost = 'El costo del flete marítimo es requerido'
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

  const updateFormData = (field: keyof IMPStep4BData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="w-5 h-5 text-blue-600" />
            Paso 4: Pagar Flete Marítimo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
              value={formData.seaFreightCost || ''}
              onChange={(e) => updateFormData('seaFreightCost', parseFloat(e.target.value) || 0)}
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
              value={formData.seaFreightNotes}
              onChange={(e) => updateFormData('seaFreightNotes', e.target.value)}
              placeholder="Naviera, contenedor, puerto, etc."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              Confirmar Pago Flete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Step 5: Coordinar Envío (solo para marítimo)
interface IMPStep5ModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: IMPStep5Data) => void
  projectId: string
  itemData: {
    seaFreightCost: number
  }
}

export function IMPStep5Modal({ isOpen, onClose, onComplete, projectId, itemData }: IMPStep5ModalProps) {
  const [formData, setFormData] = useState<IMPStep5Data>({})

  const handleSubmit = () => {
    onComplete(formData)
    onClose()
  }

  const updateFormData = (field: keyof IMPStep5Data, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-600" />
            Paso 5: Coordinar Envío
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              Flete Marítimo Pagado
            </h4>
            <p className="text-sm text-green-600 dark:text-green-300">
              Monto: ${itemData.seaFreightCost.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Notas de Coordinación de Envío
            </label>
            <Textarea
              value={formData.coordinationNotes}
              onChange={(e) => updateFormData('coordinationNotes', e.target.value)}
              placeholder="Detalles de coordinación, fechas, contactos, etc."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700">
              Confirmar Coordinación
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Step 6: Pagar Arancel Aduana
interface IMPStep6ModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: IMPStep6Data) => void
  projectId: string
  itemData: {
    shippingType: 'aereo' | 'maritimo'
    airFreightCost?: number
    seaFreightCost?: number
  }
}

export function IMPStep6Modal({ isOpen, onClose, onComplete, projectId, itemData }: IMPStep6ModalProps) {
  const [formData, setFormData] = useState<IMPStep6Data>({
    customsDutyAmount: 0
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.customsDutyAmount || formData.customsDutyAmount <= 0) {
      newErrors.customsDutyAmount = 'El monto del arancel es requerido'
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

  const updateFormData = (field: keyof IMPStep6Data, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-600" />
            Paso 6: Pagar Arancel de Aduana
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
              Flete Procesado
            </h4>
            <p className="text-sm text-orange-600 dark:text-orange-300">
              {itemData.shippingType === 'aereo' 
                ? `Flete Aéreo: $${itemData.airFreightCost?.toFixed(2)}`
                : `Flete Marítimo: $${itemData.seaFreightCost?.toFixed(2)}`
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
              value={formData.customsDutyAmount || ''}
              onChange={(e) => updateFormData('customsDutyAmount', parseFloat(e.target.value) || 0)}
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
              value={formData.customsNotes}
              onChange={(e) => updateFormData('customsNotes', e.target.value)}
              placeholder="Detalles del proceso aduanero, documentos, etc."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">
              Confirmar Pago Arancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Step 7: Recibido
interface IMPStep7ModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: IMPStep7Data) => void
  projectId: string
  itemData: {
    productName: string
    quantity: number
    supplierName: string
    piAmount: number
    shippingType: 'aereo' | 'maritimo'
    airFreightCost?: number
    seaFreightCost?: number
    customsDutyAmount: number
  }
}

export function IMPStep7Modal({ isOpen, onClose, onComplete, projectId, itemData }: IMPStep7ModalProps) {
  const [formData, setFormData] = useState<IMPStep7Data>({})

  const handleSubmit = () => {
    onComplete(formData)
    onClose()
  }

  const updateFormData = (field: keyof IMPStep7Data, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const totalCost = itemData.piAmount + 
                   (itemData.shippingType === 'aereo' ? (itemData.airFreightCost || 0) : (itemData.seaFreightCost || 0)) + 
                   itemData.customsDutyAmount

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Paso 7: Marcar como Recibido
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              ✅ Resumen Final - Importación
            </h4>
            <div className="space-y-2 text-sm text-green-600 dark:text-green-300">
              <p><strong>Producto:</strong> {itemData.productName}</p>
              <p><strong>Cantidad:</strong> {itemData.quantity}</p>
              <p><strong>Proveedor:</strong> {itemData.supplierName}</p>
              <p><strong>PI:</strong> ${itemData.piAmount.toFixed(2)}</p>
              <p><strong>Tipo de Envío:</strong> {itemData.shippingType === 'aereo' ? 'Aéreo' : 'Marítimo'}</p>
              <p><strong>Flete:</strong> ${itemData.shippingType === 'aereo' 
                ? itemData.airFreightCost?.toFixed(2) 
                : itemData.seaFreightCost?.toFixed(2)}</p>
              <p><strong>Arancel:</strong> ${itemData.customsDutyAmount.toFixed(2)}</p>
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
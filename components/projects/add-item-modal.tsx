'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Package, FileText, Receipt, Plus } from 'lucide-react'
import { LUImportModal } from './lu-import-modal'
import { CLStep1Modal } from './cl-step-modals'
import { IMPStep1Modal } from './imp-step-modals'

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onLUImport: (items: { inventoryItemId: string; quantity: number; unitPrice: number }[]) => void
  onCLStart: (data: any) => void
  onIMPStart: (data: any) => void
  projectId: string
}

export function AddItemModal({ 
  isOpen, 
  onClose, 
  onLUImport, 
  onCLStart, 
  onIMPStart, 
  projectId 
}: AddItemModalProps) {
  const [showLUImportModal, setShowLUImportModal] = useState(false)
  const [showCLStep1Modal, setShowCLStep1Modal] = useState(false)
  const [showIMPStep1Modal, setShowIMPStep1Modal] = useState(false)

  const handleLUImport = (items: { inventoryItemId: string; quantity: number; unitPrice: number }[]) => {
    onLUImport(items)
    onClose()
  }

  const handleCLStart = (data: any) => {
    onCLStart(data)
    onClose()
  }

  const handleIMPStart = (data: any) => {
    onIMPStart(data)
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Agregar Item al Proyecto
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Selecciona el tipo de producto que deseas agregar al proyecto:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* LU - Inventario */}
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-300 dark:hover:border-green-600">
                <div 
                  className="text-center space-y-3"
                  onClick={() => setShowLUImportModal(true)}
                >
                  <div className="flex justify-center">
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                      <Package className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-green-700 dark:text-green-400">Productos LU</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Del Inventario VLN</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Selecciona productos existentes del inventario
                  </p>
                </div>
              </Card>

              {/* CL - Cotización */}
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300 dark:hover:border-blue-600">
                <div 
                  className="text-center space-y-3"
                  onClick={() => setShowCLStep1Modal(true)}
                >
                  <div className="flex justify-center">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                      <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-400">Productos CL</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Para Cotización</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Iniciar flujo de cotización paso a paso
                  </p>
                </div>
              </Card>

              {/* IMP - Importación */}
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-300 dark:hover:border-purple-600">
                <div 
                  className="text-center space-y-3"
                  onClick={() => setShowIMPStep1Modal(true)}
                >
                  <div className="flex justify-center">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                      <Receipt className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-purple-700 dark:text-purple-400">Productos IMP</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Importación</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Iniciar flujo de importación paso a paso
                  </p>
                </div>
              </Card>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* LU Import Modal */}
      <LUImportModal
        isOpen={showLUImportModal}
        onClose={() => setShowLUImportModal(false)}
        onImport={handleLUImport}
        projectId={projectId}
      />

      {/* CL Step 1 Modal */}
      <CLStep1Modal
        isOpen={showCLStep1Modal}
        onClose={() => setShowCLStep1Modal(false)}
        onComplete={handleCLStart}
        projectId={projectId}
      />

      {/* IMP Step 1 Modal */}
      <IMPStep1Modal
        isOpen={showIMPStep1Modal}
        onClose={() => setShowIMPStep1Modal(false)}
        onComplete={handleIMPStart}
        projectId={projectId}
      />
    </>
  )
} 
'use client'

import { useState, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Download,
  Settings,
  Eye,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { CSVImportService } from '@/lib/csv-import'
import { ColumnMappingModal } from './column-mapping-modal'
import { ImportPreviewModal } from './import-preview-modal'
import { ImportProgressModal } from './import-progress-modal'
import { ImportResultsModal } from './import-results-modal'
import { ImportSession, ImportResult } from '@/lib/csv-import/types'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'results'

export function CSVImportModal({ isOpen, onClose, onSuccess }: CSVImportModalProps) {
  const t = useTranslations('inventory.csvImport')
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')
  const [importService] = useState(() => new CSVImportService())
  const [session, setSession] = useState<ImportSession | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setError(null)
      
      // Start import session
      const newSession = await importService.startImportSession(file)
      setSession(newSession)
      
      // Parse file
      await importService.parseFile(file)
      setSession(importService.getCurrentSession())
      
      // Auto-map columns
      importService.autoMapColumns()
      setSession(importService.getCurrentSession())
      
      setCurrentStep('mapping')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }, [importService])

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }, [handleFileUpload])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }, [handleFileUpload])

  // Handle mapping completion
  const handleMappingComplete = useCallback(() => {
    try {
      importService.generatePreview()
      setSession(importService.getCurrentSession())
      setCurrentStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar vista previa')
    }
  }, [importService])

  // Handle preview confirmation
  const handlePreviewConfirm = useCallback(async () => {
    try {
      setCurrentStep('importing')
      const importResult = await importService.startImport()
      setResult(importResult)
      setCurrentStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error durante la importación')
      setCurrentStep('results')
    }
  }, [importService])

  // Handle import completion
  const handleImportComplete = useCallback(() => {
    onSuccess()
    onClose()
  }, [onSuccess, onClose])

  // Handle reset
  const handleReset = useCallback(() => {
    importService.resetSession()
    setSession(null)
    setResult(null)
    setError(null)
    setCurrentStep('upload')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [importService])

  // Handle close
  const handleClose = useCallback(() => {
    if (currentStep === 'importing') {
      importService.cancelImport()
    }
    handleReset()
    onClose()
  }, [currentStep, importService, handleReset, onClose])

  if (!isOpen) return null

  const supportedFormats = importService.getSupportedFormats()
  const sessionStats = importService.getSessionStatistics()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Importar Inventario desde CSV</h2>
              <p className="text-sm text-muted-foreground">
                Importa productos de inventario desde un archivo CSV
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            {[
              { key: 'upload', label: 'Cargar', icon: Upload },
              { key: 'mapping', label: 'Mapear', icon: Settings },
              { key: 'preview', label: 'Vista Previa', icon: Eye },
              { key: 'importing', label: 'Importar', icon: Play },
              { key: 'results', label: 'Resultados', icon: CheckCircle }
            ].map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.key
              const isCompleted = ['upload', 'mapping', 'preview', 'importing', 'results'].indexOf(currentStep) > index
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isActive ? 'bg-primary text-primary-foreground' :
                    isCompleted ? 'bg-green-500 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-primary' :
                    isCompleted ? 'text-green-600' :
                    'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                  {index < 4 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-muted'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {currentStep === 'upload' && (
            <div className="space-y-6">
              {/* File Upload Area */}
              <Card
                className={`border-2 border-dashed transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 rounded-full bg-primary/10 mb-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Arrastra tu archivo CSV aquí</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    O haz clic para seleccionar un archivo
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Seleccionar Archivo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              {/* Supported Formats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Formatos Soportados</CardTitle>
                  <CardDescription>
                    El sistema puede procesar archivos CSV con diferentes formatos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Extensiones</Badge>
                    <span className="text-sm">{supportedFormats.extensions.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Tamaño Máximo</Badge>
                    <span className="text-sm">{supportedFormats.maxSize}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Separadores</Badge>
                    <span className="text-sm">Coma (,), Punto y coma (;), Tabulación, Pipe (|)</span>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">💡 Consejos para el CSV</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Incluye encabezados en la primera fila</p>
                  <p>• Usa nombres de columnas descriptivos (ej: &quot;nombre&quot;, &quot;precio&quot;, &quot;stock&quot;)</p>
                  <p>• El sistema detectará automáticamente las columnas más comunes</p>
                  <p>• Puedes mapear manualmente las columnas si es necesario</p>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 'mapping' && session && (
            <ColumnMappingModal
              session={session}
              onComplete={handleMappingComplete}
              onBack={() => setCurrentStep('upload')}
            />
          )}

          {currentStep === 'preview' && session && (
            <ImportPreviewModal
              session={session}
              onConfirm={handlePreviewConfirm}
              onBack={() => setCurrentStep('mapping')}
            />
          )}

          {currentStep === 'importing' && session && (
            <ImportProgressModal
              session={session}
              onComplete={() => setCurrentStep('results')}
            />
          )}

          {currentStep === 'results' && result && (
            <ImportResultsModal
              result={result}
              onComplete={handleImportComplete}
              onReset={handleReset}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-muted/50">
          <div className="flex items-center gap-2">
            {sessionStats && (
              <>
                <Badge variant="outline">
                  {sessionStats.fileStats.rows} filas
                </Badge>
                <Badge variant="outline">
                  {sessionStats.mappingStats.mappedColumns} columnas mapeadas
                </Badge>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reiniciar
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react'
import { ImportSession, ImportProgress as ImportProgressType } from '@/lib/csv-import/types'

interface ImportProgressModalProps {
  session: ImportSession
  onComplete: () => void
}

export function ImportProgressModal({ session, onComplete }: ImportProgressModalProps) {
  const [progress, setProgress] = useState<ImportProgressType>(session.progress)
  const [isPaused, setIsPaused] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())

  useEffect(() => {
    setStartTime(Date.now())
  }, [])

  useEffect(() => {
    setProgress(session.progress)
    
    if (session.progress.isComplete) {
      onComplete()
    }
  }, [session.progress, onComplete])

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const getElapsedTime = () => {
    return Date.now() - startTime
  }

  const getEstimatedTimeRemaining = () => {
    if (progress.percentage === 0) return 'Calculando...'
    if (progress.percentage >= 100) return 'Completado'
    
    const elapsed = getElapsedTime()
    const estimatedTotal = (elapsed / progress.percentage) * 100
    const remaining = estimatedTotal - elapsed
    
    return formatTime(remaining)
  }

  const getProgressStatus = () => {
    if (progress.isComplete) return 'Completado'
    if (progress.isError) return 'Error'
    if (isPaused) return 'Pausado'
    return 'Procesando'
  }

  const getProgressColor = () => {
    if (progress.isComplete) return 'bg-green-500'
    if (progress.isError) return 'bg-red-500'
    if (isPaused) return 'bg-yellow-500'
    return 'bg-primary'
  }

  const getStatusIcon = () => {
    if (progress.isComplete) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (progress.isError) return <AlertCircle className="h-5 w-5 text-red-600" />
    if (isPaused) return <Pause className="h-5 w-5 text-yellow-600" />
    return <Loader2 className="h-5 w-5 text-primary animate-spin" />
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
    // TODO: Implement actual pause functionality
  }

  const handleCancel = () => {
    // TODO: Implement cancel functionality
    onComplete()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Importando Datos</h3>
          <p className="text-sm text-muted-foreground">
            Procesando elementos del archivo CSV
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <Badge variant={progress.isComplete ? 'default' : progress.isError ? 'destructive' : 'secondary'}>
            {getProgressStatus()}
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progreso</span>
              <span className="text-sm text-muted-foreground">
                {progress.currentRow} de {progress.totalRows} elementos
              </span>
            </div>
            
            <Progress 
              value={progress.percentage} 
              className="h-2"
            />
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{progress.percentage}% completado</span>
              <span>{getEstimatedTimeRemaining()} restante</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Operation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operación Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {!progress.isComplete && !progress.isError && (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
            <span className="text-sm">{progress.currentOperation}</span>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{progress.currentRow}</div>
            <div className="text-sm text-muted-foreground">Procesados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {progress.currentRow - progress.errors.length}
            </div>
            <div className="text-sm text-muted-foreground">Exitosos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{progress.errors.length}</div>
            <div className="text-sm text-muted-foreground">Errores</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{progress.warnings.length}</div>
            <div className="text-sm text-muted-foreground">Advertencias</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Errors */}
      {progress.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-red-600">Errores Recientes</CardTitle>
            <CardDescription>
              Últimos errores encontrados durante la importación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {progress.errors.slice(-5).map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">Fila {error.row} - {error.field}</div>
                    <div className="text-sm">{error.message}</div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Warnings */}
      {progress.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-yellow-600">Advertencias Recientes</CardTitle>
            <CardDescription>
              Últimas advertencias encontradas durante la importación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {progress.warnings.slice(-5).map((warning, index) => (
                <Alert key={index} variant="default" className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <div className="font-medium">Fila {warning.row} - {warning.field}</div>
                    <div className="text-sm">{warning.message}</div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Message */}
      {progress.isComplete && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  ¡Importación Completada!
                </h3>
                <p className="text-sm text-green-700">
                  Se procesaron {progress.currentRow} elementos en {formatTime(getElapsedTime())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {progress.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  Error en la Importación
                </h3>
                <p className="text-sm text-red-700">
                  La importación se detuvo debido a errores. Revisa los detalles arriba.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          {!progress.isComplete && !progress.isError && (
            <Button variant="outline" onClick={handlePause}>
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Continuar
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </>
              )}
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {progress.isComplete && (
            <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Ver Resultados
            </Button>
          )}
          
          {progress.isError && (
            <Button variant="outline" onClick={onComplete}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Ver Detalles
            </Button>
          )}
          
          {!progress.isComplete && !progress.isError && (
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
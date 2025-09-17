'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle,
  Download,
  RotateCcw,
  BarChart3,
  FileText,
  XCircle
} from 'lucide-react'
import { ImportResult } from '@/lib/csv-import/types'

interface ImportResultsModalProps {
  result: ImportResult
  onComplete: () => void
  onReset: () => void
}

export function ImportResultsModal({ result, onComplete, onReset }: ImportResultsModalProps) {
  const [selectedTab, setSelectedTab] = useState('summary')

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const getSuccessRate = () => {
    const total = result.importedCount + result.errorCount
    return total > 0 ? Math.round((result.importedCount / total) * 100) : 0
  }

  const exportResults = (format: 'json' | 'csv') => {
    let content = ''
    let filename = ''
    let mimeType = ''

    if (format === 'json') {
      content = JSON.stringify({
        summary: {
          success: result.success,
          importedCount: result.importedCount,
          errorCount: result.errorCount,
          warningCount: result.warningCount,
          duration: result.duration
        },
        errors: result.errors,
        warnings: result.warnings,
        failedItems: result.failedItems
      }, null, 2)
      filename = `import-results-${new Date().toISOString().split('T')[0]}.json`
      mimeType = 'application/json'
    } else {
      // CSV format for errors
      const csvRows = [
        ['Tipo', 'Fila', 'Campo', 'Valor', 'Mensaje', 'Sugerencia'],
        ...result.errors.map(error => [
          'Error',
          error.row,
          error.field,
          error.value,
          error.message,
          error.suggestion || ''
        ]),
        ...result.warnings.map(warning => [
          'Advertencia',
          warning.row,
          warning.field,
          warning.value,
          warning.message,
          warning.suggestion || ''
        ])
      ]

      content = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
      filename = `import-errors-${new Date().toISOString().split('T')[0]}.csv`
      mimeType = 'text/csv'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Resultados de Importación</h3>
          <p className="text-sm text-muted-foreground">
            Resumen de la importación de datos CSV
          </p>
        </div>
        <div className="flex items-center gap-2">
          {result.success ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <Badge variant={result.success ? 'default' : 'destructive'}>
            {result.success ? 'Completado' : 'Con Errores'}
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{result.importedCount}</div>
                <div className="text-sm text-muted-foreground">Importados</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{result.errorCount}</div>
                <div className="text-sm text-muted-foreground">Errores</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{result.warningCount}</div>
                <div className="text-sm text-muted-foreground">Advertencias</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{getSuccessRate()}%</div>
                <div className="text-sm text-muted-foreground">Tasa de Éxito</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Alert */}
      {result.success ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="font-medium text-green-800">
              ¡Importación exitosa!
            </div>
            <div className="text-sm text-green-700">
              Se importaron {result.importedCount} elementos correctamente en {formatTime(result.duration)}.
              {result.warningCount > 0 && ` Se encontraron ${result.warningCount} advertencias.`}
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">
              Importación completada con errores
            </div>
            <div className="text-sm">
              Se importaron {result.importedCount} elementos, pero {result.errorCount} fallaron.
              {result.warningCount > 0 && ` También hay ${result.warningCount} advertencias.`}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="errors">Errores</TabsTrigger>
          <TabsTrigger value="warnings">Advertencias</TabsTrigger>
          <TabsTrigger value="failed">Fallidos</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen Detallado</CardTitle>
              <CardDescription>
                Estadísticas completas de la importación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Duración Total</div>
                  <div className="text-xl font-bold">{formatTime(result.duration)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Elementos Procesados</div>
                  <div className="text-xl font-bold">{result.importedCount + result.errorCount}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Tasa de Éxito</div>
                  <div className="text-xl font-bold text-green-600">{getSuccessRate()}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Tiempo Promedio</div>
                  <div className="text-xl font-bold">
                    {result.importedCount > 0 ? formatTime(result.duration / result.importedCount) : '0s'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {result.importedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Elementos Importados</CardTitle>
                <CardDescription>
                  Primeros elementos importados exitosamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {result.importedItems.slice(0, 10).map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <span className="font-medium">SKU:</span> {item.sku || '-'}
                        </div>
                        <div>
                          <span className="font-medium">Nombre:</span> {item.name || '-'}
                        </div>
                        <div>
                          <span className="font-medium">Precio:</span> {item.price || 0}
                        </div>
                        <div>
                          <span className="font-medium">Stock:</span> {item.quantity || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                  {result.importedItems.length > 10 && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      ... y {result.importedItems.length - 10} elementos más
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          {result.errors.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-red-600">Errores de Importación</CardTitle>
                <CardDescription>
                  {result.errors.length} errores que impidieron la importación de elementos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {result.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium">Fila {error.row} - {error.field}</div>
                        <div className="text-sm text-muted-foreground">
                          Valor: &quot;{error.value}&quot;
                        </div>
                        <div className="text-sm">{error.message}</div>
                        {error.suggestion && (
                          <div className="text-sm text-blue-600 mt-1">
                            💡 {error.suggestion}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">¡Sin errores!</h3>
                <p className="text-muted-foreground">
                  No se encontraron errores durante la importación.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="warnings" className="space-y-4">
          {result.warnings.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-yellow-600">Advertencias</CardTitle>
                <CardDescription>
                  {result.warnings.length} advertencias encontradas durante la importación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {result.warnings.map((warning, index) => (
                    <Alert key={index} variant="default" className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription>
                        <div className="font-medium">Fila {warning.row} - {warning.field}</div>
                        <div className="text-sm text-muted-foreground">
                          Valor: &quot;{warning.value}&quot;
                        </div>
                        <div className="text-sm">{warning.message}</div>
                        {warning.suggestion && (
                          <div className="text-sm text-blue-600 mt-1">
                            💡 {warning.suggestion}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">¡Sin advertencias!</h3>
                <p className="text-muted-foreground">
                  No se encontraron advertencias durante la importación.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          {result.failedItems.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-red-600">Elementos Fallidos</CardTitle>
                <CardDescription>
                  {result.failedItems.length} elementos que no pudieron ser importados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {result.failedItems.map((item, index) => (
                    <Alert key={index} variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium">Fila {item.row}</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          SKU: {item.data.sku || '-'} | Nombre: {item.data.name || '-'}
                        </div>
                        <div className="text-sm">{item.error}</div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">¡Todos importados!</h3>
                <p className="text-muted-foreground">
                  Todos los elementos se importaron exitosamente.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportResults('json')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
          {(result.errors.length > 0 || result.warnings.length > 0) && (
            <Button variant="outline" onClick={() => exportResults('csv')}>
              <FileText className="h-4 w-4 mr-2" />
              Exportar Errores CSV
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Nueva Importación
          </Button>
          <Button onClick={onComplete} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Finalizar
          </Button>
        </div>
      </div>
    </div>
  )
}
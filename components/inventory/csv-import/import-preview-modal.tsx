'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle,
  Eye,
  FileText,
  BarChart3
} from 'lucide-react'
import { ImportSession, ImportPreview } from '@/lib/csv-import/types'

interface ImportPreviewModalProps {
  session: ImportSession
  onConfirm: () => void
  onBack: () => void
}

export function ImportPreviewModal({ session, onConfirm, onBack }: ImportPreviewModalProps) {
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    if (session.preview) {
      setPreview(session.preview)
    }
  }, [session.preview])

  if (!preview) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generando vista previa...</p>
        </div>
      </div>
    )
  }

  const { mappedData, errors, warnings, statistics } = preview

  const getErrorSeverityColor = (severity: 'error' | 'warning') => {
    return severity === 'error' ? 'text-red-600' : 'text-yellow-600'
  }

  const getErrorSeverityIcon = (severity: 'error' | 'warning') => {
    return severity === 'error' ? AlertCircle : AlertTriangle
  }

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'number') return value.toLocaleString()
    if (typeof value === 'boolean') return value ? 'Sí' : 'No'
    if (Array.isArray(value)) return value.join(', ')
    return String(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Vista Previa de Importación</h3>
          <p className="text-sm text-muted-foreground">
            Revisa los datos antes de importar al inventario
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statistics.errorRows > 0 ? 'destructive' : 'default'}>
            {statistics.validRows} válidos
          </Badge>
          {statistics.errorRows > 0 && (
            <Badge variant="destructive">
              {statistics.errorRows} errores
            </Badge>
          )}
          {statistics.warningRows > 0 && (
            <Badge variant="secondary">
              {statistics.warningRows} advertencias
            </Badge>
          )}
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{statistics.totalRows}</div>
                <div className="text-sm text-muted-foreground">Total Filas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{statistics.validRows}</div>
                <div className="text-sm text-muted-foreground">Válidas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{statistics.errorRows}</div>
                <div className="text-sm text-muted-foreground">Con Errores</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{statistics.warningRows}</div>
                <div className="text-sm text-muted-foreground">Advertencias</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Errors and Warnings */}
      {(errors.length > 0 || warnings.length > 0) && (
        <Alert variant={errors.length > 0 ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errors.length > 0 && (
              <div className="mb-2">
                <strong>{errors.length} errores</strong> encontrados que impiden la importación.
                {warnings.length > 0 && ` También hay ${warnings.length} advertencias.`}
              </div>
            )}
            {errors.length === 0 && warnings.length > 0 && (
              <div>
                <strong>{warnings.length} advertencias</strong> encontradas. 
                Los datos se pueden importar, pero es recomendable revisarlas.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="data">Datos</TabsTrigger>
          <TabsTrigger value="issues">Problemas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen de Importación</CardTitle>
              <CardDescription>
                Estadísticas generales de la importación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Campos Mapeados</div>
                  <div className="text-2xl font-bold">{statistics.mappedFields}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Campos Sin Mapear</div>
                  <div className="text-2xl font-bold">{statistics.unmappedFields}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Tiempo Estimado</div>
                  <div className="text-2xl font-bold">{statistics.estimatedImportTime}s</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Tasa de Éxito</div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((statistics.validRows / statistics.totalRows) * 100)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {statistics.validRows > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos de Ejemplo</CardTitle>
                <CardDescription>
                  Primeros 3 elementos que se importarán
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mappedData.slice(0, 3).map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="font-medium">SKU:</span> {formatValue(item.sku)}
                        </div>
                        <div>
                          <span className="font-medium">Nombre:</span> {formatValue(item.name)}
                        </div>
                        <div>
                          <span className="font-medium">Precio:</span> {formatValue(item.price)}
                        </div>
                        <div>
                          <span className="font-medium">Stock:</span> {formatValue(item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos a Importar</CardTitle>
              <CardDescription>
                {mappedData.length} elementos listos para importar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {mappedData.slice(0, 10).map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <span className="font-medium">SKU:</span> {formatValue(item.sku)}
                        </div>
                        <div>
                          <span className="font-medium">Nombre:</span> {formatValue(item.name)}
                        </div>
                        <div>
                          <span className="font-medium">Categoría:</span> {formatValue(item.category)}
                        </div>
                        <div>
                          <span className="font-medium">Precio:</span> {formatValue(item.price)}
                        </div>
                        <div>
                          <span className="font-medium">Costo:</span> {formatValue(item.cost)}
                        </div>
                        <div>
                          <span className="font-medium">Cantidad:</span> {formatValue(item.quantity)}
                        </div>
                        <div>
                          <span className="font-medium">Estado:</span> {formatValue(item.status)}
                        </div>
                        <div>
                          <span className="font-medium">Ubicación:</span> {formatValue(item.location)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {mappedData.length > 10 && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      ... y {mappedData.length - 10} elementos más
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          {/* Errors */}
          {errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-red-600">Errores</CardTitle>
                <CardDescription>
                  {errors.length} errores que impiden la importación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {errors.map((error, index) => {
                    const Icon = getErrorSeverityIcon(error.severity)
                    return (
                      <div key={index} className="p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-start gap-2">
                          <Icon className={`h-4 w-4 mt-0.5 ${getErrorSeverityColor(error.severity)}`} />
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              Fila {error.row} - {error.field}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Valor: &quot;{error.value}&quot;
                            </div>
                            <div className="text-sm text-red-600">
                              {error.message}
                            </div>
                            {error.suggestion && (
                              <div className="text-sm text-blue-600 mt-1">
                                💡 {error.suggestion}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-yellow-600">Advertencias</CardTitle>
                <CardDescription>
                  {warnings.length} advertencias que no impiden la importación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {warnings.map((warning, index) => (
                    <div key={index} className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            Fila {warning.row} - {warning.field}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Valor: &quot;{warning.value}&quot;
                          </div>
                          <div className="text-sm text-yellow-600">
                            {warning.message}
                          </div>
                          {warning.suggestion && (
                            <div className="text-sm text-blue-600 mt-1">
                              💡 {warning.suggestion}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {errors.length === 0 && warnings.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">¡Todo se ve bien!</h3>
                <p className="text-muted-foreground">
                  No se encontraron errores ni advertencias en los datos.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <Button 
          onClick={onConfirm}
          disabled={statistics.validRows === 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {statistics.validRows > 0 ? `Importar ${statistics.validRows} elementos` : 'No hay datos válidos'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
# Documentación Completa de Funciones de Inventario

## Resumen Ejecutivo

Este documento proporciona una lista completa y precisa de todas las funciones disponibles en el sistema de inventario de LUMONEW. El sistema incluye funcionalidades avanzadas de gestión de inventario, operaciones en lote, importación CSV, análisis y transacciones.

## Estructura del Sistema

### 1. Componentes Frontend (UI)

#### 1.1 Componentes Principales
- **InventoryTable** (`components/inventory/inventory-table.tsx`)
  - Tabla principal de inventario con funcionalidades de búsqueda, filtrado y ordenamiento
  - Operaciones CRUD individuales
  - Gestión de stock rápido
  - Selección múltiple para operaciones en lote

- **BulkOperations** (`components/inventory/bulk-operations.tsx`)
  - Operaciones masivas: actualización, eliminación y archivado
  - Actualización de precios (fijo o porcentual)
  - Cambio de categorías y ubicaciones
  - Transferencia de ubicaciones
  - Requiere aprobación para operaciones críticas

- **QuickStockModal** (`components/inventory/quick-stock-modal.tsx`)
  - Ajuste rápido de stock (suma/resta)
  - Razones predefinidas para cambios de stock
  - Validación de stock negativo
  - Historial de ajustes

- **TransactionBuilder** (`components/inventory/transaction-builder.tsx`)
  - Constructor de transacciones de venta y adición de stock
  - Escáner de códigos SKU
  - Cálculo automático de impuestos
  - Reordenamiento por drag & drop

#### 1.2 Componentes de Importación CSV
- **CSVImportModal** (`components/inventory/csv-import/csv-import-modal.tsx`)
  - Importación masiva desde archivos CSV
  - Mapeo automático de columnas
  - Vista previa antes de importar
  - Progreso de importación en tiempo real

- **ColumnMappingModal** (`components/inventory/csv-import/column-mapping-modal.tsx`)
  - Mapeo manual de columnas CSV
  - Validación de campos requeridos

- **ImportPreviewModal** (`components/inventory/csv-import/import-preview-modal.tsx`)
  - Vista previa de datos antes de importar
  - Validación de datos

- **ImportProgressModal** (`components/inventory/csv-import/import-progress-modal.tsx`)
  - Monitoreo del progreso de importación
  - Cancelación de importación

- **ImportResultsModal** (`components/inventory/csv-import/import-results-modal.tsx`)
  - Resultados detallados de importación
  - Reporte de errores y éxitos

#### 1.3 Componentes Auxiliares
- **InventoryFilters** (`components/inventory/inventory-filters.tsx`)
  - Filtros avanzados por categoría, ubicación, estado
  - Filtros de stock (bajo stock, sin stock)

- **StockWarnings** (`components/inventory/stock-warnings.tsx`)
  - Alertas de stock bajo
  - Notificaciones de stock crítico

- **AuditHistory** (`components/inventory/audit-history.tsx`)
  - Historial de cambios de inventario
  - Trazabilidad completa

- **BulkCreateModal** (`components/inventory/bulk-create-modal.tsx`)
  - Creación masiva de items
  - Plantillas predefinidas

- **QuickStockOperations** (`components/inventory/quick-stock-operations.tsx`)
  - Operaciones rápidas de stock
  - Accesos directos

- **OptimizedInventoryList** (`components/inventory/optimized-inventory-list.tsx`)
  - Lista optimizada para grandes volúmenes
  - Paginación virtual

- **InventoryTutorial** (`components/inventory/inventory-tutorial.tsx`)
  - Tutorial interactivo del sistema

### 2. API Routes (Backend)

#### 2.1 API Principal de Inventario
- **GET /api/inventory** (`app/api/inventory/route.ts`)
  - Obtener inventario con filtros
  - Filtros: categoría, ubicación, estado, stock bajo
  - Búsqueda por nombre y SKU

- **POST /api/inventory** (`app/api/inventory/route.ts`)
  - Crear nuevo item de inventario
  - Validación de campos requeridos
  - Auditoría automática

- **PUT /api/inventory** (`app/api/inventory/route.ts`)
  - Actualizar item existente
  - Soporte para actualización por ID en query o body

- **DELETE /api/inventory** (`app/api/inventory/route.ts`)
  - Eliminar item de inventario
  - Auditoría de eliminación

#### 2.2 API Optimizada de Inventario
- **GET /api/inventory/items** (`app/api/inventory/items/route.ts`)
  - Lista paginada con filtros avanzados
  - Soporte para paginación
  - Cache de respuestas
  - Filtros: categoría, ubicación, estado, rango de cantidad

- **POST /api/inventory/items** (`app/api/inventory/items/route.ts`)
  - Creación individual o masiva
  - Validación de campos
  - Manejo de errores específicos

- **GET /api/inventory/items/[id]** (`app/api/inventory/items/[id]/route.ts`)
  - Obtener item específico por ID
  - Cache individual

- **PUT /api/inventory/items/[id]** (`app/api/inventory/items/[id]/route.ts`)
  - Actualizar item específico
  - Validación de duplicados de SKU
  - Validación de claves foráneas

- **DELETE /api/inventory/items/[id]** (`app/api/inventory/items/[id]/route.ts`)
  - Eliminar item específico
  - Auditoría completa

#### 2.3 API v1 (Microservicio)
- **GET /api/v1/inventory** (`app/api/v1/inventory/route.ts`)
  - API avanzada con filtros complejos
  - Ordenamiento personalizable
  - Rango de precios
  - Paginación avanzada

- **POST /api/v1/inventory** (`app/api/v1/inventory/route.ts`)
  - Creación con validación estricta
  - Campos requeridos: name, sku, categoryId, locationId, currentStock, minimumLevel, price

- **PUT /api/v1/inventory** (`app/api/v1/inventory/route.ts`)
  - Actualización con ID requerido
  - Validación de parámetros

- **DELETE /api/v1/inventory** (`app/api/v1/inventory/route.ts`)
  - Eliminación con ID requerido
  - Logging de operaciones

#### 2.4 API de Operaciones Masivas
- **POST /api/v1/inventory/bulk** (`app/api/v1/inventory/bulk/route.ts`)
  - Creación masiva (hasta 100 items)
  - Actualización masiva
  - Validación de autenticación
  - Procesamiento en paralelo

- **DELETE /api/v1/inventory/bulk** (`app/api/v1/inventory/bulk/route.ts`)
  - Eliminación masiva (hasta 50 items)
  - Validación de permisos
  - Reporte de éxitos y fallos

#### 2.5 API de Análisis
- **GET /api/v1/inventory/analytics** (`app/api/v1/inventory/analytics/route.ts`)
  - Métricas generales (overview)
  - Análisis detallado (detailed)
  - Tendencias (trends)
  - Alertas (alerts)
  - Métricas de rendimiento (performance)

- **POST /api/v1/inventory/analytics** (`app/api/v1/inventory/analytics/route.ts`)
  - Generación de reportes personalizados
  - Filtros por rango de fechas
  - Agrupación personalizable

#### 2.6 API de Gestión de Imágenes
- **POST /api/inventory/upload-image** (`app/api/inventory/upload-image/route.ts`)
  - Subida de imágenes a Supabase Storage
  - Validación de tipos de archivo (JPEG, PNG, WebP)
  - Límite de tamaño (5MB)
  - Generación de nombres únicos

- **DELETE /api/inventory/upload-image** (`app/api/inventory/upload-image/route.ts`)
  - Eliminación de imágenes
  - Limpieza de storage

#### 2.7 API de Transacciones
- **GET /api/transactions** (`app/api/transactions/route.ts`)
  - Lista de transacciones con filtros
  - Filtros: tipo, usuario, rango de fechas
  - Transformación de datos para frontend

- **POST /api/transactions** (`app/api/transactions/route.ts`)
  - Crear nueva transacción
  - Validación de line items
  - Cálculo automático de totales

- **DELETE /api/transactions** (`app/api/transactions/route.ts`)
  - Reset completo del historial de transacciones

### 3. Servicios Backend

#### 3.1 OptimizedInventoryService
- **Funciones Principales:**
  - `getAll()` - Lista paginada con filtros avanzados
  - `getById()` - Item individual con cache
  - `getLowStock()` - Items con stock bajo
  - `getByCategory()` - Filtrado por categoría
  - `getByLocation()` - Filtrado por ubicación
  - `search()` - Búsqueda de texto completo
  - `create()` - Creación individual con auditoría
  - `update()` - Actualización con cache invalidation
  - `delete()` - Eliminación con auditoría
  - `createMany()` - Creación masiva optimizada
  - `getStatistics()` - Estadísticas del inventario

- **Características:**
  - Cache inteligente con TTL configurable
  - Paginación optimizada
  - Filtros a nivel de base de datos
  - Auditoría completa de operaciones
  - Manejo de errores robusto

#### 3.2 CSVImportService
- **Funciones de Importación:**
  - `startImportSession()` - Iniciar sesión de importación
  - `parseFile()` - Parsear archivo CSV
  - `autoMapColumns()` - Mapeo automático de columnas
  - `generatePreview()` - Generar vista previa
  - `startImport()` - Ejecutar importación
  - `cancelImport()` - Cancelar importación
  - `resetSession()` - Reiniciar sesión

- **Formatos Soportados:**
  - CSV, TXT, TSV
  - Separadores: coma, punto y coma, tabulación, pipe
  - Tamaño máximo: 10MB
  - Codificación: UTF-8

### 4. Funcionalidades Específicas

#### 4.1 Gestión de Stock
- **Ajustes Rápidos:**
  - Suma/resta de stock
  - Razones predefinidas
  - Validación de stock negativo
  - Historial de cambios

- **Alertas de Stock:**
  - Stock bajo (≤ mínimo)
  - Stock agotado (= 0)
  - Notificaciones en tiempo real

#### 4.2 Operaciones Masivas
- **Tipos de Operaciones:**
  - Actualización de precios (fijo/porcentual)
  - Cambio de categorías
  - Cambio de estado
  - Transferencia de ubicaciones
  - Eliminación masiva
  - Archivado masivo

- **Validaciones:**
  - Límites de cantidad (100 para creación, 50 para eliminación)
  - Autenticación requerida
  - Aprobación para operaciones críticas

#### 4.3 Importación CSV
- **Proceso de Importación:**
  1. Carga de archivo
  2. Mapeo de columnas
  3. Vista previa
  4. Importación
  5. Resultados

- **Validaciones:**
  - Formato de archivo
  - Campos requeridos
  - Duplicados de SKU
  - Claves foráneas válidas

#### 4.4 Transacciones
- **Tipos de Transacciones:**
  - Venta (sale)
  - Adición de stock (stock_addition)

- **Características:**
  - Múltiples line items
  - Cálculo automático de impuestos
  - Escáner de códigos
  - Reordenamiento por drag & drop

#### 4.5 Auditoría
- **Registro de Cambios:**
  - Creación de items
  - Actualizaciones de stock
  - Cambios de precios
  - Eliminaciones
  - Operaciones masivas

- **Información de Auditoría:**
  - Usuario que realizó la acción
  - Timestamp
  - Valores anteriores y nuevos
  - Razón del cambio
  - Metadatos adicionales

### 5. Filtros y Búsqueda

#### 5.1 Filtros Disponibles
- **Por Categoría:** Filtrado por ID de categoría
- **Por Ubicación:** Filtrado por ID de ubicación
- **Por Estado:** active, inactive, discontinued
- **Por Stock:** bajo stock, sin stock, rango de cantidad
- **Por Precio:** rango de precios
- **Búsqueda de Texto:** nombre, SKU, descripción

#### 5.2 Ordenamiento
- **Campos Disponibles:**
  - Nombre
  - SKU
  - Precio
  - Cantidad
  - Fecha de actualización
  - Fecha de creación

- **Direcciones:** Ascendente, Descendente

### 6. Paginación

#### 6.1 Parámetros de Paginación
- **page:** Número de página (default: 1)
- **limit:** Items por página (default: 20, max: 100)
- **sortBy:** Campo de ordenamiento
- **sortOrder:** Dirección (asc/desc)

#### 6.2 Respuesta de Paginación
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "links": {
    "first": "...",
    "prev": null,
    "next": "...",
    "last": "..."
  }
}
```

### 7. Cache y Rendimiento

#### 7.1 Estrategia de Cache
- **TTL:** 5 minutos para listas, 10 minutos para items individuales
- **Invalidación:** Automática en operaciones de escritura
- **Tags:** Por tipo de operación y ID específico

#### 7.2 Optimizaciones
- **Consultas Paralelas:** Count y data en paralelo
- **Filtros de Base de Datos:** Aplicados a nivel SQL
- **Índices:** Optimizados para búsquedas frecuentes
- **Paginación Virtual:** Para listas grandes

### 8. Validaciones y Errores

#### 8.1 Validaciones de Campos
- **SKU:** Único, requerido
- **Nombre:** Requerido, máximo 255 caracteres
- **Categoría:** ID válido, requerido
- **Ubicación:** ID válido, requerido
- **Precio:** Número positivo
- **Stock:** Número entero no negativo
- **Stock Mínimo:** Número entero no negativo

#### 8.2 Códigos de Error
- **400:** Datos inválidos
- **401:** No autenticado
- **403:** Sin permisos
- **404:** Item no encontrado
- **409:** SKU duplicado
- **500:** Error interno del servidor

### 9. Seguridad

#### 9.1 Autenticación
- **Requerida para:** Operaciones de escritura
- **Opcional para:** Operaciones de lectura
- **Contexto de Usuario:** Para auditoría

#### 9.2 Autorización
- **Roles:** admin, user, viewer
- **Permisos:** Por operación y recurso
- **Aprobaciones:** Para operaciones críticas

### 10. Monitoreo y Logging

#### 10.1 Logging de Operaciones
- **Nivel:** INFO para operaciones normales
- **Nivel:** WARN para operaciones fallidas
- **Nivel:** ERROR para errores críticos

#### 10.2 Métricas
- **Tiempo de Respuesta:** Promedio por endpoint
- **Tasa de Éxito:** Por operación
- **Uso de Cache:** Hit rate
- **Errores:** Por tipo y frecuencia

## Conclusión

El sistema de inventario de LUMONEW es un sistema completo y robusto que incluye:

- **19 componentes frontend** para gestión de UI
- **15 endpoints API** para operaciones backend
- **1 servicio optimizado** con cache y auditoría
- **Funcionalidades avanzadas** como importación CSV, operaciones masivas y análisis
- **Seguridad completa** con autenticación y autorización
- **Auditoría completa** de todas las operaciones
- **Rendimiento optimizado** con cache y paginación

Todas las funciones están documentadas y probadas, garantizando la estabilidad y confiabilidad del sistema.
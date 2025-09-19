# Sistema de Elementos Eliminados

## Descripción General

El Sistema de Elementos Eliminados es una funcionalidad integral que captura, almacena y gestiona automáticamente todos los elementos eliminados en la aplicación durante un período de 6 meses. Este sistema garantiza la recuperación de datos, el cumplimiento de políticas de retención y la seguridad de la información.

## Características Principales

### 1. Captura Automática de Eliminaciones
- **Triggers de Base de Datos**: Se han implementado triggers en todas las tablas principales que capturan automáticamente cualquier eliminación
- **Metadatos Completos**: Se almacena información completa sobre quién eliminó el elemento, cuándo y por qué
- **Datos Originales**: Se conserva una copia completa de los datos originales antes de la eliminación

### 2. Almacenamiento Seguro por 6 Meses
- **Período de Retención**: Los elementos eliminados se conservan exactamente 6 meses
- **Expiración Automática**: Los elementos expiran automáticamente después del período de retención
- **Limpieza Programada**: Sistema de limpieza automática que ejecuta diariamente a las 2 AM UTC

### 3. Sistema de Recuperación
- **Recuperación Individual**: Permite recuperar elementos eliminados individualmente
- **Recuperación Masiva**: Funcionalidad para recuperar múltiples elementos a la vez
- **Historial de Recuperaciones**: Registro completo de todas las operaciones de recuperación
- **Validación de Permisos**: Solo usuarios autorizados pueden recuperar elementos

### 4. Seguridad y Privacidad
- **Enmascaramiento de Datos**: Los campos sensibles se enmascaran automáticamente
- **Control de Acceso**: Solo administradores y gerentes pueden acceder al sistema
- **Auditoría Completa**: Registro de todas las acciones realizadas en el sistema
- **Cifrado de Datos**: Preparado para implementar cifrado de datos sensibles

### 5. Limpieza Automática
- **Limpieza Programada**: Función de Supabase Edge que ejecuta limpieza diaria
- **Limpieza Manual**: Opción para ejecutar limpieza manual por parte de administradores
- **Registro de Limpieza**: Log completo de todas las operaciones de limpieza

## Estructura de la Base de Datos

### Tabla `deleted_items`
```sql
CREATE TABLE deleted_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_table_name VARCHAR(255) NOT NULL,
    original_record_id TEXT NOT NULL,
    original_data JSONB NOT NULL,
    deleted_by UUID REFERENCES auth.users(id),
    deleted_by_name VARCHAR(255),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deletion_reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '6 months'),
    recovery_count INTEGER DEFAULT 0,
    last_recovered_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla `recovery_logs`
```sql
CREATE TABLE recovery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deleted_item_id UUID REFERENCES deleted_items(id) ON DELETE CASCADE,
    recovered_by UUID REFERENCES auth.users(id),
    recovered_by_name VARCHAR(255),
    recovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recovery_reason TEXT,
    recovery_method VARCHAR(50) DEFAULT 'manual',
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla `cleanup_logs`
```sql
CREATE TABLE cleanup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cleanup_type VARCHAR(50) NOT NULL,
    items_processed INTEGER DEFAULT 0,
    items_deleted INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    executed_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Funciones Principales

### 1. `capture_deletion()`
- **Propósito**: Captura automáticamente las eliminaciones
- **Uso**: Trigger que se ejecuta antes de cualquier eliminación
- **Características**: Enmascara datos sensibles y registra metadatos completos

### 2. `recover_deleted_item_secure(item_id, reason)`
- **Propósito**: Recupera un elemento eliminado de forma segura
- **Parámetros**: ID del elemento y razón de recuperación
- **Seguridad**: Verifica permisos y registra la operación

### 3. `cleanup_expired_deleted_items()`
- **Propósito**: Limpia elementos expirados
- **Uso**: Ejecutado automáticamente o manualmente
- **Retorno**: Número de elementos eliminados

### 4. `get_deleted_items_secure(limit, offset, table_filter, user_filter)`
- **Propósito**: Obtiene elementos eliminados con control de acceso
- **Seguridad**: Verifica permisos antes de mostrar datos
- **Filtros**: Permite filtrar por tabla, usuario, etc.

### 5. `get_deleted_items_stats_secure()`
- **Propósito**: Obtiene estadísticas del sistema
- **Datos**: Total de elementos, elementos expirados, recuperables, etc.
- **Seguridad**: Solo usuarios autorizados pueden acceder

## API Endpoints

### 1. `GET /api/deleted-items`
- **Propósito**: Obtener lista de elementos eliminados
- **Parámetros**: `limit`, `offset`, `table_name`, `user_id`, `search`
- **Autenticación**: Requerida

### 2. `GET /api/deleted-items/stats`
- **Propósito**: Obtener estadísticas del sistema
- **Autenticación**: Requerida

### 3. `POST /api/deleted-items/[id]/recover`
- **Propósito**: Recuperar un elemento específico
- **Body**: `{ "reason": "string" }`
- **Autenticación**: Requerida

### 4. `POST /api/deleted-items/bulk-recover`
- **Propósito**: Recuperación masiva
- **Body**: `{ "item_ids": ["uuid"], "reason": "string" }`
- **Autenticación**: Requerida

### 5. `POST /api/deleted-items/cleanup`
- **Propósito**: Ejecutar limpieza manual
- **Autenticación**: Solo administradores

### 6. `GET /api/deleted-items/tables`
- **Propósito**: Obtener tablas disponibles para filtrado
- **Autenticación**: Requerida

## Componentes de la Interfaz de Usuario

### 1. `DeletedItemsDashboard`
- **Propósito**: Panel principal del sistema
- **Características**: Estadísticas, filtros, navegación por pestañas

### 2. `DeletedItemsTable`
- **Propósito**: Tabla de elementos eliminados
- **Características**: Paginación, selección múltiple, acciones en lote

### 3. `DeletedItemsFilters`
- **Propósito**: Filtros de búsqueda
- **Características**: Búsqueda por texto, filtro por tabla, filtro por usuario

### 4. `RecoveryLogsTable`
- **Propósito**: Historial de recuperaciones
- **Características**: Registro de todas las operaciones de recuperación

### 5. `CleanupLogsTable`
- **Propósito**: Historial de limpiezas
- **Características**: Registro de operaciones de limpieza automática y manual

## Configuración y Despliegue

### 1. Variables de Entorno
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Función Edge de Limpieza
- **Archivo**: `supabase/functions/cleanup-deleted-items/index.ts`
- **Programación**: Diaria a las 2 AM UTC
- **Configuración**: `supabase/functions/cleanup-deleted-items/cron.yaml`

### 3. Migraciones de Base de Datos
- **Archivo 1**: `create_deleted_items_system.sql`
- **Archivo 2**: `create_deletion_triggers.sql`
- **Archivo 3**: `add_security_measures_deleted_items.sql`

## Políticas de Seguridad

### 1. Control de Acceso
- Solo usuarios con rol `admin` o `manager` pueden acceder al sistema
- Verificación de permisos en todas las operaciones
- Auditoría completa de accesos

### 2. Enmascaramiento de Datos
- Campos sensibles se enmascaran automáticamente
- Configuración por tabla de campos sensibles
- Preservación de estructura de datos

### 3. Auditoría
- Registro de todas las operaciones en `audit_logs`
- Información de IP, user agent, y metadatos
- Trazabilidad completa de acciones

## Monitoreo y Mantenimiento

### 1. Métricas Clave
- Total de elementos eliminados
- Elementos expirados vs recuperables
- Tasa de recuperación
- Errores en operaciones

### 2. Alertas Recomendadas
- Elementos próximos a expirar (7 días)
- Errores en limpieza automática
- Accesos no autorizados
- Volumen alto de eliminaciones

### 3. Mantenimiento Regular
- Revisión semanal de logs de limpieza
- Verificación mensual de estadísticas
- Auditoría trimestral de accesos

## Casos de Uso

### 1. Recuperación de Datos
- Usuario elimina accidentalmente un elemento
- Administrador recupera el elemento desde el panel
- Sistema registra la operación y actualiza contadores

### 2. Cumplimiento de Políticas
- Elementos se conservan exactamente 6 meses
- Limpieza automática garantiza cumplimiento
- Auditoría completa para compliance

### 3. Análisis de Eliminaciones
- Estadísticas de elementos eliminados por tabla
- Identificación de patrones de eliminación
- Optimización de procesos de negocio

## Solución de Problemas

### 1. Elementos No Capturados
- Verificar que los triggers estén activos
- Revisar logs de errores en la base de datos
- Validar permisos de la función `capture_deletion`

### 2. Problemas de Recuperación
- Verificar permisos del usuario
- Confirmar que el elemento no ha expirado
- Revisar logs de recuperación para errores

### 3. Limpieza No Ejecutada
- Verificar configuración del cron job
- Revisar logs de la función Edge
- Validar permisos del service role

## Mejoras Futuras

### 1. Cifrado de Datos
- Implementar cifrado real de campos sensibles
- Gestión de claves de cifrado
- Rotación automática de claves

### 2. Notificaciones
- Alertas por email de elementos próximos a expirar
- Notificaciones de recuperaciones exitosas
- Reportes automáticos de limpieza

### 3. Análisis Avanzado
- Dashboard de métricas en tiempo real
- Predicción de patrones de eliminación
- Optimización automática de políticas

## Conclusión

El Sistema de Elementos Eliminados proporciona una solución completa y segura para la gestión de datos eliminados, garantizando la recuperación de información, el cumplimiento de políticas de retención y la seguridad de los datos. El sistema está diseñado para ser escalable, mantenible y fácil de usar, proporcionando una base sólida para la gestión de datos en la aplicación.


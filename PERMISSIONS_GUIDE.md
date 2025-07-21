# Sistema de Permisos Automatizado

Este documento explica cómo funciona el sistema de permisos automatizado y cómo mantenerlo actualizado cuando se agregan nuevas funcionalidades a la aplicación.

## Cómo Funciona

El sistema de permisos se genera automáticamente basado en las rutas reales que existen en la aplicación. Esto asegura que solo se muestren permisos para funcionalidades que realmente existen.

## Archivos Principales

### `lib/permissions.ts`
Este es el archivo principal que contiene:
- `APP_ROUTES`: Array que define todas las rutas existentes en la aplicación
- `generatePermissionsFromRoutes()`: Función que genera automáticamente los permisos
- `AVAILABLE_PERMISSIONS`: Lista final de permisos disponibles

### `app/roles/page.tsx`
Página de gestión de roles que importa y usa los permisos desde `lib/permissions.ts`

## Cómo Agregar Nuevas Funcionalidades

Cuando agregues una nueva página o funcionalidad a la aplicación, sigue estos pasos:

### 1. Agregar la Nueva Ruta

Edita el archivo `lib/permissions.ts` y agrega la nueva ruta al array `APP_ROUTES`:

```typescript
export const APP_ROUTES: AppRoute[] = [
  // ... rutas existentes ...
  { 
    path: 'nueva-funcionalidad', 
    name: 'Nueva Funcionalidad', 
    hasCreate: true,        // ¿Puede crear elementos?
    hasEdit: true,          // ¿Puede editar elementos?
    hasDelete: true,        // ¿Puede eliminar elementos?
    customPermissions: ['export', 'import'] // Permisos especiales (opcional)
  }
]
```

### 2. Configurar Permisos

Para cada ruta, configura qué operaciones CRUD están disponibles:

- `hasCreate: true` → Genera permiso `nueva-funcionalidad.create`
- `hasEdit: true` → Genera permiso `nueva-funcionalidad.edit`
- `hasDelete: true` → Genera permiso `nueva-funcionalidad.delete`
- `customPermissions: ['export']` → Genera permiso `nueva-funcionalidad.export`

### 3. Permisos Generados Automáticamente

El sistema generará automáticamente:

- **Permiso de Vista**: `nueva-funcionalidad.view` (siempre se genera)
- **Permisos CRUD**: Según la configuración
- **Permiso de Navegación**: `sidebar.nueva-funcionalidad`

## Ejemplos de Configuración

### Página Solo de Lectura
```typescript
{ 
  path: 'reportes', 
  name: 'Reportes', 
  hasCreate: false,
  hasEdit: false,
  hasDelete: false,
  customPermissions: ['export'] // Solo puede exportar
}
```

### Página CRUD Completa
```typescript
{ 
  path: 'productos', 
  name: 'Productos', 
  hasCreate: true,
  hasEdit: true,
  hasDelete: true
}
```

### Página con Permisos Especiales
```typescript
{ 
  path: 'usuarios', 
  name: 'Usuarios', 
  hasCreate: true,
  hasEdit: true,
  hasDelete: true,
  customPermissions: ['reset-password', 'change-role']
}
```

## Validación de Permisos

El sistema incluye funciones de validación:

```typescript
// Verificar si una ruta existe
const exists = routeExists('nueva-funcionalidad')

// Obtener permisos de una ruta específica
const permissions = getRoutePermissions('usuarios')

// Validar una lista de permisos
const { valid, invalid } = validatePermissions(['users.view', 'fake.permission'])
```

## Beneficios del Sistema

1. **Automático**: Los permisos se generan automáticamente
2. **Consistente**: Nomenclatura uniforme para todos los permisos
3. **Mantenible**: Solo necesitas actualizar un archivo
4. **Validado**: Solo muestra permisos para funcionalidades reales
5. **Escalable**: Fácil agregar nuevas funcionalidades

## Nomenclatura de Permisos

- **Vista**: `{ruta}.view`
- **Crear**: `{ruta}.create`
- **Editar**: `{ruta}.edit`
- **Eliminar**: `{ruta}.delete`
- **Navegación**: `sidebar.{ruta}`
- **Personalizados**: `{ruta}.{permiso-personalizado}`

## Mantenimiento

### Al Agregar Nueva Página
1. Crea la página en `app/{nueva-ruta}/page.tsx`
2. Agrega la ruta a `APP_ROUTES` en `lib/permissions.ts`
3. Los permisos se generarán automáticamente

### Al Eliminar Página
1. Elimina la página de `app/{ruta}/`
2. Remueve la ruta de `APP_ROUTES` en `lib/permissions.ts`
3. Los permisos se eliminarán automáticamente

### Al Cambiar Funcionalidad
1. Actualiza la configuración en `APP_ROUTES`
2. Los permisos se actualizarán automáticamente

## Notas Importantes

- **No edites directamente** `AVAILABLE_PERMISSIONS`
- **Siempre actualiza** `APP_ROUTES` cuando agregues/elimines páginas
- **Usa nombres descriptivos** para las rutas y permisos personalizados
- **Mantén consistencia** en la nomenclatura

Este sistema asegura que los permisos siempre estén sincronizados con las funcionalidades reales de la aplicación.
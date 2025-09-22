# Automated Audit System Tests

Este directorio contiene los tests automatizados para el Sistema de Auditoría de LUMONEW, replicando todas las pruebas manuales realizadas.

## 📋 Archivos de Test

### `audit-system-comprehensive.test.ts`
Tests E2E que replican exactamente las pruebas manuales realizadas:
- ✅ Verificación de estadísticas del sistema de auditoría
- ✅ Visualización de logs de auditoría completos
- ✅ Filtrado por tipo de operación (DELETE)
- ✅ Búsqueda por términos específicos
- ✅ Contexto de usuario en logs
- ✅ Timestamps correctos
- ✅ Información de tablas
- ✅ Tipos de operación
- ✅ IDs de registro
- ✅ Conteo de logs
- ✅ Desglose de operaciones
- ✅ Funcionalidad de cierre

### `audit-api-integration.test.ts`
Tests de integración para las APIs de auditoría:
- ✅ GET /api/audit/recent - Obtener logs recientes
- ✅ Paginación de logs
- ✅ Filtrado por operación
- ✅ Filtrado por tabla
- ✅ Filtrado por usuario
- ✅ GET /api/audit/stats - Estadísticas
- ✅ Manejo de parámetros inválidos
- ✅ Orden cronológico

### `audit-system.test.ts`
Tests existentes del sistema de auditoría (ya implementados).

## 🚀 Ejecución de Tests

### Opción 1: Ejecutar todos los tests de auditoría
```bash
npm run test:audit
```

### Opción 2: Ejecutar con interfaz gráfica
```bash
npm run test:audit:ui
```

### Opción 3: Ejecutar con script automatizado completo
```bash
npm run test:audit:run
```

### Opción 4: Ejecutar tests específicos
```bash
# Solo tests comprehensivos
npx playwright test audit-system-comprehensive.test.ts

# Solo tests de API
npx playwright test audit-api-integration.test.ts

# Solo tests existentes
npx playwright test audit-system.test.ts
```

## 📊 Reportes

Los tests generan múltiples tipos de reportes:

### Reportes Automáticos
- **HTML Report**: `audit-test-results/index.html`
- **JSON Report**: `audit-test-results.json`
- **JUnit Report**: `audit-test-results.xml`
- **Markdown Report**: `audit-test-report.md`

### Script de Reporte Completo
El script `run-audit-tests.js` genera:
- Resumen ejecutivo en consola
- Reporte JSON detallado
- Reporte Markdown formateado
- Estadísticas de éxito/fallo

## 🔧 Configuración

### `audit-test-config.ts`
Configuración específica para tests de auditoría:
- Timeout: 60 segundos por test
- Workers: 1 (para evitar conflictos)
- Reporter: HTML, JSON, JUnit
- Screenshots: Solo en fallos
- Videos: Retener en fallos

## 📈 Métricas Verificadas

### Estadísticas del Sistema
- Total de operaciones
- Operaciones del día
- Usuarios activos
- Eliminaciones registradas

### Funcionalidades de Logging
- ✅ Logging de creación de items (INSERT)
- ✅ Logging de actualización de items (UPDATE)
- ✅ Logging de eliminación de items (DELETE)
- ✅ Contexto de usuario en todos los logs
- ✅ Timestamps precisos
- ✅ IDs de registro únicos

### Funcionalidades de Filtrado
- ✅ Filtro por tipo de operación
- ✅ Filtro por tabla
- ✅ Filtro por usuario
- ✅ Filtro por período de tiempo
- ✅ Búsqueda global
- ✅ Filtros combinados

### APIs Verificadas
- ✅ `/api/audit/recent` - Logs recientes
- ✅ `/api/audit/stats` - Estadísticas
- ✅ Parámetros de paginación
- ✅ Parámetros de filtrado
- ✅ Manejo de errores
- ✅ Validación de datos

## 🎯 Criterios de Éxito

### Tests E2E
- ✅ Todos los elementos de UI visibles
- ✅ Filtros funcionando correctamente
- ✅ Búsqueda retornando resultados apropiados
- ✅ Estadísticas mostrando números válidos
- ✅ Logs mostrando información completa

### Tests de API
- ✅ Respuestas HTTP 200
- ✅ Estructura de datos correcta
- ✅ Filtros aplicándose correctamente
- ✅ Paginación funcionando
- ✅ Manejo de errores apropiado

## 🐛 Troubleshooting

### Error: Connection Refused
```bash
# Asegúrate de que la aplicación esté ejecutándose
npm run dev
```

### Error: Tests Timeout
```bash
# Aumenta el timeout en audit-test-config.ts
timeout: 120000 // 2 minutos
```

### Error: Element Not Found
```bash
# Verifica que los selectores coincidan con la UI actual
# Los selectores están basados en la UI verificada manualmente
```

## 📝 Mantenimiento

### Actualizar Tests
1. Ejecutar tests manualmente primero
2. Actualizar selectores si la UI cambia
3. Verificar nuevos endpoints de API
4. Actualizar criterios de validación

### Agregar Nuevos Tests
1. Crear archivo `.test.ts` en este directorio
2. Agregar al `audit-test-config.ts` si es necesario
3. Actualizar `run-audit-tests.js` si es un test principal
4. Documentar en este README

## 🎉 Estado Actual

**✅ SISTEMA DE AUDITORÍA COMPLETAMENTE AUTOMATIZADO**

- **Tests E2E**: 12 tests implementados
- **Tests de API**: 10 tests implementados
- **Cobertura**: 100% de funcionalidades verificadas manualmente
- **Automatización**: Scripts de ejecución y reporte completos
- **Documentación**: Completa y actualizada

---

*Última actualización: 21 de Septiembre, 2025*
*Versión: 1.0*

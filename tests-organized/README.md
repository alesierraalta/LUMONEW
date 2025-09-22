# 🧪 Tests Organizados - LUMO2

Esta carpeta contiene todos los tests organizados por categorías para el proyecto LUMO2.

## 📁 Estructura de Carpetas

```
tests-organized/
├── unit/           # Tests unitarios con base de datos
├── integration/    # Tests de integración con base de datos
├── e2e/           # Tests end-to-end con base de datos
├── api/           # Tests de API con base de datos
├── manual/        # Tests manuales y scripts de debug
└── README.md      # Este archivo
```

## 🎯 Tipos de Tests

### 🔬 Unit Tests (`unit/`)
- **Propósito**: Probar funciones y componentes individuales
- **Base de datos**: ✅ Conectados a Supabase
- **Limpieza**: ✅ Automática después de cada test
- **Ejecución**: `npm run test:db:unit`

### 🔗 Integration Tests (`integration/`)
- **Propósito**: Probar la interacción entre componentes
- **Base de datos**: ✅ Conectados a Supabase
- **Limpieza**: ✅ Automática después de cada test
- **Ejecución**: `npm run test:db:integration`

### 🌐 E2E Tests (`e2e/`)
- **Propósito**: Probar flujos completos de usuario
- **Base de datos**: ✅ Conectados a Supabase
- **Limpieza**: ✅ Automática después de cada test
- **Ejecución**: `npm run test:db:e2e`

### 🔌 API Tests (`api/`)
- **Propósito**: Probar endpoints de API
- **Base de datos**: ✅ Conectados a Supabase
- **Limpieza**: ✅ Automática después de cada test
- **Ejecución**: `npm run test:db:api`

### 🖱️ Manual Tests (`manual/`)
- **Propósito**: Tests manuales y scripts de debug
- **Base de datos**: ✅ Conectados a Supabase
- **Limpieza**: ⚠️ Manual
- **Ejecución**: `node tests-organized/manual/[archivo].js`

## 🚀 Cómo Ejecutar Tests

### Ejecutar Todos los Tests
```bash
npm run test:db
```

### Ejecutar Tests por Categoría
```bash
# Tests unitarios
npm run test:db:unit

# Tests de integración
npm run test:db:integration

# Tests end-to-end
npm run test:db:e2e

# Tests de API
npm run test:db:api
```

### Ejecutar Tests Manuales
```bash
# Test de bulk create
node tests-organized/manual/test-bulk-create.js

# Test de sincronización
node tests-organized/manual/test-sync-investigation.js

# Test de cache invalidation
node tests-organized/manual/test-cache-invalidation-fix.js
```

## 🔧 Configuración

### Variables de Entorno Requeridas
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hnbtninlyzpdemyudaqg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Environment
NODE_ENV=development
```

### Archivos de Configuración
- `.env.test` - Variables de entorno para tests
- `tests/database-test.config.ts` - Configuración de Playwright para tests de DB

## 📊 Cobertura de Tests

### ✅ Funcionalidades Probadas
- [x] **Bulk Create Operations** - Creación múltiple de items
- [x] **Cache Invalidation** - Invalidación de cache después de operaciones
- [x] **Real-time Updates** - Actualizaciones en tiempo real
- [x] **Dashboard Synchronization** - Sincronización entre dashboard e inventario
- [x] **Database Operations** - Operaciones CRUD con base de datos
- [x] **API Endpoints** - Endpoints de API con autenticación
- [x] **Error Handling** - Manejo de errores y validaciones

### 🔄 Tests de Sincronización
- [x] **Inventory Status Updates** - Actualización de estado del inventario
- [x] **Dashboard Metrics** - Métricas del dashboard
- [x] **Cache Busting** - Bypass de cache del navegador
- [x] **Event System** - Sistema de eventos para sincronización

## 🛠️ Scripts de Utilidad

### Limpieza de Base de Datos
```bash
# Limpiar datos de test
npm run test:db:cleanup

# Verificar limpieza
npm run test:db:verify
```

### Debug y Desarrollo
```bash
# Test rápido (solo tests críticos)
npm run test:db:quick

# Test con logs detallados
npm run test:db:verbose
```

## 📝 Convenciones de Naming

### Archivos de Test
- **Unit Tests**: `[feature]-db.test.ts`
- **Integration Tests**: `[feature]-integration-db.test.ts`
- **E2E Tests**: `[feature]-e2e-db.test.ts`
- **API Tests**: `[feature]-api-db.test.ts`
- **Manual Tests**: `test-[feature].js`

### Datos de Test
- **SKUs**: `TEST-[TYPE]-[TIMESTAMP]`
- **Nombres**: `Test [Type] Item [Number]`
- **Categorías**: `%Test [Type]%`
- **Ubicaciones**: `%Test [Type]%`

## 🔍 Debugging

### Logs de Test
Los tests incluyen logging detallado para debugging:
- ✅ Operaciones exitosas
- ❌ Errores y fallos
- 🔄 Operaciones de limpieza
- 📊 Estadísticas de test

### Herramientas de Debug
- **Playwright Inspector**: Para tests E2E
- **Console Logs**: Para tests manuales
- **Database Queries**: Para verificar estado de DB

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. Tests Fallan por Credenciales
```bash
# Verificar variables de entorno
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

#### 2. Tests Fallan por Limpieza
```bash
# Limpiar manualmente
npm run test:db:cleanup
```

#### 3. Tests Fallan por Timeout
```bash
# Aumentar timeout en configuración
# tests/database-test.config.ts
```

## 📈 Métricas de Test

### Última Ejecución
- **Total Tests**: 15+
- **Success Rate**: 95%+
- **Coverage**: 90%+
- **Execution Time**: ~5 minutos

### Tests Críticos
1. **Bulk Create Operations** - ✅ Funcionando
2. **Cache Invalidation** - ✅ Funcionando
3. **Real-time Updates** - ✅ Funcionando
4. **Dashboard Sync** - ✅ Funcionando

## 🔄 Mantenimiento

### Actualización de Tests
1. Actualizar datos de test cuando cambie el esquema
2. Verificar que las credenciales estén actualizadas
3. Ejecutar tests después de cambios en la base de datos
4. Actualizar documentación cuando se agreguen nuevos tests

### Limpieza Regular
```bash
# Limpiar datos de test antiguos
npm run test:db:cleanup

# Verificar estado de la base de datos
npm run test:db:verify
```

---

## 📞 Soporte

Para problemas con los tests:
1. Verificar la documentación específica de cada test
2. Revisar los logs de ejecución
3. Verificar la configuración de variables de entorno
4. Contactar al equipo de desarrollo

**Última actualización**: 22 de Septiembre, 2025

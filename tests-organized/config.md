# ⚙️ Configuración de Tests Organizados

Este archivo contiene la configuración y documentación para los tests organizados del proyecto LUMO2.

## 🔧 Variables de Entorno

### Requeridas para Todos los Tests
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hnbtninlyzpdemyudaqg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Environment
NODE_ENV=development
```

### Opcionales
```bash
# Test Configuration
TEST_TIMEOUT=30000
TEST_RETRIES=2
TEST_WORKERS=1

# Debug Configuration
DEBUG_TESTS=true
VERBOSE_LOGGING=false
```

## 📁 Estructura de Archivos

```
tests-organized/
├── config.md              # Este archivo
├── README.md              # Documentación principal
├── unit/                  # Tests unitarios
│   ├── README.md
│   ├── bulk-operations-db.test.ts
│   └── simple-bulk-operations-db.test.ts
├── integration/           # Tests de integración
│   ├── README.md
│   └── bulk-operations-integration-db.test.ts
├── e2e/                   # Tests end-to-end
│   ├── README.md
│   ├── bulk-operations-e2e-db.test.ts
│   ├── inventory-status-update.test.ts
│   └── dashboard-inventory-sync.test.ts
├── api/                   # Tests de API
│   ├── README.md
│   ├── cache-invalidation-db.test.ts
│   └── inventory-status-api.test.ts
└── manual/                # Tests manuales
    ├── README.md
    ├── test-bulk-create.js
    ├── test-sync-investigation.js
    ├── test-cache-invalidation-fix.js
    └── [otros archivos de test manual]
```

## 🎯 Configuración de Playwright

### Archivo de Configuración
```typescript
// tests-organized/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './',
  timeout: 30000,
  retries: 2,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:3000',
    headless: false,
    slowMo: 1000,
  },
  projects: [
    {
      name: 'unit',
      testDir: './unit',
    },
    {
      name: 'integration',
      testDir: './integration',
    },
    {
      name: 'e2e',
      testDir: './e2e',
    },
    {
      name: 'api',
      testDir: './api',
    },
  ],
});
```

## 🔐 Seguridad

### Archivos Protegidos por .gitignore
- ✅ `.env*` - Variables de entorno
- ✅ `*supabase*` - Archivos de Supabase
- ✅ `*api-key*` - Claves de API
- ✅ `*service-role*` - Claves de servicio
- ✅ `*anon-key*` - Claves anónimas
- ✅ `*credentials*` - Archivos de credenciales
- ✅ `*keys*` - Archivos de claves
- ✅ `*connection-string*` - Cadenas de conexión
- ✅ `*db-url*` - URLs de base de datos

### Mejores Prácticas de Seguridad
1. **Nunca commitees** archivos con credenciales
2. **Usa variables de entorno** para configuración sensible
3. **Rota las claves** regularmente
4. **Usa diferentes credenciales** para desarrollo y producción
5. **Verifica el .gitignore** antes de hacer commit

## 🚀 Scripts de Ejecución

### Script Principal
```bash
# Ejecutar todos los tests
node scripts/run-organized-tests.js

# Ejecutar categoría específica
node scripts/run-organized-tests.js unit
node scripts/run-organized-tests.js integration
node scripts/run-organized-tests.js e2e
node scripts/run-organized-tests.js api
node scripts/run-organized-tests.js manual

# Ejecutar con opciones
node scripts/run-organized-tests.js all --quick
node scripts/run-organized-tests.js manual --verbose
node scripts/run-organized-tests.js unit --cleanup
```

### Scripts NPM
```bash
# Tests organizados
npm run test:organized
npm run test:organized:unit
npm run test:organized:integration
npm run test:organized:e2e
npm run test:organized:api
npm run test:organized:manual

# Tests con base de datos
npm run test:db
npm run test:db:unit
npm run test:db:integration
npm run test:db:e2e
npm run test:db:api

# Limpieza
npm run test:db:cleanup
npm run test:db:verify
```

## 📊 Datos de Test

### Convenciones de Naming
- **SKUs**: `TEST-[TYPE]-[TIMESTAMP]`
- **Nombres**: `Test [Type] Item [Number]`
- **Categorías**: `%Test [Type]%`
- **Ubicaciones**: `%Test [Type]%`

### Tipos de Test
- `UNIT` - Tests unitarios
- `INTEGRATION` - Tests de integración
- `E2E` - Tests end-to-end
- `API` - Tests de API
- `MANUAL` - Tests manuales

### Ejemplos
```javascript
// SKU de test unitario
const sku = `TEST-UNIT-${Date.now()}`;

// SKU de test de integración
const sku = `TEST-INTEGRATION-${Date.now()}`;

// SKU de test E2E
const sku = `TEST-E2E-${Date.now()}`;

// SKU de test de API
const sku = `TEST-API-${Date.now()}`;

// SKU de test manual
const sku = `TEST-MANUAL-${Date.now()}`;
```

## 🧹 Limpieza de Datos

### Limpieza Automática
- ✅ Tests unitarios - Limpieza automática
- ✅ Tests de integración - Limpieza automática
- ✅ Tests E2E - Limpieza automática
- ✅ Tests de API - Limpieza automática
- ⚠️ Tests manuales - Limpieza manual

### Patrones de Limpieza
```sql
-- Limpiar items de inventario
DELETE FROM inventory WHERE sku LIKE 'TEST-%';

-- Limpiar categorías de test
DELETE FROM categories WHERE name LIKE '%Test%';

-- Limpiar ubicaciones de test
DELETE FROM locations WHERE name LIKE '%Test%';

-- Limpiar logs de auditoría de test
DELETE FROM audit_logs WHERE table_name = 'inventory' 
  AND (new_values->>'sku' LIKE 'TEST-%' OR old_values->>'sku' LIKE 'TEST-%');
```

## 🔍 Debugging

### Logs de Test
```javascript
// Habilitar logs detallados
const DEBUG = process.env.DEBUG_TESTS === 'true';

if (DEBUG) {
  console.log('🔍 Debug info:', data);
}
```

### Herramientas de Debug
- **Playwright Inspector**: Para tests E2E
- **Console Logs**: Para tests manuales
- **Database Queries**: Para verificar estado de DB
- **Network Tab**: Para verificar requests HTTP

## 📈 Métricas

### Cobertura de Test
- **Unit Tests**: 90%+
- **Integration Tests**: 85%+
- **E2E Tests**: 80%+
- **API Tests**: 95%+

### Tiempos de Ejecución
- **Unit Tests**: ~30 segundos
- **Integration Tests**: ~60 segundos
- **E2E Tests**: ~120 segundos
- **API Tests**: ~45 segundos
- **Manual Tests**: Variable

## 🔄 Mantenimiento

### Actualización Regular
1. **Actualizar credenciales** cuando cambien
2. **Verificar selectores** si cambia la UI
3. **Ajustar timeouts** según la velocidad de la app
4. **Actualizar datos de test** según el esquema de DB
5. **Revisar logs** para identificar problemas

### Checklist de Mantenimiento
- [ ] Variables de entorno actualizadas
- [ ] Selectores de UI funcionando
- [ ] Timeouts apropiados
- [ ] Datos de test válidos
- [ ] Limpieza funcionando
- [ ] Logs sin errores
- [ ] Documentación actualizada

---

**Última actualización**: 22 de Septiembre, 2025

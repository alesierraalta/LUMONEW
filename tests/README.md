# Tests de Base de Datos - Sistema de Inventario

Este directorio contiene tests completos que interactúan con la base de datos real de Supabase, simulando el uso real de las funcionalidades del sistema de inventario.

## 📁 Estructura de Tests

```
tests/
├── unit/                    # Tests unitarios con base de datos
│   └── inventory-service-db.test.ts
├── integration/             # Tests de integración
│   └── inventory-integration.test.ts
├── api/                     # Tests de API con base de datos
│   └── inventory-api-db.test.ts
├── e2e/                     # Tests end-to-end
│   └── inventory-e2e-db.test.ts
├── helpers/                 # Utilidades y helpers
│   ├── database-cleanup.ts
│   ├── database-fixtures.ts
│   ├── global-setup.ts
│   └── global-teardown.ts
├── database-test.config.ts  # Configuración específica
└── README.md               # Este archivo
```

## 🚀 Ejecución de Tests

### Ejecutar Todos los Tests

```bash
# Ejecutar todos los tests de base de datos
node scripts/run-database-tests.js

# O usando Playwright directamente
npx playwright test --config=tests/database-test.config.ts
```

### Ejecutar Tests Específicos

```bash
# Tests unitarios
node scripts/run-database-tests.js unit

# Tests de integración
node scripts/run-database-tests.js integration

# Tests de API
node scripts/run-database-tests.js api

# Tests E2E
node scripts/run-database-tests.js e2e
```

### Limpieza de Base de Datos

```bash
# Solo limpiar datos de prueba
node scripts/run-database-tests.js cleanup
```

## 🧪 Tipos de Tests

### 1. Tests Unitarios (`unit/`)
- **Propósito**: Probar funciones individuales del servicio de inventario
- **Base de datos**: Usa base de datos real para operaciones CRUD
- **Limpieza**: Automática después de cada test
- **Ejemplos**: Crear, actualizar, eliminar items de inventario

### 2. Tests de Integración (`integration/`)
- **Propósito**: Probar flujos completos de operaciones
- **Base de datos**: Simula operaciones reales del sistema
- **Limpieza**: Automática después de cada test
- **Ejemplos**: Ciclo completo de vida de un item, operaciones en lote

### 3. Tests de API (`api/`)
- **Propósito**: Probar endpoints de API con verificación de base de datos
- **Base de datos**: Verifica que las operaciones API se reflejen en la BD
- **Limpieza**: Automática después de cada test
- **Ejemplos**: Crear items via API, subir imágenes, manejo de errores

### 4. Tests E2E (`e2e/`)
- **Propósito**: Probar flujos completos desde la interfaz de usuario
- **Base de datos**: Verifica que las acciones UI se reflejen en la BD
- **Limpieza**: Automática después de cada test
- **Ejemplos**: Crear item desde UI, editar, eliminar, búsquedas

## 🔧 Configuración

### Variables de Entorno Requeridas

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Aplicación
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Configuración de Tests

Los tests usan la configuración en `tests/database-test.config.ts`:

- **Timeout**: 60 segundos para tests de base de datos
- **Workers**: 1 (secuencial para evitar conflictos)
- **Retry**: 2 reintentos para tests fallidos
- **Reporter**: HTML, JSON y línea de comandos

## 🧹 Sistema de Limpieza

### Limpieza Automática

El sistema incluye limpieza automática que:

1. **Antes de cada test**: Limpia datos de prueba existentes
2. **Después de cada test**: Elimina datos creados durante el test
3. **Al final**: Verifica que no queden datos de prueba

### Patrones de Limpieza

Los tests usan patrones específicos para identificar datos de prueba:

- **SKUs**: `TEST-UNIT-*`, `TEST-INTEGRATION-*`, `TEST-API-*`, `TEST-E2E-*`
- **Categorías**: Nombres que contienen "Test Unit", "Test Integration", etc.
- **Ubicaciones**: Nombres que contienen "Test Unit", "Test Integration", etc.
- **Logs de auditoría**: Registros relacionados con datos de prueba

### Verificación de Limpieza

```typescript
// Verificar que la base de datos está limpia
const isClean = await databaseCleanup.verifyCleanup();
expect(isClean).toBe(true);
```

## 📊 Monitoreo y Estadísticas

### Estadísticas de Base de Datos

```typescript
// Obtener estadísticas actuales
const stats = await getDatabaseStats();
console.log('Database stats:', stats);
// Output: { inventory: 150, categories: 5, locations: 3, auditLogs: 1200 }
```

### Logs de Tests

Los tests generan logs detallados:

- ✅ **Éxito**: Operaciones completadas correctamente
- ❌ **Error**: Fallos con detalles del error
- ⚠️ **Advertencia**: Problemas no críticos
- ℹ️ **Info**: Información de progreso

## 🔍 Debugging

### Ver Datos de Prueba

```typescript
// En un test, verificar datos creados
const { data: items } = await supabase
  .from('inventory')
  .select('*')
  .like('sku', 'TEST-%');

console.log('Test items:', items);
```

### Ver Logs de Auditoría

```typescript
// Ver logs de auditoría de un test
const { data: logs } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('table_name', 'inventory')
  .order('created_at', { ascending: false })
  .limit(10);

console.log('Recent audit logs:', logs);
```

### Screenshots y Videos

Los tests E2E generan automáticamente:

- **Screenshots**: Solo en caso de fallo
- **Videos**: Solo en caso de fallo
- **Traces**: Para debugging detallado

## 🚨 Consideraciones Importantes

### Seguridad

- ⚠️ **NUNCA** ejecutar tests en base de datos de producción
- ✅ Usar siempre base de datos de desarrollo/staging
- ✅ Verificar variables de entorno antes de ejecutar

### Rendimiento

- Los tests de base de datos son más lentos que tests unitarios
- Se ejecutan secuencialmente para evitar conflictos
- Incluyen timeouts generosos para operaciones de BD

### Datos de Prueba

- Todos los datos de prueba se identifican con patrones específicos
- La limpieza es automática pero se puede ejecutar manualmente
- Los tests no afectan datos de producción

## 📝 Ejemplos de Uso

### Test Unitario Básico

```typescript
test('should create inventory item', async ({ supabase, testData }) => {
  const item = await createTestInventoryItem(testData, {
    sku: `TEST-${testData.timestamp}`,
    name: 'Test Item'
  });

  expect(item.sku).toBe(`TEST-${testData.timestamp}`);
  expect(item.name).toBe('Test Item');
});
```

### Test de API con Verificación

```typescript
test('should create item via API', async ({ request, testData }) => {
  const response = await request.post('/api/inventory/items', {
    data: {
      sku: `TEST-API-${testData.timestamp}`,
      name: 'API Test Item',
      category_id: testData.category.id,
      location_id: testData.location.id,
      quantity: 10,
      unit_price: 99.99
    }
  });

  expect(response.status()).toBe(201);
  
  // Verificar en base de datos
  const item = await verifyItemExists(`TEST-API-${testData.timestamp}`);
  expect(item.name).toBe('API Test Item');
});
```

### Test E2E Completo

```typescript
test('should create item from UI', async ({ page, testData }) => {
  await page.goto('/inventory/create');
  
  await page.getByRole('textbox', { name: 'SKU *' }).fill(`TEST-E2E-${testData.timestamp}`);
  await page.getByRole('textbox', { name: 'Nombre del Producto *' }).fill('E2E Test Item');
  
  await page.getByRole('button', { name: 'Crear Item' }).click();
  await page.waitForURL('/inventory');
  
  await expect(page.getByText('E2E Test Item')).toBeVisible();
  
  // Verificar en base de datos
  const item = await verifyItemExists(`TEST-E2E-${testData.timestamp}`);
  expect(item.name).toBe('E2E Test Item');
});
```

## 🤝 Contribución

Al agregar nuevos tests:

1. **Usar patrones de nomenclatura**: `TEST-TIPO-*` para SKUs
2. **Incluir limpieza**: Usar helpers de limpieza automática
3. **Verificar base de datos**: Siempre verificar operaciones en BD
4. **Documentar**: Agregar comentarios explicativos
5. **Probar**: Ejecutar tests localmente antes de commit

## 📞 Soporte

Para problemas con los tests:

1. Verificar variables de entorno
2. Ejecutar limpieza manual: `node scripts/run-database-tests.js cleanup`
3. Revisar logs de tests para errores específicos
4. Verificar conectividad con Supabase
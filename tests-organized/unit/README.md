# 🔬 Unit Tests - Base de Datos

Esta carpeta contiene tests unitarios que interactúan directamente con la base de datos Supabase.

## 📁 Archivos

### `bulk-operations-db.test.ts`
- **Propósito**: Probar operaciones bulk (crear, actualizar, eliminar) directamente en la base de datos
- **Funcionalidades**:
  - ✅ Creación múltiple de items
  - ✅ Actualización masiva de items
  - ✅ Eliminación masiva de items
  - ✅ Validación de datos
  - ✅ Logging de auditoría

### `simple-bulk-operations-db.test.ts`
- **Propósito**: Tests simplificados para operaciones bulk básicas
- **Funcionalidades**:
  - ✅ Creación de items individuales
  - ✅ Validación de errores
  - ✅ Limpieza de datos

## 🚀 Cómo Ejecutar

```bash
# Ejecutar todos los tests unitarios
npm run test:db:unit

# Ejecutar test específico
npx playwright test tests-organized/unit/bulk-operations-db.test.ts

# Ejecutar con logs detallados
npx playwright test tests-organized/unit/bulk-operations-db.test.ts --reporter=line
```

## 🔧 Configuración

### Variables de Entorno Requeridas
```bash
NEXT_PUBLIC_SUPABASE_URL=https://hnbtninlyzpdemyudaqg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Datos de Test
- **SKUs**: `TEST-UNIT-[TIMESTAMP]`
- **Nombres**: `Test Unit Item [Number]`
- **Categorías**: `%Test Unit%`
- **Ubicaciones**: `%Test Unit%`

## 📊 Cobertura

### ✅ Funcionalidades Probadas
- [x] **Bulk Create** - Creación múltiple de items
- [x] **Bulk Update** - Actualización masiva
- [x] **Bulk Delete** - Eliminación masiva
- [x] **Data Validation** - Validación de datos
- [x] **Error Handling** - Manejo de errores
- [x] **Audit Logging** - Logging de auditoría

### 🔄 Limpieza Automática
- ✅ Eliminación de datos de test
- ✅ Limpieza de logs de auditoría
- ✅ Verificación de limpieza

## 🛠️ Estructura de Test

```typescript
describe('Bulk Operations Unit Tests', () => {
  beforeEach(async () => {
    // Setup: Limpiar datos anteriores
  });

  afterEach(async () => {
    // Cleanup: Eliminar datos de test
  });

  test('should create multiple items', async () => {
    // Test: Crear múltiples items
  });

  test('should handle validation errors', async () => {
    // Test: Manejar errores de validación
  });
});
```

## 🔍 Debugging

### Logs Disponibles
- ✅ Operaciones exitosas
- ❌ Errores de validación
- 🔄 Operaciones de limpieza
- 📊 Estadísticas de test

### Verificación Manual
```bash
# Verificar datos en la base de datos
SELECT * FROM inventory WHERE sku LIKE 'TEST-UNIT-%';

# Verificar logs de auditoría
SELECT * FROM audit_logs WHERE table_name = 'inventory' ORDER BY created_at DESC;
```

## ⚠️ Consideraciones

### Limitaciones
- Tests requieren conexión a Supabase
- Datos de test se crean en la base de datos real
- Limpieza automática después de cada test

### Mejores Prácticas
- Usar SKUs únicos con timestamp
- Limpiar datos después de cada test
- Verificar que la limpieza fue exitosa
- Usar transacciones cuando sea posible

---

**Última actualización**: 22 de Septiembre, 2025

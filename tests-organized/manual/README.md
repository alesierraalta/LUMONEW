# 🖱️ Manual Tests - Scripts de Debug

Esta carpeta contiene tests manuales y scripts de debug para verificar funcionalidades específicas.

## 📁 Archivos

### Tests de Bulk Create
- **`test-bulk-create.js`** - Test básico de creación bulk
- **`test-multiple-items-bulk.js`** - Test de múltiples items
- **`test-bulk-api-direct.js`** - Test directo de API bulk
- **`test-bulk-debug-specific.js`** - Debug específico de bulk
- **`test-validation-debug.js`** - Debug de validación
- **`test-button-click-fix.js`** - Test de fix de botón
- **`test-simple-bulk.js`** - Test simplificado de bulk

### Tests de Sincronización
- **`test-sync-investigation.js`** - Investigación de sincronización
- **`test-dashboard-sync-fix.js`** - Fix de sincronización del dashboard
- **`test-cache-invalidation-fix.js`** - Fix de invalidación de cache
- **`test-realtime-bulk-update.js`** - Test de actualización en tiempo real
- **`test-realtime-bulk-fixed.js`** - Test corregido de tiempo real
- **`test-manual-bulk-verification.js`** - Verificación manual de bulk

### Tests de Estado del Inventario
- **`test-inventory-status-fix.js`** - Fix de estado del inventario
- **`test-inventory-status-with-auth.js`** - Estado con autenticación
- **`test-inventory-status-simple.js`** - Estado simplificado
- **`test-final-validation.js`** - Validación final
- **`test-two-items-final.js`** - Test final de dos items

### Tests de Debug
- **`test-frontend-debug.js`** - Debug del frontend
- **`test-bulk-debug-specific.js`** - Debug específico
- **`test-validation-debug.js`** - Debug de validación
- **`test-button-click-fix.js`** - Fix de click de botón

## 🚀 Cómo Ejecutar

### Tests Básicos
```bash
# Test de bulk create básico
node tests-organized/manual/test-bulk-create.js

# Test de múltiples items
node tests-organized/manual/test-multiple-items-bulk.js

# Test de API directa
node tests-organized/manual/test-bulk-api-direct.js
```

### Tests de Sincronización
```bash
# Test de sincronización
node tests-organized/manual/test-sync-investigation.js

# Test de cache invalidation
node tests-organized/manual/test-cache-invalidation-fix.js

# Test de tiempo real
node tests-organized/manual/test-realtime-bulk-update.js
```

### Tests de Debug
```bash
# Debug del frontend
node tests-organized/manual/test-frontend-debug.js

# Debug de validación
node tests-organized/manual/test-validation-debug.js

# Debug específico
node tests-organized/manual/test-bulk-debug-specific.js
```

## 🔧 Configuración

### Variables de Entorno
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hnbtninlyzpdemyudaqg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Credenciales de prueba
TEST_EMAIL=alesierraalta@gmail.com
TEST_PASSWORD=admin123
```

### Requisitos
- ✅ Servidor de desarrollo ejecutándose en `http://localhost:3000`
- ✅ Navegador Chrome/Chromium instalado
- ✅ Playwright instalado
- ✅ Variables de entorno configuradas

## 📊 Tipos de Tests

### 🔬 Tests Automatizados
- **Propósito**: Verificar funcionalidad automáticamente
- **Duración**: 30-60 segundos
- **Interacción**: Automática con el navegador
- **Resultado**: Logs detallados en consola

### 🖱️ Tests Manuales
- **Propósito**: Verificar funcionalidad manualmente
- **Duración**: 60+ segundos
- **Interacción**: Requiere intervención manual
- **Resultado**: Instrucciones paso a paso

### 🐛 Tests de Debug
- **Propósito**: Identificar problemas específicos
- **Duración**: Variable
- **Interacción**: Logs detallados y debugging
- **Resultado**: Información de diagnóstico

## 🎯 Casos de Uso

### 1. Verificar Bulk Create
```bash
node tests-organized/manual/test-bulk-create.js
```
- Abre el navegador
- Navega a la página de inventario
- Abre el modal de bulk create
- Crea items y verifica el resultado

### 2. Debug de Sincronización
```bash
node tests-organized/manual/test-sync-investigation.js
```
- Verifica sincronización entre dashboard e inventario
- Identifica discrepancias en contadores
- Proporciona análisis detallado

### 3. Test de Cache Invalidation
```bash
node tests-organized/manual/test-cache-invalidation-fix.js
```
- Verifica que el cache se invalida correctamente
- Prueba actualizaciones en tiempo real
- Confirma sincronización de datos

## 🔍 Interpretación de Resultados

### ✅ Éxito
```
🎉 SUCCESS: 2 items were created!
✅ Multiple items bulk create is working!
✅ The fix has been successfully implemented!
```

### ⚠️ Parcial
```
⚠️ PARTIAL SUCCESS
Only 1 item was created instead of 2.
```

### ❌ Fallo
```
❌ FAILURE
No items were created.
```

### 🔍 Debug
```
🔍 DEBUG LOGS:
[log] handleSubmit called
[log] Validating items: [Object, Object]
[log] Validation result: {hasErrors: false, updatedItems: Array(2)}
```

## 🛠️ Troubleshooting

### Problemas Comunes

#### 1. Servidor No Ejecutándose
```bash
# Verificar que el servidor esté ejecutándose
netstat -ano | findstr :3000

# Iniciar servidor si es necesario
npm run dev
```

#### 2. Credenciales Incorrectas
```bash
# Verificar variables de entorno
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

#### 3. Navegador No Abre
```bash
# Instalar Playwright
npx playwright install

# Verificar instalación
npx playwright --version
```

### Logs de Debug
Los tests incluyen logs detallados:
- 🔧 Configuración inicial
- 🔍 Estado de la aplicación
- ✅ Operaciones exitosas
- ❌ Errores y fallos
- 📊 Análisis de resultados

## 📝 Mejores Prácticas

### Para Tests Manuales
1. **Seguir las instrucciones** paso a paso
2. **Observar el comportamiento** del navegador
3. **Verificar los logs** en la consola
4. **Reportar problemas** con detalles específicos

### Para Tests de Debug
1. **Revisar todos los logs** generados
2. **Identificar patrones** en los errores
3. **Verificar configuración** de variables de entorno
4. **Documentar hallazgos** para futuras referencias

## 🔄 Mantenimiento

### Actualización de Tests
- Actualizar credenciales cuando cambien
- Modificar selectores si cambia la UI
- Ajustar timeouts según la velocidad de la aplicación
- Actualizar datos de test según el esquema de DB

### Limpieza
- Los tests manuales no limpian automáticamente
- Limpiar datos de test manualmente si es necesario
- Verificar que no queden datos de test en producción

---

**Última actualización**: 22 de Septiembre, 2025

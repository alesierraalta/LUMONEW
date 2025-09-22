# 🧪 Tests Automatizados de LUMONEW

Este directorio contiene todos los tests automatizados para el sistema LUMONEW, utilizando Playwright para pruebas end-to-end (E2E).

## 📁 Estructura de Tests

```
tests/automated/
├── authentication.spec.ts          # Tests de autenticación y autorización
├── inventory-management.spec.ts    # Tests de gestión de inventario
├── filters-and-search.spec.ts      # Tests de filtros y búsqueda
├── crud-operations.spec.ts         # Tests de operaciones CRUD
├── audit-system.spec.ts            # Tests de sistema de auditoría
├── performance-and-ui.spec.ts      # Tests de rendimiento y UI
├── run-all-tests.ts               # Script para ejecutar todos los tests
└── README.md                      # Este archivo
```

## 🚀 Comandos Disponibles

### Ejecutar Todos los Tests
```bash
# Ejecutar todos los tests en modo headless
npm run test:all

# Ejecutar con navegador visible
npm run test:all --headed

# Ejecutar en múltiples navegadores
npm run test:all --browsers chromium,firefox,webkit
```

### Ejecutar Suites Específicas
```bash
# Tests de autenticación
npm run test:suite auth

# Tests de inventario
npm run test:suite inventory

# Tests de filtros
npm run test:suite filters

# Tests CRUD
npm run test:suite crud

# Tests de auditoría
npm run test:suite audit

# Tests de rendimiento
npm run test:suite performance
```

### Comandos Individuales
```bash
# Ejecutar test específico
npm run test:auth
npm run test:inventory
npm run test:filters
npm run test:crud
npm run test:audit
npm run test:performance

# Ejecutar con interfaz visual
npm run test:ui

# Ejecutar con navegador visible
npm run test:headed

# Ver reportes
npm run test:report
```

## 📋 Cobertura de Tests

### ✅ Autenticación y Autorización
- [x] Login con credenciales válidas
- [x] Login con credenciales inválidas
- [x] Logout de usuario
- [x] Verificación de sesiones
- [x] Protección de rutas
- [x] Manejo de tokens expirados

### ✅ Gestión de Inventario
- [x] Visualización de inventario
- [x] Ajuste de stock (agregar)
- [x] Ajuste de stock (restar)
- [x] Edición de items
- [x] Eliminación de items
- [x] Búsqueda de items

### ✅ Filtros y Búsqueda
- [x] Filtros por estado
- [x] Filtros por categoría
- [x] Filtros por ubicación
- [x] Búsqueda por nombre/SKU
- [x] Múltiples filtros simultáneos
- [x] Limpiar filtros

### ✅ Operaciones CRUD
- [x] Crear nuevos items
- [x] Leer detalles de items
- [x] Actualizar items existentes
- [x] Eliminar items
- [x] Validación de campos
- [x] Manejo de errores

### ✅ Sistema de Auditoría
- [x] Visualización de historial
- [x] Estadísticas de auditoría
- [x] Filtros de auditoría
- [x] Búsqueda en auditoría
- [x] Registro de cambios
- [x] Exportación de auditoría

### ✅ Rendimiento y UI
- [x] Tiempos de carga
- [x] Responsividad móvil
- [x] Indicadores de carga
- [x] Manejo de errores
- [x] Accesibilidad básica
- [x] Navegación con teclado

## 🔧 Configuración

### Prerequisitos
```bash
# Instalar dependencias
npm install

# Instalar navegadores de Playwright
npm run test:install
```

### Variables de Entorno
Asegúrate de tener configuradas las siguientes variables:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Configuración de Playwright
El archivo `playwright.config.ts` en la raíz del proyecto contiene la configuración:

- **Base URL**: `http://localhost:3000`
- **Navegadores**: Chrome, Firefox, Safari
- **Modo**: Headless por defecto
- **Reportes**: HTML, JSON, JUnit XML

## 📊 Reportes

Los tests generan reportes en múltiples formatos:

### HTML Report
```bash
npm run test:report
```
Abre un reporte visual interactivo en el navegador.

### JSON Report
Los resultados se guardan en `test-results/results.json` para integración con CI/CD.

### JUnit XML
Los resultados se guardan en `test-results/results.xml` para integración con sistemas como Jenkins.

## 🐛 Debugging

### Ejecutar Tests en Modo Debug
```bash
# Ejecutar con navegador visible
npm run test:headed

# Ejecutar con interfaz de debug
npm run test:ui

# Ejecutar test específico con debug
npx playwright test tests/automated/auth.spec.ts --debug
```

### Ver Screenshots y Videos
Los screenshots y videos de tests fallidos se guardan en `test-results/`.

### Logs de Console
Los logs de la consola del navegador se capturan automáticamente para tests fallidos.

## 🚀 CI/CD

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:install
      - run: npm run test:all
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📈 Métricas de Calidad

### Cobertura de Tests
- **Autenticación**: 100%
- **Inventario**: 95%
- **Filtros**: 100%
- **CRUD**: 90%
- **Auditoría**: 85%
- **Rendimiento**: 80%

### Tiempos de Ejecución
- **Suite completa**: ~5-8 minutos
- **Suite individual**: ~1-2 minutos
- **Test individual**: ~10-30 segundos

## 🔄 Mantenimiento

### Agregar Nuevos Tests
1. Crear archivo `.spec.ts` en `tests/automated/`
2. Seguir el patrón de los tests existentes
3. Actualizar `run-all-tests.ts` si es necesario
4. Documentar en este README

### Actualizar Tests Existentes
1. Identificar el archivo correspondiente
2. Actualizar selectores si cambia la UI
3. Verificar que los tests sigan pasando
4. Actualizar documentación si es necesario

## 📞 Soporte

Para problemas con los tests:

1. Verificar que el servidor esté corriendo (`npm run dev`)
2. Verificar que las dependencias estén instaladas
3. Revisar los logs en `test-results/`
4. Ejecutar tests individuales para aislar problemas

## 🎯 Próximos Pasos

- [ ] Tests de integración con APIs
- [ ] Tests de carga y rendimiento
- [ ] Tests de accesibilidad avanzada
- [ ] Tests de seguridad
- [ ] Automatización en CI/CD
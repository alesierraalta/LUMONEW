# 🚀 GitHub Workflow - Guía Rápida

## ⚠️ IMPORTANTE: Flujo Correcto

### 🎯 Regla de Oro:
- **`main`** = Solo PRODUCCIÓN (NO trabajar aquí)
- **`dev`** = DESARROLLO ACTIVO (trabajar aquí)
- **`feature/*`** = NUEVAS FUNCIONALIDADES

### 📋 Flujo Diario:

```bash
# 1. Empezar desde dev
git checkout dev
git pull origin dev

# 2. Crear feature branch
git checkout -b feature/mi-feature

# 3. Hacer cambios y commitear
git add .
git commit -m "feat: mi cambio"

# 4. Push feature branch
git push origin feature/mi-feature

# 5. Crear PR en GitHub: feature/mi-feature → dev
# 6. Después del merge, crear PR: dev → main
```

### 🚫 NUNCA hacer:
- ❌ Trabajar directamente en `main`
- ❌ Crear PRs de feature a `main`
- ❌ Hacer commits directos a `main`

### ✅ SIEMPRE hacer:
- ✅ Trabajar en `dev` o ramas feature desde `dev`
- ✅ Crear PRs primero a `dev`
- ✅ Crear PRs de `dev` a `main` para producción

## 🛠️ Configuración Manual de GitHub:

1. Ve a: https://github.com/alesierraalta/LUMONEW/settings/branches
2. Agrega regla para rama `main`:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ❌ Allow force pushes
3. Agrega regla para rama `dev`:
   - ❌ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Allow force pushes

## 🎯 Estado Actual:
- ✅ Estás en rama `dev` (correcto)
- ✅ Scripts de configuración creados
- ⚠️ Configurar protección de ramas en GitHub (manual)

¡Ahora el flujo está corregido! 🎉
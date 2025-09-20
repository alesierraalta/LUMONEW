# 🔧 Flujo Correcto de GitHub - Dev/Prod

## ⚠️ Problema Identificado
Estabas trabajando directamente en la rama `main`, lo cual **NO es correcto** para el flujo de desarrollo que implementamos.

## ✅ Flujo Correcto

### 🎯 Conceptos Clave:
- **`main`** = Solo para PRODUCCIÓN (deployments automáticos)
- **`dev`** = Para DESARROLLO ACTIVO
- **`feature/*`** = Para nuevas funcionalidades

### 📋 Flujo Diario de Desarrollo:

#### 1. **Empezar el día** (SIEMPRE desde dev):
```bash
git checkout dev
git pull origin dev
```

#### 2. **Crear rama de feature** (desde dev):
```bash
git checkout -b feature/nombre-de-tu-feature
```

#### 3. **Hacer cambios y commitear**:
```bash
git add .
git commit -m "feat: descripción de cambios"
```

#### 4. **Push de la rama feature**:
```bash
git push origin feature/nombre-de-tu-feature
```

#### 5. **Crear PR a DEV** (NO a main!):
- Ir a GitHub
- Crear Pull Request: `feature/nombre-de-tu-feature` → `dev`
- Esperar aprobación y merge

#### 6. **Después del merge a dev, crear PR a MAIN**:
- Crear Pull Request: `dev` → `main`
- Esto activará el deployment a producción

## 🚫 Lo que NO debes hacer:

❌ **NUNCA trabajar directamente en `main`**
❌ **NUNCA hacer commits directos a `main`**
❌ **NUNCA crear PRs de feature branches a `main`**

## ✅ Lo que SÍ debes hacer:

✅ **SIEMPRE trabajar en `dev` o ramas feature desde `dev`**
✅ **SIEMPRE crear PRs primero a `dev`**
✅ **SIEMPRE crear PRs de `dev` a `main` para producción**

## 🛡️ Reglas de Protección de Rama:

### Rama `main` (Producción):
- ✅ Requiere Pull Request antes de merge
- ✅ Requiere 1 aprobación mínima
- ✅ Requiere que los checks pasen
- ✅ Requiere ramas actualizadas
- ❌ NO permite push directo
- ❌ NO permite force push

### Rama `dev` (Desarrollo):
- ❌ NO requiere Pull Request (para desarrollo rápido)
- ✅ Requiere que los checks básicos pasen
- ✅ Permite force push (para rebase)
- ❌ NO permite eliminación

## 🔄 Ejemplo Práctico:

```bash
# 1. Empezar desde dev
git checkout dev
git pull origin dev

# 2. Crear feature branch
git checkout -b feature/implementar-testing

# 3. Hacer cambios
# ... editar archivos ...

# 4. Commit y push
git add .
git commit -m "feat: implementar framework de testing"
git push origin feature/implementar-testing

# 5. Crear PR en GitHub: feature/implementar-testing → dev
# 6. Después del merge, crear PR: dev → main
```

## 🎯 Beneficios de este Flujo:

1. **Separación clara** entre desarrollo y producción
2. **Testing automático** en ambiente de desarrollo
3. **Deployments controlados** a producción
4. **Historial limpio** en main
5. **Rollback fácil** si hay problemas
6. **Colaboración mejorada** con reviews

## 🚨 Si ya trabajaste en main:

Si ya hiciste commits directamente a `main`, puedes corregirlo:

```bash
# 1. Mover los commits a dev
git checkout dev
git cherry-pick <commit-hash>
git push origin dev

# 2. Crear PR de dev a main
# 3. En el futuro, trabajar solo en dev
```

## 📊 Estados de las Ramas:

| Rama | Propósito | Protección | Push Directo | PR Requerido |
|------|-----------|------------|--------------|--------------|
| `main` | Producción | Estricta | ❌ No | ✅ Sí |
| `dev` | Desarrollo | Moderada | ✅ Sí | ❌ No |
| `feature/*` | Features | Ninguna | ✅ Sí | ✅ Sí |

## 🎉 Resumen:

**Para desarrollo normal:**
1. Trabaja en `dev` o ramas feature desde `dev`
2. Crea PRs a `dev` primero
3. Después crea PR de `dev` a `main` para producción

**Para producción:**
- Solo a través de PRs de `dev` a `main`
- Con todas las aprobaciones y checks
- Deployment automático a producción

¡Ahora el flujo está correctamente configurado! 🚀
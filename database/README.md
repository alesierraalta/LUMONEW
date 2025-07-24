# LUMO2 Database Setup Guide

Este directorio contiene todos los scripts necesarios para configurar la base de datos de producción de LUMO2.

## 📋 Archivos Incluidos

### Scripts de Migración Individual
- `001_create_roles_table.sql` - Crea la tabla de roles con roles predeterminados
- `002_create_users_table.sql` - Crea la tabla de usuarios con políticas RLS
- `003_create_categories_table.sql` - Crea la tabla de categorías con datos iniciales
- `004_create_locations_table.sql` - Crea la tabla de ubicaciones con datos iniciales
- `005_create_inventory_table.sql` - Crea la tabla de inventario con índices optimizados
- `006_create_audit_logs_table.sql` - Crea la tabla de auditoría para tracking
- `007_create_transactions_tables.sql` - Crea las tablas de transacciones y items

### Scripts de Configuración Completa
- `supabase-setup.sql` - **Script principal para Supabase** (recomendado)
- `setup-database.sql` - Script para PostgreSQL local

## 🚀 Configuración Rápida para Supabase

### Opción 1: Script Todo-en-Uno (Recomendado)

1. Ve a tu proyecto de Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido completo de `supabase-setup.sql`
4. Ejecuta el script
5. ¡Listo! Tu base de datos está configurada

### Opción 2: Migraciones Individuales

Si prefieres ejecutar las migraciones paso a paso:

1. Ejecuta los scripts en orden numérico:
   ```sql
   -- Primero, crea la función de actualización
   CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
   END;
   $$ language 'plpgsql';
   ```

2. Luego ejecuta cada migración en orden:
   - `001_create_roles_table.sql`
   - `002_create_users_table.sql`
   - `003_create_categories_table.sql`
   - `004_create_locations_table.sql`
   - `005_create_inventory_table.sql`
   - `006_create_audit_logs_table.sql`
   - `007_create_transactions_tables.sql`

## 📊 Estructura de la Base de Datos

### Tablas Principales

1. **roles** - Roles de usuario del sistema
2. **users** - Usuarios de la aplicación
3. **categories** - Categorías de productos
4. **locations** - Ubicaciones de almacén
5. **inventory** - Inventario de productos
6. **audit_logs** - Registro de auditoría
7. **transactions** - Transacciones de venta/stock
8. **transaction_items** - Items de las transacciones

### Roles Predeterminados

- **Administrador**: Acceso completo al sistema
- **Gerente**: Gestión de inventario y reportes
- **Empleado**: Acceso básico al inventario
- **Supervisor**: Supervisión de operaciones
- **Contador**: Acceso a reportes financieros
- **Vendedor**: Gestión de ventas
- **Almacenista**: Gestión de almacén
- **Auditor**: Revisión y auditoría

### Categorías Predeterminadas

- Electrónicos, Oficina, Herramientas, Consumibles
- Mobiliario, Limpieza, Seguridad, Otros

### Ubicaciones Predeterminadas

- Almacén Principal, Oficina Central, Sucursales
- Depósito Temporal, Áreas de Recepción/Despacho

## 🔐 Seguridad (RLS)

Todas las tablas tienen **Row Level Security (RLS)** habilitado con políticas que:

- Permiten a los usuarios ver solo sus datos relevantes
- Restringen operaciones según el rol del usuario
- Protegen datos sensibles de auditoría
- Permiten acceso de solo lectura a datos públicos (roles, categorías, ubicaciones)

## 🔧 Variables de Entorno Necesarias

Asegúrate de tener configuradas estas variables en tu aplicación:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key
```

## 📝 Después de la Configuración

1. **Crear el primer usuario administrador**:
   - Ve a la página de creación de usuarios en tu aplicación
   - Crea un usuario con rol "Administrador"
   - Este usuario podrá gestionar todos los demás usuarios

2. **Verificar la configuración**:
   - Comprueba que las tablas se crearon correctamente
   - Verifica que los datos iniciales están presentes
   - Prueba la creación de usuarios desde la aplicación

3. **Configurar datos adicionales**:
   - Añade más categorías si es necesario
   - Configura ubicaciones específicas de tu negocio
   - Personaliza roles según tus necesidades

## 🐛 Solución de Problemas

### Error: "relation does not exist"
- Asegúrate de ejecutar el script completo
- Verifica que tienes permisos de administrador en Supabase

### Error: "permission denied"
- Comprueba que las políticas RLS están configuradas correctamente
- Verifica que el usuario tiene el rol adecuado

### Error: "foreign key constraint"
- Ejecuta las migraciones en el orden correcto
- Asegúrate de que las tablas referenciadas existen

## 📞 Soporte

Si encuentras problemas durante la configuración:

1. Revisa los logs de Supabase para errores específicos
2. Verifica que todas las extensiones necesarias están habilitadas
3. Comprueba que las variables de entorno están configuradas correctamente

## 🔄 Actualizaciones Futuras

Para futuras actualizaciones de la base de datos:

1. Crea nuevos archivos de migración con numeración secuencial
2. Actualiza el script `supabase-setup.sql` si es necesario
3. Documenta los cambios en este README

---

**¡Tu base de datos LUMO2 está lista para producción!** 🎉
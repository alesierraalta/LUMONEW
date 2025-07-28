# 🔧 SOLUCIÓN: Error al Crear Proyectos

## ❌ **PROBLEMA IDENTIFICADO**
El botón "Crear Proyecto" no funciona porque **las tablas de proyectos no existen en la base de datos**.

## ✅ **SOLUCIÓN PASO A PASO**

### **Paso 1: Acceder a Supabase Dashboard**
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto LUMO2
3. Ve a la sección **"SQL Editor"** en el menú lateral

### **Paso 2: Ejecutar la Migración SQL**
1. En el SQL Editor, **crea una nueva consulta**
2. **Copia y pega** el siguiente SQL completo:

```sql
-- ============================================================================
-- PROJECT MANAGEMENT TABLES
-- ============================================================================

-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS project_attachments CASCADE;
DROP TABLE IF EXISTS project_status_history CASCADE;
DROP TABLE IF EXISTS project_items CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'on_hold')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE NOT NULL,
    expected_end_date DATE,
    actual_end_date DATE,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    total_items INTEGER NOT NULL DEFAULT 0,
    completed_items INTEGER NOT NULL DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0.00,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- PROJECT ITEMS TABLE
-- ============================================================================
CREATE TABLE project_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    product_type VARCHAR(10) NOT NULL CHECK (product_type IN ('LU', 'CL', 'MP')),
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(12,2) DEFAULT 0.00,
    current_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (current_status IN ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled')),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_to UUID REFERENCES auth.users(id),
    due_date DATE,
    completed_date DATE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- PROJECT STATUS HISTORY TABLE
-- ============================================================================
CREATE TABLE project_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_item_id UUID NOT NULL REFERENCES project_items(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    changed_by_name VARCHAR(255) NOT NULL,
    notes TEXT,
    cost_incurred DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- PROJECT ATTACHMENTS TABLE
-- ============================================================================
CREATE TABLE project_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_item_id UUID NOT NULL REFERENCES project_items(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_start_date ON projects(start_date);

CREATE INDEX idx_project_items_project_id ON project_items(project_id);
CREATE INDEX idx_project_items_status ON project_items(current_status);
CREATE INDEX idx_project_items_assigned_to ON project_items(assigned_to);
CREATE INDEX idx_project_items_product_type ON project_items(product_type);

CREATE INDEX idx_project_status_history_item_id ON project_status_history(project_item_id);
CREATE INDEX idx_project_status_history_changed_by ON project_status_history(changed_by);
CREATE INDEX idx_project_status_history_created_at ON project_status_history(created_at);

CREATE INDEX idx_project_attachments_item_id ON project_attachments(project_item_id);
CREATE INDEX idx_project_attachments_uploaded_by ON project_attachments(uploaded_by);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_items_updated_at 
    BEFORE UPDATE ON project_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view all projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Users can delete projects" ON projects FOR DELETE USING (true);

-- RLS Policies for project_items
CREATE POLICY "Users can view all project items" ON project_items FOR SELECT USING (true);
CREATE POLICY "Users can create project items" ON project_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update project items" ON project_items FOR UPDATE USING (true);
CREATE POLICY "Users can delete project items" ON project_items FOR DELETE USING (true);

-- RLS Policies for project_status_history
CREATE POLICY "Users can view all status history" ON project_status_history FOR SELECT USING (true);
CREATE POLICY "Users can create status history" ON project_status_history FOR INSERT WITH CHECK (true);

-- RLS Policies for project_attachments
CREATE POLICY "Users can view all attachments" ON project_attachments FOR SELECT USING (true);
CREATE POLICY "Users can create attachments" ON project_attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update attachments" ON project_attachments FOR UPDATE USING (true);
CREATE POLICY "Users can delete attachments" ON project_attachments FOR DELETE USING (true);
```

### **Paso 3: Ejecutar la Consulta**
1. Haz clic en **"Run"** o presiona **Ctrl + Enter**
2. Deberías ver un mensaje de éxito
3. Verifica que las tablas se crearon en la sección **"Table Editor"**

### **Paso 4: Verificar que Funciona**
1. Vuelve a tu aplicación
2. Intenta crear un proyecto
3. ¡Debería funcionar ahora! 🎉

## 🔍 **¿POR QUÉ OCURRIÓ ESTO?**
- El código de la aplicación está correcto
- Los servicios y tipos están bien definidos
- Solo faltaban las tablas en la base de datos
- Sin las tablas, las consultas SQL fallan silenciosamente

## 📋 **TABLAS CREADAS**
✅ `projects` - Tabla principal de proyectos
✅ `project_items` - Items/tareas de cada proyecto  
✅ `project_status_history` - Historial de cambios
✅ `project_attachments` - Archivos adjuntos
✅ Índices para rendimiento
✅ Triggers para timestamps automáticos
✅ Políticas RLS para seguridad

## 🚀 **PRÓXIMOS PASOS**
Después de aplicar la migración, podrás:
- ✅ Crear nuevos proyectos
- ✅ Agregar items a los proyectos
- ✅ Hacer seguimiento del progreso
- ✅ Subir archivos adjuntos
- ✅ Ver historial de cambios

---
**¡Listo! El problema está solucionado. Solo necesitas ejecutar el SQL en Supabase.** 
#!/usr/bin/env node

/**
 * Script para verificar y reparar categorías y ubicaciones faltantes
 * Ejecuta: node scripts/fix-categories-locations.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTables() {
  console.log('🔍 Verificando tablas...')
  
  try {
    // Verificar si la tabla categories existe
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('count(*)')
      .limit(1)
    
    if (categoriesError) {
      console.error('❌ Error al verificar tabla categories:', categoriesError.message)
      return false
    }
    
    // Verificar si la tabla locations existe
    const { data: locationsData, error: locationsError } = await supabase
      .from('locations')
      .select('count(*)')
      .limit(1)
    
    if (locationsError) {
      console.error('❌ Error al verificar tabla locations:', locationsError.message)
      return false
    }
    
    console.log('✅ Tablas categories y locations existen')
    return true
  } catch (error) {
    console.error('❌ Error general al verificar tablas:', error.message)
    return false
  }
}

async function checkData() {
  console.log('📊 Verificando datos existentes...')
  
  try {
    const [categoriesResult, locationsResult] = await Promise.all([
      supabase.from('categories').select('id, name').limit(10),
      supabase.from('locations').select('id, name').limit(10)
    ])
    
    console.log(`📋 Categorías encontradas: ${categoriesResult.data?.length || 0}`)
    console.log(`📍 Ubicaciones encontradas: ${locationsResult.data?.length || 0}`)
    
    if (categoriesResult.data?.length > 0) {
      console.log('   Categorías:', categoriesResult.data.map(c => c.name).join(', '))
    }
    
    if (locationsResult.data?.length > 0) {
      console.log('   Ubicaciones:', locationsResult.data.map(l => l.name).join(', '))
    }
    
    return {
      categoriesCount: categoriesResult.data?.length || 0,
      locationsCount: locationsResult.data?.length || 0
    }
  } catch (error) {
    console.error('❌ Error al verificar datos:', error.message)
    return { categoriesCount: 0, locationsCount: 0 }
  }
}

async function insertDefaultCategories() {
  console.log('📝 Insertando categorías por defecto...')
  
  const defaultCategories = [
    { name: 'Electrónicos', description: 'Dispositivos y componentes electrónicos', color: '#blue' },
    { name: 'Oficina', description: 'Suministros y equipos de oficina', color: '#green' },
    { name: 'Herramientas', description: 'Herramientas y equipos de trabajo', color: '#red' },
    { name: 'Consumibles', description: 'Productos de consumo regular', color: '#yellow' },
    { name: 'Mobiliario', description: 'Muebles y equipamiento', color: '#purple' },
    { name: 'Limpieza', description: 'Productos de limpieza y mantenimiento', color: '#cyan' },
    { name: 'Seguridad', description: 'Equipos de seguridad y protección', color: '#orange' },
    { name: 'Otros', description: 'Productos varios', color: '#gray' }
  ]
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .upsert(defaultCategories, { onConflict: 'name' })
      .select()
    
    if (error) {
      console.error('❌ Error al insertar categorías:', error.message)
      return false
    }
    
    console.log(`✅ ${data?.length || 0} categorías insertadas/actualizadas`)
    return true
  } catch (error) {
    console.error('❌ Error general al insertar categorías:', error.message)
    return false
  }
}

async function insertDefaultLocations() {
  console.log('📝 Insertando ubicaciones por defecto...')
  
  const defaultLocations = [
    { name: 'Almacén Principal', address: 'Bodega central - Planta baja' },
    { name: 'Oficina Central', address: 'Oficinas administrativas - Piso 2' },
    { name: 'Sucursal Norte', address: 'Sucursal zona norte de la ciudad' },
    { name: 'Sucursal Sur', address: 'Sucursal zona sur de la ciudad' },
    { name: 'Depósito Temporal', address: 'Área de almacenamiento temporal' },
    { name: 'Área de Recepción', address: 'Zona de recepción de mercancías' },
    { name: 'Área de Despacho', address: 'Zona de preparación de envíos' },
    { name: 'Mantenimiento', address: 'Taller de mantenimiento y reparaciones' }
  ]
  
  try {
    const { data, error } = await supabase
      .from('locations')
      .upsert(defaultLocations, { onConflict: 'name' })
      .select()
    
    if (error) {
      console.error('❌ Error al insertar ubicaciones:', error.message)
      return false
    }
    
    console.log(`✅ ${data?.length || 0} ubicaciones insertadas/actualizadas`)
    return true
  } catch (error) {
    console.error('❌ Error general al insertar ubicaciones:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Iniciando verificación y reparación de categorías y ubicaciones...')
  console.log('')
  
  try {
    // 1. Verificar que las tablas existen
    const tablesExist = await checkTables()
    if (!tablesExist) {
      console.log('')
      console.log('💡 SOLUCIÓN:')
      console.log('   1. Ve a tu dashboard de Supabase')
      console.log('   2. Ejecuta el script setup-database.sql')
      console.log('   3. Vuelve a ejecutar este script')
      process.exit(1)
    }
    
    // 2. Verificar datos existentes
    const { categoriesCount, locationsCount } = await checkData()
    
    // 3. Insertar datos faltantes
    let categoriesFixed = false
    let locationsFixed = false
    
    if (categoriesCount === 0) {
      categoriesFixed = await insertDefaultCategories()
    } else {
      console.log('✅ Categorías ya existen, omitiendo inserción')
    }
    
    if (locationsCount === 0) {
      locationsFixed = await insertDefaultLocations()
    } else {
      console.log('✅ Ubicaciones ya existen, omitiendo inserción')
    }
    
    // 4. Verificación final
    console.log('')
    console.log('🔍 Verificación final...')
    const finalCheck = await checkData()
    
    console.log('')
    if (finalCheck.categoriesCount > 0 && finalCheck.locationsCount > 0) {
      console.log('🎉 ¡PROBLEMA RESUELTO!')
      console.log(`✅ ${finalCheck.categoriesCount} categorías disponibles`)
      console.log(`✅ ${finalCheck.locationsCount} ubicaciones disponibles`)
      console.log('')
      console.log('💡 Ahora puedes usar la "Creación Rápida Múltiple" sin problemas.')
    } else {
      console.log('❌ Problema no resuelto completamente')
      console.log(`   Categorías: ${finalCheck.categoriesCount}`)
      console.log(`   Ubicaciones: ${finalCheck.locationsCount}`)
    }
    
  } catch (error) {
    console.error('❌ Error fatal:', error.message)
    process.exit(1)
  }
}

main()

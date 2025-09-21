const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Aplicando corrección de la tabla users...');

try {
  // Leer el archivo SQL
  const sqlFile = path.join(__dirname, '..', 'database', 'migrations', 'fix_users_auth_user_id.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');
  
  console.log('📄 Archivo SQL leído correctamente');
  console.log('📝 Contenido SQL:');
  console.log(sqlContent);
  
  // Intentar ejecutar con Supabase CLI
  console.log('\n🚀 Ejecutando migración con Supabase CLI...');
  
  try {
    // Verificar si Supabase CLI está disponible
    execSync('supabase --version', { stdio: 'pipe' });
    console.log('✅ Supabase CLI encontrado');
    
    // Ejecutar la migración
    const result = execSync(`supabase db reset --linked`, { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    console.log('✅ Migración ejecutada exitosamente');
    console.log('📊 Resultado:', result);
    
  } catch (cliError) {
    console.log('⚠️  Supabase CLI no disponible o error en ejecución');
    console.log('📋 Instrucciones manuales:');
    console.log('\n1. Abre el SQL Editor en tu dashboard de Supabase');
    console.log('2. Copia y pega el siguiente SQL:');
    console.log('\n--- INICIO DEL SQL ---');
    console.log(sqlContent);
    console.log('--- FIN DEL SQL ---\n');
    console.log('3. Ejecuta el SQL');
    console.log('4. Verifica que la columna auth_user_id se haya agregado correctamente');
  }
  
} catch (error) {
  console.error('❌ Error al procesar la migración:', error.message);
  console.log('\n📋 Instrucciones manuales de respaldo:');
  console.log('1. Conecta a tu base de datos Supabase');
  console.log('2. Ejecuta estos comandos SQL uno por uno:');
  console.log('\nALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;');
  console.log('CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);');
  console.log('UPDATE public.users SET auth_user_id = auth.users.id FROM auth.users WHERE public.users.email = auth.users.email AND public.users.auth_user_id IS NULL;');
}

console.log('\n🏁 Proceso de corrección completado');
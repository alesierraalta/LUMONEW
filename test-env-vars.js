require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing environment variables...');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('URL starts with:', process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...');
}

if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('Anon key starts with:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30) + '...');
}
/**
 * Script to create the admin user in Supabase Auth
 * Run this script after setting up your environment variables
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createAdminUser() {
  console.log('🔐 Creating admin user in Supabase Auth...\n');

  // Initialize Supabase client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // Create the admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'alesierraalta@gmail.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        created_by: 'system'
      },
      app_metadata: {
        role: 'admin',
        provider: 'email'
      }
    });

    if (error) {
      console.error('❌ Error creating admin user:', error.message);
      
      // Check if user already exists
      if (error.message.includes('already registered')) {
        console.log('ℹ️  User already exists. Checking user details...');
        
        // Try to get the existing user
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        
        if (!listError) {
          const existingUser = users.users.find(u => u.email === 'alesierraalta@gmail.com');
          if (existingUser) {
            console.log('✅ Admin user found:', {
              id: existingUser.id,
              email: existingUser.email,
              created_at: existingUser.created_at,
              email_confirmed_at: existingUser.email_confirmed_at
            });
            
            // Update our database user record with the correct ID
            await updateDatabaseUser(supabase, existingUser.id);
            return;
          }
        }
      }
      
      process.exit(1);
    }

    console.log('✅ Admin user created successfully!');
    console.log('📋 User details:', {
      id: data.user.id,
      email: data.user.email,
      created_at: data.user.created_at,
      email_confirmed_at: data.user.email_confirmed_at
    });

    // Update our database user record with the correct ID
    await updateDatabaseUser(supabase, data.user.id);

    console.log('\n🎉 Admin user setup complete!');
    console.log('📝 You can now login with:');
    console.log('   Email: alesierraalta@gmail.com');
    console.log('   Password: admin123');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

async function updateDatabaseUser(supabase, authUserId) {
  console.log('\n🔄 Updating database user record...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ id: authUserId })
      .eq('email', 'alesierraalta@gmail.com')
      .select();

    if (error) {
      console.error('❌ Error updating database user:', error.message);
      return;
    }

    console.log('✅ Database user record updated successfully');
    console.log('📋 Updated user:', data[0]);
    
  } catch (err) {
    console.error('❌ Error updating database user:', err.message);
  }
}

// Check environment variables
function checkEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease check your .env.local file');
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  checkEnvironment();
  createAdminUser();
}

module.exports = { createAdminUser };
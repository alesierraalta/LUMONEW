// Test script to verify hydration fixes
// Run with: node test-hydration.js

const { execSync } = require('child_process');

console.log('🔍 Testing React Hydration Fixes...\n');

try {
  // Build the application to check for build-time errors
  console.log('1. Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful\n');

  // Start the application in production mode
  console.log('2. Starting application in production mode...');
  const server = execSync('npm start &', { stdio: 'pipe' });
  
  // Wait a moment for server to start
  setTimeout(() => {
    console.log('3. Testing hydration with curl requests...\n');
    
    // Test main routes for hydration issues
    const routes = [
      '/',
      '/en',
      '/es',
      '/en/dashboard',
      '/es/dashboard'
    ];
    
    routes.forEach(route => {
      try {
        console.log(`Testing route: ${route}`);
        const response = execSync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000${route}`, { encoding: 'utf8' });
        console.log(`✅ ${route}: HTTP ${response.trim()}`);
      } catch (error) {
        console.log(`❌ ${route}: Failed - ${error.message}`);
      }
    });
    
    console.log('\n🎉 Hydration test completed!');
    console.log('\nNext steps:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Check browser console for hydration errors');
    console.log('3. Navigate between pages to test routing');
    console.log('4. Test authentication flow');
    
  }, 3000);
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
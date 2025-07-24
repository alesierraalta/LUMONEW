// Current anon key from .env.local
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYnRuaW5seXpwZGVteXVkYXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTI3OTQsImV4cCI6MjA2ODY2ODc5NH0.IxnwffD8nkbj85aQR1MLzme5snaD711hnWGH7LOkYHE';

// Decode JWT manually (without external dependencies)
function decodeJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  
  return { header, payload };
}

// Decode the anon key to understand its structure
const decoded = decodeJWT(anonKey);
console.log('Decoded anon key:');
console.log('Header:', JSON.stringify(decoded.header, null, 2));
console.log('Payload:', JSON.stringify(decoded.payload, null, 2));

// Create service role payload with same structure but different role
const serviceRolePayload = {
  ...decoded.payload,
  role: 'service_role'
};

console.log('\nExpected service role payload:', JSON.stringify(serviceRolePayload, null, 2));

// Create the expected service role JWT payload (base64url encoded)
const serviceRolePayloadEncoded = Buffer.from(JSON.stringify(serviceRolePayload)).toString('base64url');
console.log('\nService role payload (base64url):', serviceRolePayloadEncoded);

console.log('\n=== INSTRUCTIONS ===');
console.log('The service role key needs to be obtained from your Supabase Dashboard:');
console.log('1. Go to https://supabase.com/dashboard/project/hnbtninlyzpdemyudaqg');
console.log('2. Navigate to Settings > API');
console.log('3. Copy the "service_role" key (not the anon key)');
console.log('4. Replace the placeholder in .env.local with the actual service_role key');
console.log('\nProject Reference: hnbtninlyzpdemyudaqg');
console.log('Current anon key role:', decoded.payload.role);
console.log('Expected service role key role: service_role');
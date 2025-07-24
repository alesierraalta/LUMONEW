# Audit System Configuration Documentation

## Overview

This document describes the configuration and setup of the LUMO2 inventory system's audit logging functionality, including the resolution of service role key configuration issues.

## Configuration Summary

### Environment Variables

The audit logging system requires the following environment variables in `.env.local`:

```env
# Supabase Configuration - Development Environment
NEXT_PUBLIC_SUPABASE_URL=https://hnbtninlyzpdemyudaqg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYnRuaW5seXpwZGVteXVkYXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTI3OTQsImV4cCI6MjA2ODY2ODc5NH0.IxnwffD8nkbj85aQR1MLzme5snaD711hnWGH7LOkYHE

# Service Role Key for audit operations (bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYnRuaW5seXpwZGVteXVkYXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5Mjc5NCwiZXhwIjoyMDY4NjY4Nzk0fQ.Cgbmm19Uvfk-R_-QhUs-E-YasSYRGpsWXPuSYhODbpk
```

### Key Configuration Requirements

1. **Project Matching**: The service role key must match the same Supabase project as the `NEXT_PUBLIC_SUPABASE_URL`
2. **JWT Structure**: The service role key is a JWT token with `"role": "service_role"`
3. **Environment Reload**: Next.js automatically reloads environment variables when `.env.local` is modified

## Issue Resolution

### Problem Identified

The original configuration had a service role key from the wrong Supabase project:
- **URL Project**: `hnbtninlyzpdemyudaqg` (LUMO NEW DEV)
- **Service Key Project**: `heteecppghdkkzgrbdko` (LUMO NEW PROD)

This mismatch caused "Invalid API key" errors when the audit system attempted to use the service role client.

### Solution Applied

1. **Identified Correct Project**: Used Supabase MCP tools to list projects and identify the correct DEV project
2. **Updated Service Role Key**: Replaced the PROD project key with the DEV project key
3. **Verified Configuration**: Confirmed the JWT payload contains the correct project reference

## Audit System Architecture

### Service Role Client Creation

The audit system uses a dedicated service role client for operations that bypass Row Level Security (RLS):

```typescript
// lib/audit.ts - lines 6-21
function createServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not found, using anonymous client for audit operations')
    return supabase
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
```

### Fallback Mechanism

The system includes a fallback mechanism that uses the anonymous client if the service role key is not available, ensuring the application continues to function even with configuration issues.

## Testing and Verification

### Test Results

A comprehensive test suite was created at `app/api/test-audit/route.ts` to verify the audit system functionality:

```
✅ Test Results Summary:
- Status Code: 200 OK (success)
- All Tests Passed: 4/4 tests successful
- Service Role Key: Working correctly
- Log Test Operation: ✅ Successfully logged
- Retrieve Recent Logs: ✅ Retrieved 5 recent logs  
- Get Audit Statistics: ✅ Retrieved stats (31 total operations)
- Update Operation: ✅ Successfully logged
- Cleanup: ✅ Test cleanup completed
```

### Test Endpoint

You can test the audit system by making a GET request to:
```
http://localhost:3000/api/test-audit
```

This endpoint performs comprehensive testing of:
1. Environment variable configuration
2. Service role key validation
3. Audit log creation (INSERT, UPDATE, DELETE operations)
4. Audit log retrieval
5. Audit statistics generation
6. Test data cleanup

## Security Considerations

### Service Role Key Security

- **Elevated Permissions**: The service role key bypasses all Row Level Security policies
- **Server-Side Only**: Must never be exposed to client-side code
- **Environment Protection**: Should be stored securely in environment variables
- **Access Control**: Only use for operations that require elevated permissions (audit logging)

### Best Practices

1. **Separate Keys by Environment**: Use different service role keys for DEV, STAGING, and PROD
2. **Regular Rotation**: Consider rotating service role keys periodically
3. **Minimal Usage**: Only use service role client when necessary (audit operations)
4. **Monitoring**: Monitor audit logs for unusual activity

## Troubleshooting

### Common Issues

1. **"Invalid API key" Error**
   - **Cause**: Service role key doesn't match the Supabase project URL
   - **Solution**: Verify the JWT payload contains the correct project reference

2. **"Foreign Key Constraint" Error**
   - **Cause**: Attempting to log audit entries with non-existent user IDs
   - **Solution**: Use null user IDs for system operations or ensure user exists

3. **"Permission Denied" Error**
   - **Cause**: Using anonymous client instead of service role client
   - **Solution**: Verify SUPABASE_SERVICE_ROLE_KEY is properly set

### Debugging Steps

1. Check environment variables are loaded:
   ```bash
   # In Next.js API route
   console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing')
   ```

2. Verify JWT payload:
   ```javascript
   // Decode JWT to check project reference
   const payload = JSON.parse(atob(serviceRoleKey.split('.')[1]))
   console.log('Project ref:', payload.ref)
   ```

3. Test audit operations:
   ```bash
   curl http://localhost:3000/api/test-audit
   ```

## Maintenance

### Regular Tasks

1. **Monitor Audit Logs**: Regularly check audit log entries for completeness
2. **Performance Review**: Monitor audit system performance impact
3. **Key Rotation**: Plan for periodic service role key rotation
4. **Backup Verification**: Ensure audit logs are included in backup procedures

### Environment Updates

When updating environment configurations:
1. Update `.env.local` for development
2. Update deployment environment variables for production
3. Restart the application to reload environment variables
4. Run the test endpoint to verify functionality

## Related Files

- **Audit System**: [`lib/audit.ts`](lib/audit.ts)
- **Environment Config**: [`.env.local`](.env.local)
- **Test Endpoint**: [`app/api/test-audit/route.ts`](app/api/test-audit/route.ts)
- **Supabase Clients**: [`lib/supabase/`](lib/supabase/)

## Support

For issues related to audit system configuration:
1. Check this documentation first
2. Run the test endpoint to identify specific issues
3. Review the audit system logs in the Next.js console
4. Verify Supabase project settings and API keys

---

**Last Updated**: 2025-07-23  
**Configuration Status**: ✅ Fully Operational  
**Test Status**: ✅ All Tests Passing
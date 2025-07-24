# Supabase Client Architecture Fixes

## Issues Resolved

### 1. Multiple GoTrueClient Instances
**Problem**: Multiple Supabase client instances were being created, causing browser warnings about concurrent GoTrueClient instances.

**Root Cause**: 
- `lib/supabase.ts` created a basic client with anonymous key
- `lib/supabase/server.ts` created a server client with SSR support
- `lib/supabase/client.ts` created a browser client with SSR support
- `lib/database-with-audit.ts` created another server client for audit operations

**Solution**: 
- Removed redundant `lib/supabase.ts` file
- Consolidated to use only SSR-compatible clients
- Created dedicated service role client for audit operations

### 2. Missing SUPABASE_SERVICE_ROLE_KEY
**Problem**: Service role key environment variable was not being accessed properly, causing audit operations to fall back to anonymous client.

**Root Cause**: 
- Environment variable was present in `.env.local` but not being used correctly
- Multiple client creation functions were duplicating service role logic

**Solution**:
- Created dedicated `lib/supabase/service-role.ts` with proper error handling
- Centralized service role client creation with singleton pattern
- Updated audit operations to use the dedicated service role client
- Added graceful fallback for client-side audit operations
- Implemented foreign key constraint violation handling

### 3. Client-Side Audit Operations
**Problem**: Service role client was being called from browser context where environment variables are not available.

**Root Cause**:
- Audit operations were trying to use service role client in browser context
- `SUPABASE_SERVICE_ROLE_KEY` is not available in browser environment

**Solution**:
- Added server/client context detection in audit service
- Graceful fallback to browser client for client-side audit operations
- Maintained service role client for server-side operations

### 4. Foreign Key Constraint Violations
**Problem**: Audit system was trying to insert user_id references that don't exist in the users table.

**Root Cause**:
- User authentication state not properly synchronized with database
- Missing user records in users table

**Solution**:
- Added retry logic for foreign key constraint violations
- Graceful fallback to null user_id with metadata preservation
- Enhanced error handling for audit operations

## Files Modified

### New Files Created
- `lib/supabase/service-role.ts` - Dedicated service role client for server-side operations
- `lib/supabase/types.ts` - Database type definitions
- `lib/supabase/index.ts` - Centralized exports for all Supabase utilities

### Files Updated
- `lib/database-with-audit.ts` - Updated to use new service role client and browser client for compatibility
- `lib/database.ts` - Updated to use browser client for Next.js compatibility
- `lib/audit.ts` - Updated to use new service role client architecture and browser client for compatibility

### Files Removed
- `lib/supabase.ts` - Redundant basic client removed

## Architecture Overview

```
lib/supabase/
├── index.ts          # Main exports
├── types.ts          # Database type definitions
├── server.ts         # SSR server client (for authenticated operations)
├── client.ts         # SSR browser client (for client-side operations)
└── service-role.ts   # Service role client (for audit operations, bypasses RLS)
```

## Client Usage Guidelines

### Server-Side Operations (with user context)
```typescript
import { createServerClient } from '@/lib/supabase/server'
const supabase = createServerClient()
```

### Client-Side Operations
```typescript
import { createBrowserClient } from '@/lib/supabase/client'
const supabase = createBrowserClient()
```

### Audit Operations (server-side only, bypasses RLS)
```typescript
import { getServiceRoleClient } from '@/lib/supabase/service-role'
const supabase = getServiceRoleClient()
```

**Important Note**: The database services now use the browser client for Next.js Pages Router compatibility, while audit operations still use the service role client for proper permissions.

## Environment Variables Required

```env
# Public Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Service role key (server-side only, for audit operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Benefits

1. **Eliminated Client Conflicts**: No more multiple GoTrueClient instances
2. **Proper SSR Support**: Uses Supabase's recommended SSR clients
3. **Secure Audit Operations**: Service role client properly bypasses RLS for audit logging
4. **Better Type Safety**: Centralized database types with proper TypeScript support
5. **Cleaner Architecture**: Clear separation of concerns between different client types

## Testing

Run the test script to verify all fixes:
```bash
node test-supabase-fix.js
```

## Next Steps

1. Restart the development server to apply changes
2. Test the application to ensure no more client conflicts
3. Verify audit operations work with service role permissions
4. Monitor for any remaining GoTrueClient warnings
5. Update any remaining imports that reference the old `lib/supabase.ts` file
# User Synchronization Solution

## Problem Description

The application was experiencing foreign key constraint violations in the audit system because users created in Supabase Auth (`auth.users`) were not automatically synchronized with the application's users table (`public.users`). This caused audit operations to fail when trying to reference a `user_id` that existed in auth but not in the application database.

## Root Cause

When you create a user in the Supabase Auth dashboard, that user only exists in the `auth.users` table. The application's audit system tries to create audit logs with a `user_id` foreign key reference to `public.users`, but if the user doesn't exist there, it causes a foreign key constraint violation.

## Solution Overview

The solution implements automatic user synchronization between Supabase Auth and the application's users table using:

1. **Database Triggers**: Automatically sync users when they're created/updated in auth
2. **User Sync Service**: Handle manual synchronization and edge cases
3. **Enhanced Audit System**: Proactively ensure users exist before audit operations

## Implementation

### 1. Database Migration

**File**: [`database/migrations/create_user_sync_trigger.sql`](database/migrations/create_user_sync_trigger.sql)

Creates:
- `handle_new_user()` function to sync auth users to public.users
- Triggers on `auth.users` for INSERT and UPDATE operations
- `sync_existing_auth_users()` function for manual synchronization

### 2. Migration Script

**File**: [`scripts/apply-user-sync-migration.js`](scripts/apply-user-sync-migration.js)

Node.js script to apply the database migration safely.

### 3. User Sync Service

**File**: [`lib/auth/user-sync.ts`](lib/auth/user-sync.ts)

Provides:
- `syncAuthUser()` - Manually sync a specific user
- `syncAllMissingUsers()` - Sync all missing users
- `userExists()` - Check if user exists in users table
- `ensureUserExists()` - Ensure user exists before operations

### 4. Enhanced Audit System

**File**: [`lib/audit.ts`](lib/audit.ts)

Updated to:
- Proactively sync users before audit operations (server-side only)
- Gracefully handle foreign key constraint violations
- Provide detailed error messages and fallback behavior

## How It Works

### Automatic Synchronization

1. **User Creation**: When a user is created in Supabase Auth dashboard
2. **Trigger Activation**: Database trigger `on_auth_user_created` fires
3. **User Sync**: `handle_new_user()` function creates corresponding record in `public.users`
4. **Audit Operations**: Now work seamlessly with proper user references

### Manual Synchronization

```typescript
import { userSyncService } from '@/lib/auth/user-sync'

// Sync all missing users
const result = await userSyncService.syncAllMissingUsers()
console.log(`Synced ${result.synced} users, ${result.errors} errors`)

// Sync specific user
const success = await userSyncService.syncAuthUser(authUser)
```

### Proactive User Sync in Audit

The audit system now:
1. Checks if user exists before creating audit logs
2. Attempts to sync missing users automatically
3. Falls back to null user_id with metadata if sync fails
4. Never blocks main operations due to audit issues

## Installation Steps

### 1. Apply Database Migration

```bash
# Run the migration script
node scripts/apply-user-sync-migration.js
```

### 2. Verify Setup

1. **Check Database**: Verify triggers and functions were created
2. **Test User Creation**: Create a user in Supabase Auth dashboard
3. **Verify Sync**: Check that user appears in `public.users` table
4. **Test Audit**: Perform inventory operations to verify audit works

### 3. Manual Sync (if needed)

If you have existing auth users that need syncing:

```typescript
import { userSyncService } from '@/lib/auth/user-sync'

// In a server-side context (API route, etc.)
const result = await userSyncService.syncAllMissingUsers()
```

## Benefits

### ✅ Automatic User Sync
- Users created in Auth dashboard automatically appear in app
- No manual intervention required for normal operations

### ✅ Robust Error Handling
- Audit operations never block main functionality
- Graceful fallback when users can't be synced
- Detailed error logging for troubleshooting

### ✅ Backward Compatibility
- Existing users are automatically synced
- No breaking changes to existing functionality

### ✅ Performance Optimized
- User sync only happens when needed
- Server-side only to avoid browser context issues
- Non-blocking audit operations

## Troubleshooting

### Issue: Migration Fails
**Solution**: Check that `SUPABASE_SERVICE_ROLE_KEY` is properly set in `.env.local`

### Issue: Users Still Not Syncing
**Solution**: 
1. Verify triggers exist: `SELECT * FROM information_schema.triggers WHERE trigger_name LIKE 'on_auth_user%'`
2. Check function exists: `SELECT * FROM information_schema.routines WHERE routine_name = 'handle_new_user'`
3. Run manual sync: `SELECT public.sync_existing_auth_users()`

### Issue: Audit Still Failing
**Solution**:
1. Check user exists: `SELECT * FROM public.users WHERE id = 'user-id'`
2. Run user sync service manually
3. Check audit logs for detailed error messages

## Testing

### Test User Creation
1. Go to Supabase Auth dashboard
2. Create a new user
3. Check `public.users` table - user should appear automatically
4. Test inventory operations - should work without foreign key errors

### Test Manual Sync
```typescript
// In an API route or server component
import { userSyncService } from '@/lib/auth/user-sync'

export async function GET() {
  const result = await userSyncService.syncAllMissingUsers()
  return Response.json(result)
}
```

## Next Steps

1. **Apply Migration**: Run the migration script
2. **Test Functionality**: Verify user sync works
3. **Monitor Logs**: Check for any remaining sync issues
4. **Update Documentation**: Add user management procedures

The foreign key constraint violations should now be completely resolved, and the audit system should work seamlessly with proper user synchronization.
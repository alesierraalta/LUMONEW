# LUMO2 Comprehensive Audit System Documentation

## Overview

The LUMO2 Audit System provides complete tracking of all system activities as requested: **"en el historial debe haber registro de todo, desde lo que se borra, modifica etc..., igual en las ultimas acciones, debe de quedar registrado todo y cada una de las acciones realizadas"** (the history should have a record of everything, from what is deleted, modified, etc., and in the recent actions, everything and each of the actions performed should be recorded).

## Features

### ✅ Complete Action Tracking
- **CREATE Operations**: All new records with full data capture
- **UPDATE Operations**: Field-level changes with before/after values
- **DELETE Operations**: Complete record preservation before deletion
- **BULK Operations**: Mass operations with individual item tracking
- **AUTHENTICATION**: Login/logout events with session tracking
- **ERROR Logging**: Failed operations with error details

### ✅ Real-time Monitoring
- **Recent Activities Dashboard**: Live feed of latest actions
- **Auto-refresh**: Updates every 30 seconds
- **User Context**: Shows who performed each action
- **Time Tracking**: Precise timestamps with "time ago" formatting

### ✅ Advanced Analytics
- **Statistics Dashboard**: Operation counts and trends
- **Visual Charts**: Bar charts for operations, pie charts for tables
- **Performance Metrics**: Success/failure rates
- **Filtering**: By date, user, operation type, table

## Architecture

### Core Components

#### 1. AuditService (`lib/audit.ts`)
```typescript
// Singleton service for centralized audit logging
const auditService = AuditService.getInstance()

// Set user context
auditService.setUserContext(user, sessionId)

// Log operations
await auditService.logCreate('users', userId, userData)
await auditService.logUpdate('inventory', itemId, oldData, newData)
await auditService.logDelete('categories', categoryId, deletedData)
```

#### 2. Database Integration (`lib/database-with-audit.ts`)
```typescript
// Enhanced services with automatic audit logging
import { auditedUserService } from '@/lib/database-with-audit'

// All operations automatically logged
const user = await auditedUserService.create(userData)
await auditedUserService.update(userId, updates)
await auditedUserService.delete(userId)
```

#### 3. UI Components

##### Recent Activities Dashboard (`components/dashboard/recent-activities.tsx`)
- Displays latest 10 audit logs
- Real-time updates every 30 seconds
- Operation icons and status badges
- Stock change tracking
- Bulk operation summaries

##### Audit Table (`components/audit/audit-table.tsx`)
- Expandable rows with detailed change information
- Before/after value comparison
- Operation filtering and search
- Pagination support

##### Audit Statistics (`components/audit/audit-stats.tsx`)
- Visual charts and metrics
- Operation breakdown
- Table activity analysis
- Time-based filtering

## Database Schema

### audit_logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  user_email TEXT,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  old_values JSONB, -- Data before change
  new_values JSONB, -- Data after change
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  metadata JSONB, -- Additional context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_operation ON audit_logs(table_name, operation);
```

## Usage Examples

### 1. Basic CRUD Operations

#### Creating Records
```typescript
// Automatically logs INSERT operation
const newUser = await auditedUserService.create({
  email: 'user@example.com',
  name: 'John Doe',
  role: 'user'
})
// Audit log: operation='INSERT', table_name='users', new_values={...}
```

#### Updating Records
```typescript
// Automatically logs UPDATE with field changes
await auditedInventoryService.update(itemId, {
  quantity: 150, // Changed from 100
  unit_price: 29.99 // Changed from 25.99
})
// Audit log: operation='UPDATE', old_values={quantity: 100, unit_price: 25.99}, 
//           new_values={quantity: 150, unit_price: 29.99}
```

#### Deleting Records
```typescript
// Automatically logs DELETE with complete data preservation
await auditedCategoryService.delete(categoryId)
// Audit log: operation='DELETE', old_values={complete category data}
```

### 2. Bulk Operations

```typescript
// Bulk update with individual tracking
const results = await auditedInventoryService.bulkUpdate([
  { id: 'item1', updates: { quantity: 200 } },
  { id: 'item2', updates: { quantity: 150 } }
])
// Creates individual audit logs for each item plus bulk operation summary
```

### 3. Authentication Tracking

```typescript
// Login tracking
await auditService.logAuth('LOGIN', userId, userEmail, {
  login_method: 'email_password',
  ip_address: request.ip
})

// Logout tracking
await auditService.logAuth('LOGOUT', userId, userEmail, {
  session_duration: '2 hours 15 minutes'
})
```

### 4. Custom Audit Logging

```typescript
// Manual audit logging for special operations
await auditService.logOperation({
  operation: 'EXPORT',
  table_name: 'inventory',
  record_id: 'export_' + Date.now(),
  metadata: {
    action_type: 'data_export',
    format: 'CSV',
    record_count: 1500,
    reason: 'Monthly inventory report'
  }
})
```

## Integration Guide

### 1. Replace Existing Database Calls

**Before:**
```typescript
import { supabase } from '@/lib/supabase'

const { data } = await supabase
  .from('users')
  .insert([userData])
```

**After:**
```typescript
import { auditedUserService } from '@/lib/database-with-audit'

const data = await auditedUserService.create(userData)
// Automatically logged with full audit trail
```

### 2. Add Recent Activities to Dashboard

```typescript
import RecentActivities from '@/components/dashboard/recent-activities'

export function Dashboard() {
  return (
    <div className="dashboard">
      {/* Other dashboard components */}
      <RecentActivities />
    </div>
  )
}
```

### 3. Add Audit Page

```typescript
// app/audit/page.tsx
import AuditTable from '@/components/audit/audit-table'
import AuditStats from '@/components/audit/audit-stats'
import AuditFilters from '@/components/audit/audit-filters'

export default function AuditPage() {
  return (
    <div className="audit-page">
      <AuditStats />
      <AuditFilters />
      <AuditTable />
    </div>
  )
}
```

## Configuration

### Environment Variables
```env
# Supabase configuration (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Audit system configuration (optional)
AUDIT_RETENTION_DAYS=90  # How long to keep audit logs
AUDIT_BATCH_SIZE=100     # Batch size for bulk operations
```

### User Context Setup
```typescript
// Set up user context when user logs in
import { auditService } from '@/lib/audit'

// On login
auditService.setUserContext(user, sessionId)

// On logout
auditService.setUserContext(null, null)
```

## Performance Considerations

### Database Optimization
- **Indexes**: Created on frequently queried columns
- **Partitioning**: Consider partitioning by date for large datasets
- **Archiving**: Implement automatic archiving of old audit logs
- **Batch Processing**: Bulk operations use batching to reduce database load

### Client-Side Optimization
- **Pagination**: Audit table uses pagination for large datasets
- **Lazy Loading**: Components load data on demand
- **Caching**: Recent activities cached for 30 seconds
- **Debouncing**: Search filters debounced to reduce API calls

## Security

### Data Protection
- **Sensitive Data**: Passwords and tokens are never logged
- **User Permissions**: Audit logs respect user access controls
- **IP Tracking**: Client IP addresses logged for security
- **Session Tracking**: Session IDs help track user activities

### Access Control
```typescript
// Check permissions before showing audit data
if (user.permissions.canViewAuditLogs) {
  return <AuditTable />
} else {
  return <AccessDenied />
}
```

## Monitoring and Alerts

### Key Metrics to Monitor
- **Audit Log Volume**: Number of logs per day/hour
- **Failed Operations**: Operations that failed and were logged
- **User Activity**: Most active users and operations
- **System Health**: Audit system availability and performance

### Alert Conditions
- High number of failed operations
- Unusual bulk operation patterns
- Suspicious user activity
- Audit system failures

## Testing

### Comprehensive Test Suite
Run the complete audit system test:

```typescript
import { auditSystemTest } from '@/tests/audit-system-test'

// Run all tests
await auditSystemTest.runCompleteTest()

// Run specific test sections
await auditSystemTest.testCreateOperations()
await auditSystemTest.testUpdateOperations(testIds)
await auditSystemTest.testDeleteOperations(testIds)
```

### Test Coverage
- ✅ CREATE operations logging
- ✅ UPDATE operations with field changes
- ✅ DELETE operations with data preservation
- ✅ BULK operations tracking
- ✅ Authentication event logging
- ✅ Error logging for failed operations
- ✅ Recent activities display
- ✅ Audit statistics generation

## Troubleshooting

### Common Issues

#### 1. Audit Logs Not Appearing
**Problem**: Operations are not being logged
**Solution**: 
- Check user context is set: `auditService.setUserContext(user, sessionId)`
- Verify database permissions for audit_logs table
- Check for JavaScript errors in browser console

#### 2. Recent Activities Not Updating
**Problem**: Dashboard shows stale data
**Solution**:
- Check network connectivity
- Verify Supabase connection
- Check browser console for errors
- Ensure component is properly mounted

#### 3. Performance Issues
**Problem**: Audit queries are slow
**Solution**:
- Check database indexes are created
- Implement pagination for large datasets
- Consider archiving old audit logs
- Optimize query filters

### Debug Mode
Enable debug logging:
```typescript
// In development environment
localStorage.setItem('audit_debug', 'true')

// Check audit service logs in browser console
```

## Migration Guide

### From Basic Logging to Comprehensive Audit

1. **Update Database Calls**
   ```typescript
   // Replace all direct Supabase calls
   - supabase.from('table').insert(data)
   + auditedService.create(data)
   ```

2. **Add Audit Components**
   ```typescript
   // Add to dashboard
   import RecentActivities from '@/components/dashboard/recent-activities'
   
   // Add audit page
   // app/audit/page.tsx
   ```

3. **Set User Context**
   ```typescript
   // On app initialization
   auditService.setUserContext(currentUser, sessionId)
   ```

4. **Test Integration**
   ```typescript
   // Run comprehensive tests
   await auditSystemTest.runCompleteTest()
   ```

## API Reference

### AuditService Methods

#### `logCreate(table: string, recordId: string, data: any, metadata?: any)`
Logs INSERT operations with complete new record data.

#### `logUpdate(table: string, recordId: string, oldData: any, newData: any, metadata?: any)`
Logs UPDATE operations with before/after comparison.

#### `logDelete(table: string, recordId: string, deletedData: any, metadata?: any)`
Logs DELETE operations preserving complete deleted record.

#### `logAuth(operation: 'LOGIN' | 'LOGOUT', userId: string, userEmail: string, metadata?: any)`
Logs authentication events.

#### `getRecentLogs(limit: number = 10): Promise<AuditLog[]>`
Retrieves recent audit logs for dashboard display.

#### `getAuditLogs(filters: AuditFilters): Promise<{data: AuditLog[], error: any}>`
Retrieves filtered audit logs with pagination.

### Database Service Methods

All audited services (`auditedUserService`, `auditedCategoryService`, etc.) provide:
- `getAll()`: Retrieve all records
- `getById(id)`: Retrieve single record
- `create(data)`: Create new record with audit logging
- `update(id, updates)`: Update record with audit logging
- `delete(id)`: Delete record with audit logging
- `bulkUpdate(items)`: Bulk update with audit logging
- `bulkDelete(ids)`: Bulk delete with audit logging

## Conclusion

The LUMO2 Comprehensive Audit System now provides complete tracking of all system activities as requested. Every action is logged, from deletions and modifications to recent activities, ensuring full accountability and traceability throughout the application.

### Key Benefits
- ✅ **Complete Tracking**: Every CRUD operation is logged
- ✅ **Real-time Monitoring**: Live dashboard of recent activities
- ✅ **Detailed Analytics**: Statistics and trends analysis
- ✅ **User Accountability**: Full user action tracking
- ✅ **Data Recovery**: Complete data preservation for deletions
- ✅ **Security Auditing**: Authentication and access tracking
- ✅ **Performance Optimized**: Efficient database design and queries
- ✅ **Easy Integration**: Simple API for existing code

The system fulfills the requirement: **"en el historial debe haber registro de todo, desde lo que se borra, modifica etc..., igual en las ultimas acciones, debe de quedar registrado todo y cada una de las acciones realizadas"** - providing comprehensive audit trails for all system activities.
# LUMO Inventory System - Deployment Guide

## Production Environment Setup

### 1. Supabase Production Project

1. Create a new Supabase project for production
2. Copy the database schema from development:
   ```sql
   -- Run all migrations from development to production
   -- Tables: categories, locations, inventory, users, audit_logs
   -- Functions: log_audit_event()
   -- Triggers: audit triggers for all tables
   -- Policies: RLS policies for security
   ```

3. Configure authentication settings:
   - Enable email/password authentication
   - Set up email templates
   - Configure redirect URLs for production domain

### 2. Environment Variables

Copy `.env.production` and update with actual production values:

```bash
# Required Production Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-secure-secret
```

### 3. Database Migration

Run the following migrations in production:

1. **Create Tables Migration**:
   ```sql
   -- Categories, Locations, Inventory, Users tables
   -- (Copy from development database)
   ```

2. **Audit System Migration**:
   ```sql
   -- Audit logs table and triggers
   -- (Copy from development database)
   ```

3. **Security Policies**:
   ```sql
   -- Enable RLS on all tables
   -- Create appropriate policies for user access
   ```

### 4. Deployment Steps

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel/Netlify**:
   ```bash
   # For Vercel
   vercel --prod
   
   # For Netlify
   netlify deploy --prod
   ```

3. **Configure environment variables** in your deployment platform

4. **Test the deployment**:
   - Authentication flow
   - Database connections
   - Audit logging
   - All CRUD operations

### 5. Security Checklist

- [ ] All environment variables are secure and not exposed
- [ ] RLS is enabled on all tables
- [ ] Authentication is properly configured
- [ ] HTTPS is enforced
- [ ] Audit logging is working
- [ ] Rate limiting is configured
- [ ] Error tracking is set up

### 6. Monitoring

Set up monitoring for:
- Database performance
- Authentication errors
- Application errors
- Audit log analysis
- User activity

### 7. Backup Strategy

- Enable automated backups in Supabase
- Set up regular database dumps
- Test restore procedures
- Document recovery processes

## Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Database | LUMO NEW DEV | LUMO PROD |
| URL | localhost:3000 | your-domain.com |
| Logging | Debug level | Error level |
| Caching | Disabled | Enabled |
| Analytics | Disabled | Enabled |
| Rate Limiting | Disabled | Enabled |

## Troubleshooting

### Common Issues

1. **Authentication not working**:
   - Check redirect URLs in Supabase
   - Verify environment variables
   - Check NEXTAUTH_SECRET

2. **Database connection issues**:
   - Verify Supabase URL and keys
   - Check RLS policies
   - Verify user permissions

3. **Audit logging not working**:
   - Check if triggers are created
   - Verify user authentication
   - Check audit_logs table permissions

### Support

For deployment issues, check:
1. Application logs
2. Supabase logs
3. Browser console errors
4. Network requests in dev tools
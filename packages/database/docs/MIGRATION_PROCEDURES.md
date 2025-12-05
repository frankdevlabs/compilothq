# Digital Asset Migration Procedures

Step-by-step guide for applying Digital Asset database migrations across different environments.

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Local Development](#local-development)
3. [Testing Environment](#testing-environment)
4. [Staging Environment](#staging-environment)
5. [Production Environment](#production-environment)
6. [Rollback Procedures](#rollback-procedures)
7. [Verification Checklist](#verification-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Migration Overview

**Migration Name:** `20251205152202_add_digital_asset_models`

**Changes:**

- 3 new tables: `digital_assets`, `data_processing_activity_digital_assets`, `asset_processing_locations`
- 3 new enums: `AssetType`, `IntegrationStatus`, `LocationRole`
- 9 new indexes for performance and multi-tenancy
- Foreign key constraints for referential integrity

**Impact:**

- **Breaking:** None (additive migration)
- **Data Loss Risk:** None (no existing data affected)
- **Downtime Required:** None (tables created, not altered)
- **Rollback Complexity:** Low (drop tables, enums still safe)

---

## Local Development

### Prerequisites

- PostgreSQL 17 running locally
- Database connection configured in `.env`
- `pnpm` installed

### Step-by-Step

1. **Navigate to database package:**

   ```bash
   cd /Users/frankdevlab/WebstormProjects/compilothq/packages/database
   ```

2. **Verify database connection:**

   ```bash
   # Test connection
   pnpm prisma db push --skip-generate
   ```

3. **Create and apply migration:**

   ```bash
   # Interactive migration creation
   pnpm migrate
   # When prompted, enter name: "add_digital_asset_models"
   ```

   This command:
   - Generates migration SQL in `prisma/migrations/`
   - Applies migration to local database
   - Regenerates Prisma Client
   - Updates `_prisma_migrations` table

4. **Verify Prisma Client generation:**

   ```bash
   # Regenerate if needed
   pnpm generate
   ```

5. **Build package:**

   ```bash
   pnpm build
   ```

6. **Verify migration applied:**

   ```bash
   # Check migration status
   pnpm prisma migrate status
   ```

   Expected output:

   ```
   Database schema is up to date!
   ```

### Verification

```bash
# Option 1: Prisma Studio
pnpm studio
# Navigate to DigitalAsset, AssetProcessingLocation tables

# Option 2: psql
psql -d compilothq_development -c "
  SELECT table_name
  FROM information_schema.tables
  WHERE table_name IN ('digital_assets', 'asset_processing_locations', 'data_processing_activity_digital_assets')
"
```

Expected: All 3 tables listed

---

## Testing Environment

### Prerequisites

- Test database configured in `.env.test`
- Isolated from development database

### Automatic Application

Test migrations apply automatically via Vitest setup:

**File:** `packages/database/__tests__/setup.ts`

```typescript
beforeAll(async () => {
  // Applies all pending migrations to test database
  execSync('pnpm prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST },
  })
})
```

### Manual Application (if needed)

```bash
cd /Users/frankdevlab/WebstormProjects/compilothq/packages/database

# Apply migrations to test database
DATABASE_URL=$DATABASE_URL_TEST pnpm prisma migrate deploy
```

### Verification

```bash
# Run integration tests
pnpm test:integration -- digitalAssets

# Expected: All tests pass
```

### Test Database Reset

If test database becomes corrupted:

```bash
# Reset to clean state (DESTROYS DATA)
DATABASE_URL=$DATABASE_URL_TEST pnpm prisma migrate reset --force

# Reapply all migrations
DATABASE_URL=$DATABASE_URL_TEST pnpm prisma migrate deploy
```

---

## Staging Environment

### Prerequisites

- Staging database access credentials
- Database backup capability
- Read-only access to verify schema before applying

### Pre-Migration Checklist

- [ ] Verify current schema version
- [ ] Create database backup
- [ ] Review migration SQL
- [ ] Estimate migration duration (< 1 second for additive)
- [ ] Schedule maintenance window (optional for additive migrations)

### Step 1: Backup Database

```bash
# Set environment variables
export STAGING_DB_HOST="staging-db.example.com"
export STAGING_DB_NAME="compilothq_staging"
export STAGING_DB_USER="postgres"

# Create backup with timestamp
BACKUP_FILE="backup_staging_$(date +%Y%m%d_%H%M%S).sql"

pg_dump \
  --host=$STAGING_DB_HOST \
  --username=$STAGING_DB_USER \
  --format=custom \
  --file=$BACKUP_FILE \
  $STAGING_DB_NAME

# Verify backup created
ls -lh $BACKUP_FILE
```

### Step 2: Review Migration SQL

```bash
cd /Users/frankdevlab/WebstormProjects/compilothq/packages/database

# View migration SQL
cat prisma/migrations/20251205152202_add_digital_asset_models/migration.sql
```

Expected contents:

- CREATE TYPE statements for enums
- CREATE TABLE statements for 3 tables
- CREATE INDEX statements for 9 indexes
- ALTER TABLE statements for foreign keys

### Step 3: Apply Migration

```bash
# Set staging database URL
export DATABASE_URL="postgresql://$STAGING_DB_USER:$STAGING_DB_PASSWORD@$STAGING_DB_HOST:5432/$STAGING_DB_NAME?sslmode=require"

# Apply migration (non-interactive)
pnpm prisma migrate deploy

# Monitor output for errors
```

Expected output:

```
Applying migration `20251205152202_add_digital_asset_models`
The following migration(s) have been applied:

migrations/
  └─ 20251205152202_add_digital_asset_models/
    └─ migration.sql

All migrations have been successfully applied.
```

### Step 4: Verify Schema

```bash
# Connect to staging database
psql $DATABASE_URL -c "
  -- Verify tables exist
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name LIKE '%asset%';
"

# Verify enums exist
psql $DATABASE_URL -c "
  SELECT typname
  FROM pg_type
  WHERE typtype = 'e'
  AND typname IN ('AssetType', 'IntegrationStatus', 'LocationRole');
"

# Verify indexes exist
psql $DATABASE_URL -c "
  SELECT indexname
  FROM pg_indexes
  WHERE tablename IN ('digital_assets', 'asset_processing_locations');
"
```

### Step 5: Smoke Test

```bash
# Test insert
psql $DATABASE_URL -c "
  INSERT INTO digital_assets (
    id, organization_id, name, type, contains_personal_data
  ) VALUES (
    'test-123',
    (SELECT id FROM organizations LIMIT 1),
    'Test Asset',
    'DATABASE',
    false
  );
"

# Test query
psql $DATABASE_URL -c "
  SELECT id, name, type FROM digital_assets WHERE id = 'test-123';
"

# Cleanup test data
psql $DATABASE_URL -c "
  DELETE FROM digital_assets WHERE id = 'test-123';
"
```

### Post-Migration

- [ ] Verify schema version updated
- [ ] Run smoke tests
- [ ] Monitor error logs for 24 hours
- [ ] Update deployment documentation
- [ ] Notify team of successful migration

---

## Production Environment

### Prerequisites

- Production database access (requires elevated permissions)
- Approved change request
- Database backup strategy verified
- Rollback plan documented
- Maintenance window scheduled (optional for additive migrations)

### Pre-Migration Checklist

- [ ] Change request approved by DBA
- [ ] Migration tested in staging environment
- [ ] Database backup confirmed within last 24 hours
- [ ] Rollback SQL prepared and tested
- [ ] Team notified of migration schedule
- [ ] Monitoring alerts configured

### Step 1: Pre-Migration Health Check

```bash
# Verify database health
psql $PRODUCTION_DATABASE_URL -c "
  SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname))
  FROM pg_database
  WHERE datname = 'compilothq_production';
"

# Check active connections
psql $PRODUCTION_DATABASE_URL -c "
  SELECT count(*) FROM pg_stat_activity WHERE datname = 'compilothq_production';
"

# Verify no conflicting locks
psql $PRODUCTION_DATABASE_URL -c "
  SELECT * FROM pg_locks WHERE granted = false;
"
```

### Step 2: Create Production Backup

```bash
# Production backup with compression
BACKUP_FILE="backup_production_$(date +%Y%m%d_%H%M%S).sql.gz"

pg_dump \
  --host=$PRODUCTION_DB_HOST \
  --username=$PRODUCTION_DB_USER \
  --format=custom \
  --compress=9 \
  --file=$BACKUP_FILE \
  $PRODUCTION_DB_NAME

# Verify backup integrity
pg_restore --list $BACKUP_FILE | head -20

# Upload to secure storage (S3, etc.)
aws s3 cp $BACKUP_FILE s3://backups/database/production/
```

### Step 3: Apply Migration (Production)

```bash
# Set production database URL (use read-write credentials)
export DATABASE_URL="postgresql://$PROD_USER:$PROD_PASSWORD@$PROD_HOST:5432/$PROD_DB?sslmode=require"

# Verify migration files exist
ls -l prisma/migrations/20251205152202_add_digital_asset_models/

# Apply migration with logging
pnpm prisma migrate deploy 2>&1 | tee migration_production.log

# Check exit code
echo "Migration exit code: $?"
```

**Expected Duration:** < 5 seconds (additive migration, no data copy)

### Step 4: Production Verification

```bash
# Comprehensive verification
psql $DATABASE_URL <<EOF
-- 1. Verify tables exist
SELECT 'Tables' as check_type, count(*) as count
FROM information_schema.tables
WHERE table_name IN ('digital_assets', 'asset_processing_locations', 'data_processing_activity_digital_assets');

-- 2. Verify enums exist
SELECT 'Enums' as check_type, count(*) as count
FROM pg_type
WHERE typtype = 'e' AND typname IN ('AssetType', 'IntegrationStatus', 'LocationRole');

-- 3. Verify indexes exist
SELECT 'Indexes' as check_type, count(*) as count
FROM pg_indexes
WHERE tablename IN ('digital_assets', 'asset_processing_locations', 'data_processing_activity_digital_assets');

-- 4. Verify foreign keys exist
SELECT 'Foreign Keys' as check_type, count(*) as count
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_name IN ('digital_assets', 'asset_processing_locations', 'data_processing_activity_digital_assets');
EOF
```

Expected results:

- Tables: 3
- Enums: 3
- Indexes: 9 (plus primary key indexes)
- Foreign Keys: 8

### Step 5: Smoke Test in Production

```bash
# Test write capability (use real organization ID)
psql $DATABASE_URL -c "
  INSERT INTO digital_assets (
    id, organization_id, name, type, contains_personal_data
  )
  SELECT
    'smoke-test-' || gen_random_uuid()::text,
    id,
    'Smoke Test Asset',
    'DATABASE',
    false
  FROM organizations
  LIMIT 1
  RETURNING id;
"

# Store returned ID
SMOKE_TEST_ID="<returned-id>"

# Test read
psql $DATABASE_URL -c "
  SELECT id, name, type, created_at FROM digital_assets WHERE id = '$SMOKE_TEST_ID';
"

# Test delete (cleanup)
psql $DATABASE_URL -c "
  DELETE FROM digital_assets WHERE id = '$SMOKE_TEST_ID';
"
```

### Step 6: Post-Migration Monitoring

```bash
# Monitor error logs (first 30 minutes critical)
tail -f /var/log/postgresql/postgresql-17-main.log | grep ERROR

# Monitor application logs
kubectl logs -f deployment/web --tail=100 | grep -i "digital.*asset\|migration"

# Check for slow queries
psql $DATABASE_URL -c "
  SELECT query, calls, mean_exec_time
  FROM pg_stat_statements
  WHERE query LIKE '%digital_asset%'
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"
```

### Post-Migration Checklist

- [ ] All verification checks passed
- [ ] Smoke tests successful
- [ ] No error spikes in logs
- [ ] Application functioning normally
- [ ] Monitoring alerts configured
- [ ] Backup verified and stored securely
- [ ] Team notified of successful migration
- [ ] Documentation updated

---

## Rollback Procedures

### When to Rollback

- Migration failed with errors
- Data corruption detected
- Application errors related to new schema
- Performance degradation

### Rollback SQL (if needed)

**File:** `rollback_digital_asset_models.sql`

```sql
-- CAUTION: This destroys all Digital Asset data
-- Only use if migration applied within last hour and no production data created

BEGIN;

-- Drop junction table first (foreign key dependencies)
DROP TABLE IF EXISTS data_processing_activity_digital_assets CASCADE;

-- Drop child table
DROP TABLE IF EXISTS asset_processing_locations CASCADE;

-- Drop parent table
DROP TABLE IF EXISTS digital_assets CASCADE;

-- Drop enums (if no other usage)
DROP TYPE IF EXISTS AssetType;
DROP TYPE IF EXISTS IntegrationStatus;
DROP TYPE IF EXISTS LocationRole;

-- Verify tables dropped
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE '%asset%';

COMMIT;
```

### Rollback Procedure

1. **Stop application traffic** (if possible):

   ```bash
   kubectl scale deployment/web --replicas=0
   ```

2. **Verify no production data created**:

   ```bash
   psql $DATABASE_URL -c "
     SELECT COUNT(*) FROM digital_assets;
     SELECT COUNT(*) FROM asset_processing_locations;
   "
   ```

   If count > 0: **DO NOT ROLLBACK** - consult DBA

3. **Apply rollback SQL**:

   ```bash
   psql $DATABASE_URL -f rollback_digital_asset_models.sql
   ```

4. **Revert migration record**:

   ```bash
   psql $DATABASE_URL -c "
     DELETE FROM _prisma_migrations
     WHERE migration_name = '20251205152202_add_digital_asset_models';
   "
   ```

5. **Restart application**:
   ```bash
   kubectl scale deployment/web --replicas=3
   ```

### Alternative: Restore from Backup

If rollback SQL not safe (production data exists):

```bash
# Stop application
kubectl scale deployment/web --replicas=0

# Restore backup (DESTRUCTIVE - entire database)
pg_restore \
  --host=$PROD_HOST \
  --username=$PROD_USER \
  --dbname=$PROD_DB \
  --clean \
  --if-exists \
  $BACKUP_FILE

# Restart application
kubectl scale deployment/web --replicas=3
```

**Risk:** Loses ALL data created since backup

---

## Verification Checklist

Use this checklist after applying migration in ANY environment:

### Database Schema

- [ ] 3 tables created: `digital_assets`, `data_processing_activity_digital_assets`, `asset_processing_locations`
- [ ] 3 enums defined: `AssetType`, `IntegrationStatus`, `LocationRole`
- [ ] All foreign key constraints present
- [ ] All indexes created (9 total across 3 tables)
- [ ] No migration errors in `_prisma_migrations` table

### Application Integration

- [ ] Prisma Client regenerated (types available)
- [ ] Application builds successfully
- [ ] DAL functions importable from `@compilothq/database`
- [ ] tRPC routers mount without errors
- [ ] No TypeScript compilation errors

### Functionality

- [ ] Can create digital asset via DAL
- [ ] Can add processing locations
- [ ] Can link asset to activity
- [ ] Can query assets by organization
- [ ] Cascade deletes work correctly (test in dev only)

### Performance

- [ ] Queries complete in < 100ms (local/staging)
- [ ] Indexes being used (check EXPLAIN ANALYZE)
- [ ] No lock contention detected
- [ ] Connection pool stable

### Monitoring

- [ ] No error spikes in application logs
- [ ] No slow query alerts
- [ ] Database metrics normal (CPU, memory, connections)
- [ ] Backup successful after migration

---

## Troubleshooting

### Migration Fails: "Relation already exists"

**Cause:** Migration previously applied but `_prisma_migrations` table out of sync

**Solution:**

```bash
# Mark migration as applied without running
pnpm prisma migrate resolve --applied 20251205152202_add_digital_asset_models
```

### Prisma Client Out of Sync

**Symptom:** TypeScript errors on DigitalAsset type

**Solution:**

```bash
# Regenerate client
cd packages/database
pnpm generate
pnpm build

# Restart IDE TypeScript server
# VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Foreign Key Constraint Violation

**Symptom:** Cannot create AssetProcessingLocation - organizationId FK fails

**Cause:** Referenced organization doesn't exist

**Solution:**

```bash
# Verify organization exists
psql $DATABASE_URL -c "SELECT id, name FROM organizations WHERE id = '<org-id>';"

# If missing, create test organization first
```

### Enum Type Errors

**Symptom:** "Invalid value for enum AssetType"

**Cause:** Trying to use value not in enum definition

**Solution:**

```typescript
// Check valid values
import { AssetType } from '@compilothq/database'
console.log(Object.values(AssetType))

// Use valid enum value
createDigitalAsset({ type: 'DATABASE' }) // ✅
createDigitalAsset({ type: 'Server' }) // ❌ Invalid
```

### Index Not Being Used

**Symptom:** Slow queries despite indexes

**Diagnosis:**

```sql
EXPLAIN ANALYZE
SELECT * FROM digital_assets
WHERE organization_id = '<id>' AND type = 'DATABASE';
```

**Solution:**

- Verify index exists: `\d digital_assets` in psql
- Run `ANALYZE digital_assets;` to update statistics
- Check query uses left-most prefix of compound index

---

## Migration File Reference

**Location:** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/prisma/migrations/20251205152202_add_digital_asset_models/migration.sql`

**Size:** ~150 lines SQL

**Execution Time:** < 5 seconds (additive, no data migration)

**Reversibility:** High (drop tables, enums safe if no data)

---

## See Also

- [DAL API Reference](./DAL_API_DIGITAL_ASSETS.md)
- [Schema Design Decisions](./SCHEMA_DESIGN_DECISIONS.md)
- [Prisma Migration Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)

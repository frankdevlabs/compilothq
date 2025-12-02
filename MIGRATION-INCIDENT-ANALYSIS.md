# Migration Incident Analysis

**Date:** December 2, 2025
**Incident:** Missing database migrations for DataSubjectCategory and DataCategory models
**Status:** Schema drift detected, database inconsistency risk

---

## Executive Summary

Two feature branches (`DataSubjectCategory` and `DataCategory`) were merged into main **without creating database migrations**, violating the project's migration workflow. The schema changes were committed, but the corresponding migration files were never generated or committed. Subsequently, during a merge conflict resolution, both models were **removed from the schema entirely**, but their supporting code (DAL functions, tests, seed data) remained, creating an inconsistent codebase.

The current branch (`purpose-legal-basis-models`) is now attempting to add new models (Purpose, LegalBasis), but Prisma detected the schema has uncommitted changes and is prompting for a migration.

**Impact:**

- Database schema out of sync with application code
- Potential data loss if migrations are applied incorrectly
- Code references to non-existent models may cause runtime errors
- Blocked progress on current feature

---

## Timeline of Events

### 1. DataSubjectCategory Feature (Branch: `claude/implement-datasubject-model-01An3zE8jGrzaL4Kysegjxrf`)

**Commits:**

- `0e2d584` - docs: initialize spec folder
- `d90b594` - docs: add requirements
- `26ae46f` - docs: create specification
- `56d2f59` - docs: create tasks list
- `686e633` - ✨ feat: implement DataSubjectCategory model
- `b1d1c30` - feat: implement DataSubjectCategory model (#8) **← MERGED TO MAIN**

**What was committed:**

- ✅ Prisma schema changes (added `DataSubjectCategory` model)
- ✅ Seed data (`prisma/seeds/dataSubjectCategories.ts`)
- ✅ DAL functions (`src/dal/dataSubjectCategories.ts`)
- ✅ Integration tests (532 lines)
- ✅ Test factories
- ✅ Documentation

**What was MISSING:**

- ❌ **No migration file created** (should be `prisma/migrations/YYYYMMDDHHMMSS_add_data_subject_category/migration.sql`)
- ❌ No database schema update applied

**Root Cause:** Developer committed schema changes directly without running `prisma migrate dev` to generate migration file.

---

### 2. DataCategory Feature (Branch: separate branch, merged as #9)

**Commits:**

- `09907c9` - docs: initialize spec folder
- `862a177` - docs: add requirements
- `cd7292a` - docs: update requirements
- `27fea02` - docs: add detailed specification
- `aad176b` - docs: add tasks breakdown
- `3c2c49c` - ✨ feat: implement Personal Data Category Model
- `3326e3b` - fix: resolve merge conflict **← MERGE COMMIT**
- `6744105` - feat: Implement Personal Data Category Model (#9) **← MERGED TO MAIN**

**What was committed:**

- ✅ Prisma schema changes (added `DataCategory`, `DataCategoryDataNature`, `SensitivityLevel` enum)
- ✅ DAL functions (`src/dal/dataCategories.ts`)
- ✅ Integration tests (880 lines)
- ✅ Documentation

**What the commit message CLAIMED:**

> Migration: `20251202143622_add_data_category_model`

**What actually exists:**

- ❌ **Migration file NOT in repository**
- ❌ **Both DataCategory AND DataSubjectCategory removed from schema in merge commit `3326e3b`**

**Root Cause:**

1. Migration file generated locally but not committed to git
2. Bad merge conflict resolution removed both models from schema
3. Supporting code (DAL/tests) remained, but models disappeared

---

### 3. Current Branch: `claude/add-purpose-legal-basis-models-01NBwvyjshUcRTWFLymKvZ3D`

**Commits:**

- `f4c54a3` - docs: initialize spec folder
- `9f4079c` - docs: add requirements
- `3fd0c33` - docs: add specification
- `1cf95fc` - docs: add implementation tasks **← CURRENT HEAD**

**Current State:**

- Modified `schema.prisma` with new models: `Purpose`, `LegalBasis`
- Added 4 new enums: `PurposeCategory`, `PurposeScope`, `LegalBasisType`, `RegulatoryFramework`
- Changes are **uncommitted** (shown in `git status`)
- Prisma migrate dev detected drift and is waiting for migration name

---

## Current Database State

### Migrations Applied (6 total):

1. `20251109112743_add_reference_models`
2. `20251115155739_add_organization_user_multi_tenancy`
3. `20251121175712_add_nextauth_models`
4. `20251121190014_make_organization_optional`
5. `20251130123151_add_activity_processor_models`
6. `20251130193629_rename_activity_to_data_processing_activity` **← Last applied**

### Prisma Status:

```bash
$ npx prisma migrate status
Database schema is up to date!
```

_(This is correct - database matches last migration, but schema.prisma has uncommitted changes)_

---

## Models Currently in Schema (schema.prisma)

**Authentication (6 models):**

- Organization, User, Account, Session, VerificationToken, Invitation

**Reference Data (6 models):**

- Country, DataNature, ProcessingAct, TransferMechanism, LegalBasis _(new)_, RecipientCategory

**Data Processing (2 models):**

- DataProcessingActivity, Processor

**Compliance (1 model):**

- Purpose _(new)_

**MISSING Models:**

- ❌ DataSubjectCategory (was in commit b1d1c30, now removed)
- ❌ DataCategory (was in commit 6744105, now removed)
- ❌ DataCategoryDataNature junction table

---

## DAL Files vs Schema Mismatch

### DAL Files Present:

```bash
$ ls packages/database/src/dal/
countries.ts
dataNatures.ts
dataProcessingActivities.ts
devSessions.ts
invitations.ts
organizations.ts
processingActs.ts
processors.ts
recipientCategories.ts
transferMechanisms.ts
users.ts
```

### Seed Files Present:

```bash
$ ls packages/database/prisma/seeds/
countries.ts
dataNatures.ts
devUsers.ts
organizations.ts
processingActs.ts
recipientCategories.ts
transferMechanisms.ts
users.ts
```

**Analysis:** No orphaned DAL or seed files. The DataSubjectCategory/DataCategory code was cleaned up when models were removed.

---

## Root Cause Analysis

### Primary Causes:

1. **Workflow Violation: Schema-First Without Migrations**
   - Developers modified `schema.prisma` and committed changes
   - Did NOT run `prisma migrate dev` to generate migration files
   - Git commits included schema changes but NOT migration files

2. **Missing Pre-Commit Validation**
   - No git hook to verify migrations exist for schema changes
   - No CI check to ensure schema.prisma changes include corresponding migrations
   - Developers able to commit incomplete database changes

3. **Merge Conflict Mishandling**
   - Commit `3326e3b` resolved merge conflict
   - Commit message claims "keep both DataCategory and DataSubjectCategory relations"
   - **Reality: Both models were removed from schema.prisma**
   - Likely chose wrong side of conflict or manually edited incorrectly

4. **Parallel Feature Development Without Coordination**
   - DataSubjectCategory and DataCategory branches developed simultaneously
   - Both modified same area of schema (Compliance section)
   - No communication about overlapping changes
   - Merge conflicts inevitable

### Contributing Factors:

5. **Local-Only Migration Generation**
   - DataCategory migration `20251202143622_add_data_category_model` was created
   - File existed locally (referenced in commit message)
   - **Never committed to git repository**
   - Developer forgot `git add` step

6. **Lack of Migration Verification**
   - No automated check that migration files match schema changes
   - No review process requiring migration files in PRs
   - CI/CD doesn't validate database migration integrity

---

## How This Occurred: Step-by-Step

### DataSubjectCategory Branch:

1. Developer creates branch
2. Modifies `schema.prisma` to add `DataSubjectCategory` model
3. Writes DAL functions, tests, seed data
4. **Forgets to run `prisma migrate dev`**
5. Commits all files EXCEPT migration
6. Opens PR, gets approved (reviewer doesn't notice missing migration)
7. Merges to main - **schema change without migration**

### DataCategory Branch:

1. Developer creates branch from older main commit
2. Modifies `schema.prisma` to add `DataCategory` model
3. Writes DAL functions, tests
4. Runs `prisma migrate dev` - creates `20251202143622_add_data_category_model`
5. **Forgets to `git add` the migration file**
6. Commits schema + code, but NOT migration file
7. Attempts to merge to main - **merge conflict with DataSubjectCategory**

### Merge Conflict Resolution:

1. Git detects conflict in `schema.prisma`
2. Developer resolves conflict
3. **Accidentally removes BOTH DataSubjectCategory AND DataCategory models**
4. Writes misleading commit message: "keep both... relations"
5. Merges to main - **both features lost**

### Current Branch:

1. Developer creates new branch for Purpose/LegalBasis
2. Modifies `schema.prisma` to add new models
3. Attempts to run `prisma migrate dev`
4. Prisma detects uncommitted schema changes
5. **Blocked - waiting for migration name**

---

## Impact Assessment

### Immediate Impacts:

1. **Database Inconsistency**
   - Schema file doesn't match database structure
   - Models defined in schema don't exist in database
   - Potential for runtime errors when accessing non-existent tables

2. **Development Blocked**
   - Current feature (Purpose/LegalBasis) cannot proceed
   - Implementer agent detecting schema drift
   - Cannot create clean migration until resolved

3. **Code Integrity Issues**
   - If DataSubjectCategory/DataCategory code still referenced elsewhere
   - Import statements may fail
   - TypeScript compilation errors possible

### Risk Level: **HIGH**

**Risks:**

- Applying migrations without careful review could corrupt database
- Data loss if wrong migration strategy chosen
- Downstream services expecting certain schema structure will break
- Future migrations may conflict or fail

---

## Recommended Solution Path

### Option 1: Clean Slate (RECOMMENDED)

**Best for:** Development environment, no production data to preserve

**Steps:**

1. ✅ **Kill the running migration process** (already done)

2. **Verify current state:**

   ```bash
   cd packages/database
   npx prisma migrate status
   # Should show: "Database schema is up to date!"
   ```

3. **Commit current Purpose/LegalBasis changes:**

   ```bash
   git add packages/database/prisma/schema.prisma
   git commit -m "feat(db): add Purpose and LegalBasis models for GDPR compliance"
   ```

4. **Generate migration for Purpose/LegalBasis:**

   ```bash
   cd packages/database
   npx prisma migrate dev --name add_purpose_legal_basis_models
   ```

5. **Verify migration created:**

   ```bash
   ls prisma/migrations/ | grep purpose_legal_basis
   # Should show: 20251202HHMMSS_add_purpose_legal_basis_models/
   ```

6. **Commit the migration:**

   ```bash
   git add packages/database/prisma/migrations/
   git commit -m "db: add migration for Purpose and LegalBasis models"
   ```

7. **Document the incident** (this file)

8. **Implement preventive measures** (see Prevention section)

**Pros:**

- Clean, straightforward
- Moves forward with current feature
- Documents the loss of DataSubjectCategory/DataCategory

**Cons:**

- DataSubjectCategory and DataCategory features are lost
- Would need to re-implement if those features are needed

---

### Option 2: Recovery (if DataSubjectCategory/DataCategory are critical)

**Best for:** If those features are required and need to be restored

**Steps:**

1. **Cherry-pick the schema changes back:**

   ```bash
   # Check out the schema from before the bad merge
   git show b1d1c30:packages/database/prisma/schema.prisma > /tmp/schema_with_datasubject.prisma
   git show 3c2c49c:packages/database/prisma/schema.prisma > /tmp/schema_with_datacategory.prisma

   # Manually merge all three: current + DataSubjectCategory + DataCategory
   # This requires careful manual editing
   ```

2. **Generate consolidated migration:**

   ```bash
   npx prisma migrate dev --name add_all_missing_models
   # This will create ONE migration for:
   # - DataSubjectCategory
   # - DataCategory + DataCategoryDataNature
   # - Purpose
   # - LegalBasis
   ```

3. **Restore DAL/tests/seeds for missing models:**

   ```bash
   # Cherry-pick the implementation files
   git checkout b1d1c30 -- packages/database/src/dal/dataSubjectCategories.ts
   git checkout b1d1c30 -- packages/database/prisma/seeds/dataSubjectCategories.ts
   git checkout b1d1c30 -- packages/database/__tests__/integration/dal/dataSubjectCategories.integration.test.ts
   # (Similar for DataCategory if code still exists in commits)
   ```

4. **Run tests to verify:**
   ```bash
   cd packages/database
   pnpm test
   ```

**Pros:**

- Recovers lost features
- Comprehensive migration

**Cons:**

- Complex, error-prone
- Time-consuming
- Still need to create 1 large migration

---

### Option 3: Selective Recovery

**Best for:** Only one of the lost features is critical

**Steps:**

1. Decide which feature to recover (e.g., DataSubjectCategory)
2. Cherry-pick just that feature's schema changes
3. Add to current schema changes
4. Generate migration for current + recovered feature
5. Restore DAL/tests/seeds for that feature only

---

## Prevention: Process Improvements

### 1. Git Pre-Commit Hook (HIGH PRIORITY)

Create `.husky/pre-commit` or update existing:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check for schema changes without migrations
if git diff --cached --name-only | grep -q "packages/database/prisma/schema.prisma"; then
  # Check if there's a new migration file staged
  if ! git diff --cached --name-only | grep -q "packages/database/prisma/migrations/.*\.sql"; then
    echo "❌ ERROR: schema.prisma changed but no migration file staged"
    echo "Run: cd packages/database && npx prisma migrate dev"
    echo "Then: git add packages/database/prisma/migrations/"
    exit 1
  fi
fi
```

**Impact:** Prevents committing schema changes without migrations

---

### 2. CI/CD Validation (HIGH PRIORITY)

Add to `.github/workflows/ci.yml`:

```yaml
- name: Validate Database Migrations
  run: |
    cd packages/database
    # Check if schema matches migrations
    npx prisma migrate status
    # Should not show pending migrations
    if npx prisma migrate status | grep -q "Database schema is not up to date"; then
      echo "❌ Schema drift detected - missing migrations"
      exit 1
    fi
```

**Impact:** Catches missing migrations in CI before merge

---

### 3. PR Template Checklist

Add to `.github/pull_request_template.md`:

```markdown
## Database Changes

- [ ] No database changes in this PR
      OR
- [ ] Schema changes include corresponding migration files
- [ ] Migration tested locally and applied successfully
- [ ] Migration is reversible (down migration verified)
- [ ] Migration files committed: `prisma/migrations/YYYYMMDDHHMMSS_<name>/`
```

**Impact:** Reminds developers to include migrations in PRs

---

### 4. Migration Workflow Documentation

Update `packages/database/CLAUDE.md`:

```markdown
## ⚠️ CRITICAL: Schema Change Workflow

**ALWAYS follow this sequence:**

1. Modify `schema.prisma`
2. Run `pnpm db:migrate` (creates migration + applies to DB + regenerates client)
3. Verify migration file created in `prisma/migrations/`
4. Test migration: `pnpm test`
5. Stage BOTH schema AND migration: `git add packages/database/prisma/schema.prisma packages/database/prisma/migrations/`
6. Commit with descriptive message
7. Push to remote

**NEVER:**

- ❌ Commit schema.prisma without migration file
- ❌ Modify schema.prisma in multiple branches without coordination
- ❌ Resolve merge conflicts by removing models
- ❌ Skip testing migrations locally
```

---

### 5. Branch Protection Rules

Enable in GitHub repo settings:

- Require status check: "Validate Database Migrations" to pass
- Require review from someone with database expertise
- Prevent force pushes to main
- Require linear history (no merge commits, use rebase)

---

### 6. Migration Review Checklist

For reviewers:

- [ ] Schema changes have corresponding migration files
- [ ] Migration filename matches conventional format
- [ ] Migration is reversible (has down migration if applicable)
- [ ] Migration tested in review environment
- [ ] No destructive changes (DROP TABLE, DROP COLUMN) without data migration plan
- [ ] Indexes added for foreign keys and frequently queried columns

---

## Lessons Learned

### What Went Wrong:

1. **Schema changes committed without migrations** - core workflow violation
2. **No automated validation** - hooks/CI would have caught this
3. **Inadequate code review** - reviewers didn't notice missing migrations
4. **Poor merge conflict resolution** - removed models instead of merging properly
5. **Lack of coordination** - parallel features editing same schema area

### What Went Right:

1. **Detected before production** - issue found in development
2. **No data loss** - database still in consistent state
3. **Clean git history** - can trace exactly what happened
4. **Documentation** - commits and PRs provide audit trail

---

## Action Items

### Immediate (Today):

- [x] ~~Kill running migration process~~
- [ ] **DECISION NEEDED:** Choose Option 1, 2, or 3 above
- [ ] Execute chosen solution
- [ ] Test migrations in development environment
- [ ] Commit and push resolution

### Short-term (This Week):

- [ ] Implement pre-commit hook for schema validation
- [ ] Add CI check for migration drift
- [ ] Update PR template with database checklist
- [ ] Update database package documentation

### Long-term (This Month):

- [ ] Add branch protection rules
- [ ] Create migration review guide for team
- [ ] Set up database migration testing environment
- [ ] Schedule team training on Prisma workflow

---

## Conclusion

This incident resulted from a **workflow violation** (committing schema without migrations) compounded by **lack of automated safeguards** (no pre-commit hooks, no CI validation) and **poor merge practices** (removing models during conflict resolution).

The recommended path is **Option 1: Clean Slate** - create a clean migration for the current feature (Purpose/LegalBasis) and treat DataSubjectCategory/DataCategory as lost work that needs re-implementation if required.

**Critical takeaway:** Database migrations are not optional. Schema changes MUST always be accompanied by migration files, and this must be enforced through automation (pre-commit hooks, CI checks) rather than relying on developer discipline alone.

---

**Analysis completed by:** Claude Code
**Report generated:** 2025-12-02

---
name: Backend Migrations
description: Create and manage database migrations with reversible up/down methods, focused changes, and zero-downtime deployment considerations. Use this skill when creating or modifying migration files in directories like migrations/, db/migrate/, alembic/versions/, sequelize/migrations/, prisma/migrations/, or any database schema versioning folders. Use this when adding or altering database tables, columns, indexes, foreign keys, or constraints in migration scripts, implementing both up (apply changes) and down (rollback changes) methods for reversible migrations that allow safe rollbacks if deployments fail, writing migration scripts for ORMs and migration tools like Sequelize, Alembic, Django migrations, Rails migrations, TypeORM, Prisma migrations, Knex.js migrations, or any database migration framework, creating database indexes on large tables using concurrent creation options like CREATE INDEX CONCURRENTLY in PostgreSQL to avoid table locks that would block production traffic during deployment, separating schema migrations (structural changes like adding columns or tables) from data migrations (transforming or populating data) for safer rollbacks and clearer change tracking, planning backwards-compatible schema changes for zero-downtime deployments in high-availability systems where old and new code versions run simultaneously during rolling deployments, ensuring each migration file contains small focused changes for a single logical purpose (one migration per table change or related group of changes) to make troubleshooting and rollbacks easier, using clear descriptive naming conventions with timestamps that indicate what the migration does (like 20250101_add_email_to_users or 2025_01_01_create_products_table), ensuring migrations are never modified after being committed and deployed to version control since changing deployed migrations can cause inconsistencies across environments, and managing migration execution order carefully for database consistency especially when multiple developers are creating migrations concurrently or when merging feature branches.
---

# Backend Migrations

## When to use this skill

- When creating new database migration files in directories like `migrations/`, `db/migrate/`, `alembic/versions/`, `sequelize/migrations/`, `prisma/migrations/`, or similar
- When modifying existing migration scripts or rollback methods
- When adding or altering database tables, columns, indexes, foreign keys, or constraints
- When implementing both up and down methods for reversible migrations that enable safe rollbacks
- When separating schema changes (structural modifications) from data migrations (data transformations) for safer rollbacks
- When creating indexes on large tables with concurrent options to avoid locking production tables
- When working with ORM migration tools like Sequelize, Alembic, Django migrations, TypeORM, Prisma migrations, Rails migrations, or Knex.js
- When planning zero-downtime deployments that require backwards-compatible schema changes for rolling deployments
- When naming migration files with descriptive timestamps and purposes that clearly indicate what changes they make
- When ensuring migrations are safe for production deployment without causing downtime or data loss
- When keeping each migration focused on a single logical change (e.g., one migration to add a column, another to add an index)
- When considering deployment order and backwards compatibility for high-availability systems running multiple code versions simultaneously
- When committing new migrations to version control and ensuring they follow team conventions
- When ensuring existing migrations are never modified after they've been deployed to any environment
- When creating indexes using concurrent creation methods (e.g., `CREATE INDEX CONCURRENTLY` in PostgreSQL) to avoid table locks during deployment
- When handling migration conflicts that arise from multiple developers working on different branches
- When rolling back failed migrations to restore the database to a known good state
- When migrating data between schemas or transforming data as part of a deployment

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle backend migrations.

## Instructions

For details, refer to the information provided in this file:
[backend migrations](../../../agent-os/standards/backend/migrations.md)

---
name: Backend Migrations
description: Create and manage database migrations with reversible up/down methods, focused changes, and zero-downtime deployment considerations. Use this skill when creating or modifying migration files in directories like migrations/, db/migrate/, alembic/versions/, sequelize/migrations/, prisma/migrations/, or any database schema versioning folders. Use this when adding or altering database tables, columns, indexes, foreign keys, or constraints, implementing both up (apply) and down (rollback) methods for reversible migrations, writing migration scripts for ORMs like Sequelize, Alembic, Django migrations, Rails migrations, TypeORM, Prisma migrations, or any database migration tool, creating database indexes on large tables using concurrent creation options like CREATE INDEX CONCURRENTLY in PostgreSQL to avoid table locks, separating schema migrations from data migrations for safer rollbacks and clearer change tracking, planning backwards-compatible schema changes for zero-downtime deployments in high-availability systems, ensuring each migration file contains small focused changes for a single logical purpose (one migration per table change), using clear descriptive naming conventions with timestamps that indicate what the migration does (like 20250101_add_email_to_users), ensuring migrations are never modified after being committed and deployed to version control, and managing migration execution order carefully for database consistency.
---

# Backend Migrations

## When to use this skill:

- When creating new database migration files in directories like `migrations/`, `db/migrate/`, `alembic/versions/`, `sequelize/migrations/`, or similar
- When modifying existing migration scripts or rollback methods
- When adding or altering database tables, columns, indexes, foreign keys, or constraints
- When implementing both up and down methods for reversible migrations
- When separating schema changes from data migrations for safer rollbacks
- When creating indexes on large tables with concurrent options to avoid locking
- When working with ORM migration tools like Sequelize, Alembic, Django migrations, TypeORM, Prisma migrations, or Rails migrations
- When planning zero-downtime deployments that require backwards-compatible schema changes
- When naming migration files with descriptive timestamps and purposes
- When ensuring migrations are safe for production deployment
- When keeping each migration focused on a single logical change (e.g., one migration to add a column, another to add an index)
- When considering deployment order and backwards compatibility for high-availability systems
- When committing new migrations to version control
- When ensuring existing migrations are never modified after they've been deployed
- When creating indexes using concurrent creation methods (e.g., `CREATE INDEX CONCURRENTLY` in PostgreSQL) to avoid table locks

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle backend migrations.

## Instructions

For details, refer to the information provided in this file:
[backend migrations](../../../agent-os/standards/backend/migrations.md)

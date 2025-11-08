---
name: Backend Migrations
description: Create and manage database migrations with reversible up/down methods, focused changes, and zero-downtime deployment considerations. Use this skill when creating or modifying database migration files, schema change scripts, migration definition files in directories like migrations/, db/migrate/, alembic/versions/, sequelize/migrations/, or similar migration folders. This skill applies when adding or modifying database tables, columns, indexes, or constraints, implementing rollback methods for migrations, managing data migrations separately from schema changes, creating database indexes on large tables, writing migration scripts for ORMs like Sequelize, Alembic, Django migrations, Rails migrations, TypeORM, Prisma, or any database versioning tool. Use this when ensuring each migration contains small, focused changes for a single logical purpose, implementing backwards-compatible schema changes for high-availability systems, creating indexes with concurrent options to avoid table locks, using clear descriptive naming conventions that indicate what the migration does, and ensuring migrations are never modified after deployment to version control.
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

---
name: Backend Queries
description: Write secure and optimized database queries using parameterized queries, preventing SQL injection, avoiding N+1 queries through eager loading, selecting only needed columns, and using transactions for related operations. Use this skill when writing database queries using ORM query methods, raw SQL, or query builders in repository files, data access layer files, service files, or any backend code that fetches or manipulates database data. Use this when writing ORM queries with methods like findAll, findOne, findMany, where, include, select, joins, or populate, writing raw SQL queries safely using parameterized inputs or prepared statements (never string interpolation or concatenation), optimizing queries to prevent N+1 problems by using eager loading with include/populate or SQL joins to fetch related data in a single query instead of multiple sequential queries, implementing database transactions to wrap related operations that must succeed or fail together for data consistency, selecting only specific columns needed (SELECT id, name, email) instead of fetching all columns with SELECT *, indexing database columns that are frequently used in WHERE clauses, JOIN conditions, or ORDER BY statements for query performance, setting up query timeouts to prevent long-running or runaway queries from impacting system performance, caching results of complex or frequently-executed queries to improve response times and reduce database load, using query builders like Knex.js, Prisma client, or ORM query APIs to construct safe parameterized queries, debugging slow queries using database query analysis tools or logging, ensuring all user-provided input is safely handled through parameterized queries or ORM methods to prevent SQL injection attacks, and wrapping multiple related database operations in transactions with proper error handling and rollback mechanisms.
---

# Backend Queries

## When to use this skill:

- When writing database queries using ORM methods like findAll, findOne, where, include, or raw SQL queries
- When working on repository files, data access layers, or service files that query databases
- When implementing query builders using tools like Knex.js, SQLAlchemy query API, or ActiveRecord
- When preventing SQL injection by using parameterized queries or prepared statements
- When optimizing queries to avoid N+1 problems by using eager loading (include, populate) or joins
- When selecting only necessary columns instead of fetching all data with SELECT \*
- When wrapping related database operations in transactions for data consistency
- When implementing query timeouts to prevent runaway queries
- When adding caching strategies for expensive or frequently-executed queries
- When indexing columns used in WHERE, JOIN, or ORDER BY clauses
- When debugging slow queries or implementing query performance optimizations
- When ensuring user input is never interpolated directly into SQL strings (always use parameterized queries)
- When using eager loading or joins to fetch related data in one query instead of multiple sequential queries
- When selecting specific columns (e.g., `SELECT id, name, email` instead of `SELECT *`)
- When implementing transactions to ensure all related changes succeed or fail together
- When setting timeouts on long-running queries to prevent them from impacting system performance
- When caching results of complex or frequently-executed queries to improve response times

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle backend queries.

## Instructions

For details, refer to the information provided in this file:
[backend queries](../../../agent-os/standards/backend/queries.md)

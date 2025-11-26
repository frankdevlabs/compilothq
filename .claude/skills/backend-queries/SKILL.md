---
name: Backend Queries
description: Write secure and optimized database queries using parameterized queries, preventing SQL injection, avoiding N+1 queries through eager loading, selecting only needed columns, and using transactions for related operations. Use this skill when writing database queries using ORM query methods, raw SQL, or query builders in repository files, data access layer files, service files, or any backend code that fetches or manipulates database data. Use this when writing ORM queries with methods like findAll, findOne, findMany, where, include, select, joins, or populate to retrieve data from databases, writing raw SQL queries safely using parameterized inputs or prepared statements (never string interpolation or concatenation) to prevent SQL injection attacks, optimizing queries to prevent N+1 problems by using eager loading with include/populate or SQL joins to fetch related data in a single query instead of multiple sequential queries that degrade performance, implementing database transactions to wrap related operations that must succeed or fail together for data consistency such as transferring money between accounts or creating related records, selecting only specific columns needed (SELECT id, name, email) instead of fetching all columns with SELECT * to reduce memory usage and network transfer, indexing database columns that are frequently used in WHERE clauses, JOIN conditions, or ORDER BY statements for query performance improvements, setting up query timeouts to prevent long-running or runaway queries from impacting system performance and blocking other database operations, caching results of complex or frequently-executed queries to improve response times and reduce database load using in-memory caches or query result caches, using query builders like Knex.js, Prisma client, SQLAlchemy query API, or ORM query APIs to construct safe parameterized queries with type safety, debugging slow queries using database query analysis tools, EXPLAIN statements, or logging to identify bottlenecks and optimization opportunities, ensuring all user-provided input is safely handled through parameterized queries or ORM methods to prevent SQL injection attacks and never concatenating user input directly into SQL strings, and wrapping multiple related database operations in transactions with proper error handling and rollback mechanisms to maintain data consistency even when errors occur.
---

# Backend Queries

## When to use this skill

- When writing database queries using ORM methods like findAll, findOne, where, include, select, joins, or populate
- When working on repository files, data access layers (DAL), or service files that query databases
- When implementing query builders using tools like Knex.js, Prisma client, SQLAlchemy query API, or ActiveRecord
- When preventing SQL injection by using parameterized queries or prepared statements instead of string concatenation
- When optimizing queries to avoid N+1 problems by using eager loading (include, populate) or joins to fetch related data
- When selecting only necessary columns instead of fetching all data with SELECT \* to improve performance
- When wrapping related database operations in transactions for data consistency (e.g., transferring funds, creating related records)
- When implementing query timeouts to prevent runaway queries that could impact system performance
- When adding caching strategies for expensive or frequently-executed queries to reduce database load
- When indexing columns used in WHERE, JOIN, or ORDER BY clauses for query performance
- When debugging slow queries using EXPLAIN statements or implementing query performance optimizations
- When ensuring user input is never interpolated directly into SQL strings (always use parameterized queries)
- When using eager loading or joins to fetch related data in one query instead of multiple sequential queries
- When selecting specific columns (e.g., `SELECT id, name, email` instead of `SELECT *`) to reduce memory and network usage
- When implementing transactions to ensure all related changes succeed or fail together
- When setting timeouts on long-running queries to prevent them from impacting system performance
- When caching results of complex or frequently-executed queries to improve response times
- When working with raw SQL queries and needing to ensure they're safe from SQL injection
- When refactoring queries to improve performance or reduce the number of database round-trips
- When analyzing query execution plans to identify slow queries or missing indexes

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle backend queries.

## Instructions

For details, refer to the information provided in this file:
[backend queries](../../../agent-os/standards/backend/queries.md)

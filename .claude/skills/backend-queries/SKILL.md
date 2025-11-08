---
name: Backend Queries
description: Write secure and optimized database queries using parameterized queries, preventing SQL injection, avoiding N+1 queries through eager loading, selecting only needed columns, and using transactions for related operations. Use this skill when writing database queries using raw SQL, query builders, or ORM methods, working on files that fetch data from databases, implementing data access layers, repository pattern files, service files that interact with databases, or query utility files. This skill applies when using ORM query methods (findAll, findOne, where, include, joins), writing raw SQL queries safely with parameterized inputs, optimizing queries to prevent N+1 problems with eager loading or joins, implementing database transactions for data consistency, setting up query timeouts, caching expensive or frequently-run queries, selecting specific columns instead of using SELECT *. Use this when ensuring all user input is safely handled through parameterized queries or ORM methods (never string interpolation), using eager loading or joins to fetch related data in a single query, requesting only the columns needed rather than all columns, indexing columns used in WHERE, JOIN, and ORDER BY clauses, wrapping related database operations in transactions to maintain data consistency, implementing query timeouts to prevent runaway queries, and caching results of complex or frequently-executed queries when appropriate.
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

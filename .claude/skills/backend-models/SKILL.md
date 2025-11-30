---
name: Backend Models
description: Define and structure database models with clear naming conventions, timestamps, data integrity constraints, appropriate data types, and relationship definitions. Use this skill when creating or modifying database model files in directories like models/, entities/, schemas/, src/models/, app/models/, or any ORM model definition folders. Use this when defining model classes with ORMs like Sequelize, TypeORM, Prisma schema, Django ORM models, Rails ActiveRecord models, SQLAlchemy models, Mongoose schemas, or any database ORM framework, adding or modifying database constraints like NOT NULL, UNIQUE, CHECK constraints, or foreign key relationships to enforce data integrity at the database level, defining model relationships such as hasMany, belongsTo, hasOne, belongsToMany, ManyToMany, or OneToMany associations between entities to represent how data is connected, implementing validation rules at the model layer for data integrity including required fields, format validation, and custom business rule validation, choosing appropriate data types for columns like string, integer, boolean, date, datetime, JSON, text, decimal, UUID, enum based on the data's purpose and how it will be queried, indexing foreign keys and frequently queried columns for query performance to speed up common queries and joins, including createdAt and updatedAt timestamp fields on all tables for auditing and debugging to track when records are created or modified, using singular names for model classes (User, Product, Order) and plural names for database tables (users, products, orders) following ORM conventions, enforcing data integrity rules at the database level using constraints for defense in depth rather than relying solely on application-level validation, defining relationships with appropriate cascade behaviors like CASCADE for dependent deletes where child records should be removed, SET NULL for optional relationships where references can be cleared, or RESTRICT to prevent orphaned records by blocking deletes, balancing database normalization with practical query performance needs to avoid over-normalization that would require excessive joins, and implementing validation at both the model layer and database layer for comprehensive data protection against invalid data.
---

# Backend Models

## When to use this skill

- When creating or modifying database model files in directories like `models/`, `entities/`, `schemas/`, `src/models/`, or similar
- When defining ORM models using Sequelize, TypeORM, Prisma, Django ORM, Rails ActiveRecord, SQLAlchemy, Mongoose, or other ORM frameworks
- When adding or modifying model properties, columns, or attributes in database schema definitions
- When implementing database constraints like NOT NULL, UNIQUE, CHECK, or foreign key constraints
- When defining relationships between models (one-to-one, one-to-many, many-to-many)
- When adding timestamps (createdAt, updatedAt) for auditing and debugging
- When implementing validation logic at the model layer for data integrity
- When choosing appropriate data types for model fields (string, integer, boolean, date, JSON, text, decimal, UUID, enum)
- When adding indexes to foreign keys or frequently queried columns for performance optimization
- When defining cascade behaviors for related records (CASCADE, SET NULL, RESTRICT)
- When balancing normalization with query performance needs
- When using singular names for model classes (e.g., `User`, `Product`) and plural names for database tables (e.g., `users`, `products`)
- When including created and updated timestamps on all tables for tracking when records are created or modified
- When enforcing data integrity rules at the database level using constraints for defense in depth
- When implementing validation at both the model layer and database layer for comprehensive data protection
- When defining clear relationship names and cascade behaviors for foreign keys
- When avoiding over-normalization that would hurt query performance with excessive joins
- When working with schema files like Prisma schema.prisma or Sequelize model definitions
- When migrating between different ORM systems or refactoring model structures
- When adding custom validations or hooks to model lifecycle events

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle backend models.

## Instructions

For details, refer to the information provided in this file:
[backend models](../../../agent-os/standards/backend/models.md)

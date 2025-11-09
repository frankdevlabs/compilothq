---
name: Backend Models
description: Define and structure database models with clear naming conventions, timestamps, data integrity constraints, appropriate data types, and relationship definitions. Use this skill when creating or modifying database model files in directories like models/, entities/, schemas/, src/models/, app/models/, or any ORM model definition folders. Use this when defining model classes with ORMs like Sequelize, TypeORM, Prisma schema, Django ORM models, Rails ActiveRecord models, SQLAlchemy models, Mongoose schemas, or any database ORM framework, adding or modifying database constraints like NOT NULL, UNIQUE, CHECK constraints, or foreign key relationships, defining model relationships such as hasMany, belongsTo, hasOne, belongsToMany, ManyToMany, or OneToMany associations between entities, implementing validation rules at the model layer for data integrity, choosing appropriate data types for columns like string, integer, boolean, date, datetime, JSON, text, decimal, UUID based on the data's purpose, indexing foreign keys and frequently queried columns for query performance, including createdAt and updatedAt timestamp fields on all tables for auditing and debugging, using singular names for model classes (User, Product, Order) and plural names for database tables (users, products, orders), enforcing data integrity rules at the database level using constraints for defense in depth, defining relationships with appropriate cascade behaviors like CASCADE for dependent deletes, SET NULL for optional relationships, or RESTRICT to prevent orphaned records, balancing database normalization with practical query performance needs to avoid over-normalization, and implementing validation at both the model layer and database layer for comprehensive data protection.
---

# Backend Models

## When to use this skill:

- When creating or modifying database model files in directories like `models/`, `entities/`, `schemas/`, or similar
- When defining ORM models using Sequelize, TypeORM, Prisma, Django ORM, Rails ActiveRecord, SQLAlchemy, or other ORM frameworks
- When adding or modifying model properties, columns, or attributes
- When implementing database constraints like NOT NULL, UNIQUE, CHECK, or foreign key constraints
- When defining relationships between models (one-to-one, one-to-many, many-to-many)
- When adding timestamps (createdAt, updatedAt) for auditing and debugging
- When implementing validation logic at the model layer
- When choosing appropriate data types for model fields (string, integer, boolean, date, JSON, text, decimal, etc.)
- When adding indexes to foreign keys or frequently queried columns for performance
- When defining cascade behaviors for related records (CASCADE, SET NULL, RESTRICT)
- When balancing normalization with query performance needs
- When using singular names for model classes (e.g., `User`, `Product`) and plural names for database tables (e.g., `users`, `products`)
- When including created and updated timestamps on all tables for tracking when records are created or modified
- When enforcing data integrity rules at the database level using constraints
- When implementing validation at both the model layer and database layer for defense in depth
- When defining clear relationship names and cascade behaviors for foreign keys
- When avoiding over-normalization that would hurt query performance

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle backend models.

## Instructions

For details, refer to the information provided in this file:
[backend models](../../../agent-os/standards/backend/models.md)

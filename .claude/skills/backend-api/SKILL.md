---
name: Backend API
description: Design and implement RESTful API endpoints following REST principles, consistent naming conventions, versioning strategies, and proper HTTP methods. Use this skill when creating or modifying API route handlers, API endpoint files, controller files, route definition files (routes.js, routes.ts, api.py, routes.rb), middleware for API endpoints, or any backend code that handles HTTP requests and responses. This skill applies when designing API URL structures, implementing CRUD operations via REST endpoints, defining query parameters for filtering/sorting/pagination, setting up API versioning, configuring HTTP status codes and error responses, implementing rate limiting, or working with nested resource endpoints. Use this when ensuring plural nouns for resource endpoints (e.g., /users, /products), limiting nested resource depth to 2-3 levels, choosing appropriate HTTP methods (GET, POST, PUT, PATCH, DELETE), returning correct status codes (200, 201, 400, 404, 500), and including rate limiting headers in responses.
---

# Backend API

## When to use this skill:

- When creating or modifying API route handlers, controllers, or endpoint definitions
- When working on files like `routes.js`, `routes.ts`, `api.py`, `routes.rb`, `controllers/*`, `routes/*`, `api/*`, or similar API routing files
- When designing RESTful API URL structures and resource endpoints
- When implementing CRUD operations (GET, POST, PUT, PATCH, DELETE) for resources
- When setting up API versioning strategies (URL path-based like `/v1/users` or header-based)
- When defining query parameters for filtering, sorting, pagination, or search functionality
- When configuring HTTP status codes and standardizing API error responses
- When implementing rate limiting or API usage tracking
- When working with nested resource relationships in API endpoints (e.g., `/users/:id/posts`)
- When creating middleware that processes API requests or responses
- When ensuring consistent naming conventions (lowercase, hyphenated or underscored endpoints)
- When using plural nouns for resource collections (e.g., `/users`, `/products`, `/orders`)
- When limiting nesting depth to 2-3 levels for URL readability
- When choosing between different HTTP methods for the same resource
- When returning appropriate status codes (200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Internal Server Error)
- When adding rate limit information to response headers

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle backend API.

## Instructions

For details, refer to the information provided in this file:
[backend API](../../../agent-os/standards/backend/api.md)

---
name: Backend API
description: Design and implement RESTful API endpoints following REST principles, consistent naming conventions, versioning strategies, and proper HTTP methods. Use this skill when creating or modifying API route handlers in files like routes.js, routes.ts, api.py, routes.rb, controllers/*.js, controllers/*.ts, api/*.js, or any backend files that define HTTP endpoints and handle requests/responses. Use this when implementing CRUD operations with appropriate HTTP methods (GET for retrieving data, POST for creating new resources, PUT/PATCH for updating existing resources, DELETE for removing resources), designing RESTful URL structures with plural resource nouns like /users, /products, or /orders that follow REST conventions, setting up API versioning in URL paths like /v1/users or /api/v2/products or via headers for backward compatibility, defining query parameters for filtering collections (?status=active), sorting data (?sort=createdAt:desc), pagination (?page=2&limit=20), and search functionality (?q=search+term), configuring and returning appropriate HTTP status codes including 200 OK for successful GET requests, 201 Created for successful POST requests, 400 Bad Request for client errors and invalid input, 404 Not Found when resources don't exist, and 500 Internal Server Error for server-side errors, working with nested resource endpoints representing relationships like /users/:id/posts or /organizations/:id/members while limiting nesting depth to 2-3 levels maximum for URL readability and maintainability, implementing rate limiting mechanisms to prevent API abuse and DoS attacks and tracking API usage metrics for monitoring and analytics, creating middleware functions that process API requests or responses for cross-cutting concerns like authentication, logging, CORS handling, request validation, or response transformation, ensuring consistent lowercase hyphenated or underscored endpoint naming throughout the API (e.g., /api/user-profiles or /api/user_profiles, not mixed styles), and including rate limit information in response headers like X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset to inform clients of their quota status.
---

# Backend API

## When to use this skill

- When creating or modifying API route handlers, controllers, or endpoint definitions in backend code
- When working on files like `routes.js`, `routes.ts`, `api.py`, `routes.rb`, `controllers/*`, `routes/*`, `api/*`, or similar API routing files
- When designing RESTful API URL structures and resource endpoints with proper HTTP methods
- When implementing CRUD operations (GET for reads, POST for creates, PUT/PATCH for updates, DELETE for deletes)
- When setting up API versioning strategies using URL path-based versioning like `/v1/users` or `/api/v2/products` or header-based versioning
- When defining query parameters for filtering collections, sorting data, pagination, or search functionality
- When configuring HTTP status codes and standardizing API error responses across endpoints
- When implementing rate limiting or API usage tracking to prevent abuse and monitor performance
- When working with nested resource relationships in API endpoints (e.g., `/users/:id/posts` or `/organizations/:id/members`)
- When creating middleware that processes API requests or responses for authentication, logging, CORS, or validation
- When ensuring consistent naming conventions (lowercase, hyphenated or underscored endpoints) throughout the API
- When using plural nouns for resource collections (e.g., `/users`, `/products`, `/orders`) following REST conventions
- When limiting nesting depth to 2-3 levels for URL readability and maintainability
- When choosing between different HTTP methods for the same resource (GET vs POST vs PUT vs PATCH vs DELETE)
- When returning appropriate status codes (200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Internal Server Error)
- When adding rate limit information to response headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- When building RESTful APIs that follow industry standards and best practices for web services
- When refactoring existing API endpoints to improve consistency and follow REST principles
- When documenting API endpoints with OpenAPI/Swagger specifications or similar API documentation tools

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle backend API.

## Instructions

For details, refer to the information provided in this file:
[backend API](../../../agent-os/standards/backend/api.md)

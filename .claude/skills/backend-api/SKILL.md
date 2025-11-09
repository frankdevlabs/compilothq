---
name: Backend API
description: Design and implement RESTful API endpoints following REST principles, consistent naming conventions, versioning strategies, and proper HTTP methods. Use this skill when creating or modifying API route handlers in files like routes.js, routes.ts, api.py, routes.rb, controllers/*.js, controllers/*.ts, api/*.js, or any backend files that define HTTP endpoints and handle requests/responses. Use this when implementing CRUD operations (GET for reads, POST for creates, PUT/PATCH for updates, DELETE for deletes), designing RESTful URL structures with plural resource nouns like /users or /products, setting up API versioning in URL paths like /v1/users or via headers, defining query parameters for filtering/sorting/pagination/search, configuring appropriate HTTP status codes (200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Internal Server Error), working with nested resource endpoints like /users/:id/posts, implementing rate limiting and usage tracking, creating middleware that processes API requests or responses, ensuring consistent lowercase hyphenated or underscored endpoint naming, limiting nested resource depth to 2-3 levels maximum for readability, and including rate limit information in response headers.
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

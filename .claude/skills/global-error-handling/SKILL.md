---
name: Global Error Handling
description: Implement robust error handling with user-friendly messages, fail-fast validation, specific exception types, centralized error boundaries, graceful degradation, retry strategies, and proper resource cleanup. Use this skill when writing try-catch blocks or exception handling code in any programming language, implementing error boundaries in React or similar error handling patterns in other frameworks, handling API errors and HTTP error responses, validating user input and function preconditions, creating custom error classes or exception types for specific failure scenarios, implementing retry logic with exponential backoff for external service calls or network requests, or ensuring proper resource cleanup in finally blocks or equivalent mechanisms. Use this when providing clear, actionable error messages to end users without exposing technical implementation details, stack traces, or security-sensitive information, validating input parameters and checking preconditions early in functions and failing fast with clear error messages rather than allowing invalid state to propagate through the system, using specific exception or error types like ValidationError, NotFoundError, UnauthorizedError, DatabaseError instead of generic Error or Exception to enable targeted error handling and recovery, handling errors at appropriate architectural boundaries like controllers, API route handlers, or middleware rather than scattering try-catch blocks throughout business logic, designing systems to degrade gracefully when non-critical services or features fail rather than breaking the entire application, implementing exponential backoff retry strategies for transient failures when calling external APIs, databases, or third-party services to handle temporary network issues or rate limiting, always cleaning up resources like file handles, database connections, network sockets, or locks in finally blocks or using language-specific mechanisms like Python's with statement or Go's defer, logging errors with appropriate context and stack traces for debugging while showing sanitized messages to users, creating centralized error handling middleware or error boundary components to handle errors consistently across the application, throwing errors early when something goes wrong rather than returning null/undefined and checking for it everywhere, and implementing circuit breaker patterns for external service dependencies to prevent cascading failures.
---

# Global Error Handling

## When to use this skill:

- When implementing try-catch blocks or error handling logic in any language
- When creating custom error classes or exception types for specific failure scenarios
- When handling API errors and returning appropriate HTTP status codes
- When validating user input and checking preconditions early in functions
- When implementing error boundaries in React or similar error handling patterns
- When centralizing error handling at appropriate boundaries (controllers, API layers, middleware)
- When providing user-friendly error messages without exposing technical details or security information
- When implementing retry strategies with exponential backoff for external service calls
- When ensuring graceful degradation when non-critical services fail
- When cleaning up resources (file handles, database connections, network sockets) in finally blocks
- When using specific exception types (ValidationError, NotFoundError) instead of generic Error
- When failing fast with clear error messages rather than allowing invalid state to propagate
- When logging errors with appropriate context for debugging without exposing sensitive data to users
- When providing clear, actionable error messages to users without exposing technical details or security information
- When validating input and checking preconditions early and failing with clear error messages rather than allowing invalid state to continue
- When using specific exception/error types (like ValidationError, NotFoundError, UnauthorizedError) rather than generic Error to enable targeted handling
- When handling errors at appropriate boundaries (controllers, API layers) rather than scattering try-catch blocks everywhere
- When designing systems to degrade gracefully when non-critical services fail rather than breaking entirely
- When implementing exponential backoff for transient failures in external service calls (e.g., retrying with increasing delays)
- When always cleaning up resources (file handles, database connections, network sockets) in finally blocks or equivalent mechanisms

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle global error handling.

## Instructions

For details, refer to the information provided in this file:
[global error handling](../../../agent-os/standards/global/error-handling.md)

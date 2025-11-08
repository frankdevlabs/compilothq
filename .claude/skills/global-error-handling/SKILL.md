---
name: Global Error Handling
description: Implement robust error handling with user-friendly messages, fail-fast validation, specific exception types, centralized error boundaries, graceful degradation, retry strategies, and proper resource cleanup. Use this skill when writing try-catch blocks, implementing error boundaries, handling API errors, validating user input, creating custom error classes, implementing retry logic for external services, or ensuring resource cleanup with finally blocks. This skill applies when providing clear error messages without exposing sensitive details, validating input early and failing explicitly, using specific exception types instead of generic ones, centralizing error handling at API or controller boundaries, implementing exponential backoff for transient failures, ensuring graceful degradation when services fail, cleaning up resources like file handles or database connections. Use this when providing clear, actionable error messages to users without exposing technical details or security information, validating input and checking preconditions early and failing with clear error messages rather than allowing invalid state, using specific exception/error types rather than generic ones to enable targeted handling, handling errors at appropriate boundaries (controllers, API layers) rather than scattering try-catch blocks everywhere, designing systems to degrade gracefully when non-critical services fail rather than breaking entirely, implementing exponential backoff for transient failures in external service calls, and always cleaning up resources (file handles, connections) in finally blocks or equivalent mechanisms.
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

---
name: Global Validation
description: Implement comprehensive validation with server-side enforcement, client-side UX feedback, early input validation, specific error messages, allowlists over blocklists, type checking, input sanitization, and business rule validation. Use this skill when validating user input in forms, API endpoints, or data processing, implementing validation schemas, checking data types and formats, sanitizing input to prevent injection attacks, or validating business rules. This skill applies when always validating on the server side for security, adding client-side validation for immediate user feedback, failing early by rejecting invalid input before processing, providing field-specific error messages, using allowlists to define valid input instead of blocklists, checking types/formats/ranges/required fields, sanitizing input to prevent SQL injection/XSS/command injection, validating business rules at appropriate layers. Use this when always validating on the server and never trusting client-side validation alone for security or data integrity, using client-side validation to provide immediate user feedback but duplicating checks server-side, validating input as early as possible and rejecting invalid data before processing, providing clear field-specific error messages that help users correct their input, defining what is allowed rather than trying to block everything that's not (allowlists over blocklists), checking data types, formats, ranges, and required fields systematically, sanitizing user input to prevent injection attacks (SQL, XSS, command injection), validating business rules (e.g., sufficient balance, valid dates) at the appropriate application layer, and applying validation consistently across all entry points (web forms, API endpoints, background jobs).
---

# Global Validation

## When to use this skill:

- When implementing form validation for user input in web applications
- When validating data received through API endpoints or request handlers
- When creating validation schemas using tools like Zod, Yup, Joi, or built-in validators
- When ensuring server-side validation for security and data integrity (never trust client-side alone)
- When adding client-side validation to provide immediate feedback for better user experience
- When validating input early and rejecting invalid data before further processing
- When providing clear, field-specific error messages that help users correct mistakes
- When using allowlists to define what input is acceptable rather than blocking everything invalid
- When checking data types, formats (email, phone, date), ranges, and required fields
- When sanitizing user input to prevent SQL injection, XSS, or command injection attacks
- When validating business rules like sufficient account balance, valid date ranges, or authorization
- When ensuring validation is applied consistently across all entry points (forms, APIs, background jobs)
- When implementing validation at model, controller, and form layers as appropriate
- When always validating on the server and never trusting client-side validation alone for security or data integrity
- When using client-side validation to provide immediate user feedback but duplicating all checks server-side
- When validating input as early as possible and rejecting invalid data before processing begins
- When providing clear, field-specific error messages that help users correct their input
- When defining what input is allowed (allowlists) rather than trying to block everything that's not (blocklists)
- When checking data types, formats, ranges, and required fields systematically
- When sanitizing user input to prevent injection attacks (SQL injection, XSS, command injection)
- When validating business rules (e.g., sufficient account balance, valid date ranges) at the appropriate application layer
- When applying validation consistently across all entry points (web forms, API endpoints, background jobs)

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle global validation.

## Instructions

For details, refer to the information provided in this file:
[global validation](../../../agent-os/standards/global/validation.md)

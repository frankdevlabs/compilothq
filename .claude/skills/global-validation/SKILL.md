---
name: Global Validation
description: Implement comprehensive validation with server-side enforcement, client-side UX feedback, early input validation, specific error messages, allowlists over blocklists, type checking, input sanitization, and business rule validation. Use this skill when validating user input in web forms, validating data received through API endpoints or request handlers, implementing validation schemas using tools like Zod, Yup, Joi, class-validator, or built-in validators, checking data types and formats like email addresses, phone numbers, dates, URLs, or custom patterns, sanitizing user input to prevent injection attacks, or validating business rules and constraints at the appropriate application layers. Use this when always implementing server-side validation for security and data integrity and never trusting client-side validation alone as it can be bypassed, adding client-side validation using HTML5 validation attributes or JavaScript to provide immediate user feedback and improve user experience while duplicating all validation checks on the server side, validating input parameters and data as early as possible in the request lifecycle and rejecting invalid data with clear error messages before any processing occurs, providing clear, field-specific error messages that help users understand what went wrong and how to correct their input instead of generic error messages, using allowlists (defining what input is acceptable like specific values, patterns, or formats) rather than blocklists (trying to block everything invalid) for more secure and maintainable validation, systematically checking data types, formats (email, phone, date, URL), numeric ranges, string lengths, and required fields for completeness, sanitizing user input to prevent injection attacks including SQL injection by using parameterized queries, XSS by escaping HTML output, and command injection by avoiding shell execution with user input, validating business rules and domain-specific constraints (like sufficient account balance, valid date ranges, authorized access) at the appropriate application layer such as service layer or domain models, applying validation consistently across all data entry points including web forms, API endpoints, GraphQL resolvers, background job inputs, and file uploads, using validation schema libraries like Zod or Yup to define reusable validation rules that can be shared between client and server, and returning validation errors in a structured format with field names and specific error messages for better error handling on the client side.
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

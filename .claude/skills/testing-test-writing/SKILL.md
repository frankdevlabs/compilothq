---
name: Testing Test Writing
description: Write minimal, strategic tests focused on core user flows and critical paths during feature development, testing behavior over implementation, using clear descriptive names, mocking external dependencies, and keeping tests fast. Use this skill when writing unit tests for functions, classes, or modules in test files, creating integration tests that verify multiple components work together correctly, writing end-to-end tests for critical user workflows and user journeys, deciding what to test and when during development, creating test files in directories like tests/, __tests__/, spec/, or test/, or ensuring test coverage for primary user flows and business-critical functionality. Use this when writing minimal, strategic tests during development instead of testing every change or intermediate implementation step, focusing on completing feature implementation first and then adding tests only at logical completion points rather than continuously during development, writing tests exclusively for critical paths, core user flows, and primary workflows while skipping tests for non-critical utility functions and secondary workflows, deferring edge case testing, error state testing, and extensive validation logic testing unless they are business-critical or part of core functionality, focusing tests on what the code does (behavior and outcomes) rather than how it does it (implementation details) to reduce test brittleness when refactoring, using clear, descriptive test names that explain what is being tested and the expected outcome (like "should return 404 when user not found" or "should calculate total with tax correctly"), mocking external dependencies like databases, third-party APIs, file systems, network requests, and other external services to isolate the unit being tested and improve test reliability, keeping unit tests fast by ensuring they execute in milliseconds so developers run them frequently during development without friction, working with test frameworks like Jest, Vitest, RSpec, pytest, JUnit, Mocha, Jasmine, or similar testing tools, avoiding over-testing of trivial getter/setter methods or simple utility functions that provide little value, testing at the appropriate level (unit tests for business logic, integration tests for API endpoints, end-to-end tests for complete user journeys), and ensuring tests are maintainable and easy to understand for the development team.
---

# Testing Test Writing

## When to use this skill:

- When writing unit tests for functions, classes, or modules in test files
- When creating integration tests that verify multiple components work together
- When writing end-to-end tests for critical user workflows and primary paths
- When deciding whether to write tests during development (minimal, strategic tests only)
- When focusing on completing feature implementation before adding comprehensive tests
- When testing core user flows and business-critical functionality only
- When deferring edge case testing, error states, and non-critical validation until later
- When writing descriptive test names that clearly explain what's being tested and expected behavior
- When testing behavior and outcomes rather than implementation details to reduce brittleness
- When mocking external dependencies (databases, APIs, third-party services, file systems)
- When ensuring unit tests execute quickly (milliseconds) for frequent developer use
- When working with test frameworks like Jest, RSpec, pytest, JUnit, Mocha, or similar
- When avoiding over-testing intermediate development steps or minor utility functions
- When writing minimal tests during development and not testing every change or intermediate step
- When focusing on completing feature implementation first and then adding strategic tests only at logical completion points
- When writing tests exclusively for critical paths and primary user workflows and skipping tests for non-critical utilities and secondary workflows
- When deferring edge case testing, error states, and validation logic unless they are business-critical
- When focusing tests on what the code does (behavior) not how it does it (implementation) to reduce brittleness
- When using descriptive test names that explain what's being tested and the expected outcome (e.g., "should return 404 when user not found")
- When mocking databases, APIs, file systems, and other external services to isolate units and speed up tests
- When keeping unit tests fast (milliseconds) so developers run them frequently during development

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle testing test writing.

## Instructions

For details, refer to the information provided in this file:
[testing test writing](../../../agent-os/standards/testing/test-writing.md)

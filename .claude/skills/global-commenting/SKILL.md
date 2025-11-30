---
name: Global Commenting
description: Write self-documenting code with minimal, helpful comments that explain complex logic sections, avoiding comments about temporary changes or fixes, and preferring clear naming and structure over excessive comments. Use this skill when writing or refactoring code in any programming language including JavaScript (.js, .mjs), TypeScript (.ts, .tsx), Python (.py), Ruby (.rb), Java (.java), Go (.go), Rust (.rs), PHP (.php), or any other source code files, when adding inline comments to explain complex algorithms, business logic, or non-obvious implementation decisions, when writing documentation comments using JSDoc, TSDoc, TypeDoc, Python docstrings, JavaDoc, Rustdoc, or similar documentation formats for functions, classes, or modules, when deciding whether to add a comment or improve code clarity through better naming and refactoring, or when reviewing existing comments to remove outdated or redundant information. Use this when writing code that explains itself through clear structure, meaningful variable and function names (like calculateTaxAmount instead of calcTax), logical organization, and well-factored functions rather than relying heavily on comments to explain what the code does, adding concise, minimal comments only to explain the "why" behind large sections of complex code logic or non-obvious implementation decisions (like "Using bubble sort here because dataset is guaranteed to be nearly sorted" or "Retry logic required due to API rate limiting") and not the "what" which should be clear from reading the code itself, not leaving code comments that reference recent or temporary changes, bug fixes, or TODOs (like "// Fixed bug where users couldn't login" or "// TODO: refactor this later") and using issue tracking systems like Jira, GitHub Issues, or Linear instead for temporary items and work tracking, ensuring all comments are evergreen informational texts that will remain relevant and accurate far into the future as the code evolves without requiring updates when implementation details change, preferring to improve code clarity through better variable and function naming, extracting well-named methods, or refactoring complex logic into smaller functions with descriptive names rather than adding explanatory comments to clarify confusing code, documenting non-obvious business rules (like "Discount applies only to orders over $100 placed on weekdays"), complex algorithms (like "Implements Dijkstra's shortest path algorithm"), mathematical formulas (like "Haversine formula for calculating distance between coordinates"), edge cases (like "Empty array returns null per API contract"), gotchas (like "This regex fails on Unicode characters"), performance considerations (like "O(n²) complexity acceptable here as n is always < 100"), or important constraints (like "Must be called before database transaction commits") that cannot be understood from reading the code alone, removing outdated comments during refactoring to prevent confusion from stale or inaccurate information that no longer matches the current implementation, using documentation comments like JSDoc (`/** @param {string} userId */`), TSDoc, Python docstrings (`"""Calculate total with tax. Args: amount (float): Base amount """`) for public APIs, exported functions, library interfaces, or complex function signatures to explain parameters, return values, thrown exceptions, usage examples, and important behavioral details for API consumers, avoiding comments that simply restate what the code obviously does (like "// increment i" for i++ or "// loop through users" for users.forEach()), using comments to explain "why" not "what" (WHY this approach was chosen, not WHAT the code is doing), documenting workarounds or hacks with explanations (like "// Working around Chrome bug #12345 - remove after Chrome 120 release"), adding comments for regex patterns to explain what they match (like "// Matches email format: user@domain.com"), explaining magic numbers when constants aren't sufficient (like "// 86400000ms = 24 hours in milliseconds"), and ensuring comments add value and aren't redundant with what the code already expresses clearly.
---

# Global Commenting

## When to use this skill:

- When writing or refactoring code in any programming language
- When adding comments to explain complex algorithms, business logic, or non-obvious code sections
- When documenting function parameters, return values, or expected behavior
- When deciding whether to add a comment or improve code clarity through better naming
- When ensuring code is self-documenting through clear structure and meaningful names
- When writing minimal, concise comments that explain the "why" behind large sections of code
- When removing outdated comments that reference temporary changes or fixes
- When ensuring comments are evergreen and will remain relevant in the future
- When avoiding comments that simply restate what the code does
- When refactoring commented code to be more self-explanatory
- When documenting edge cases, gotchas, or important constraints that aren't obvious from the code
- When writing code that explains itself through clear structure and naming instead of relying on comments
- When adding concise, minimal comments to explain large sections of complex code logic
- When not leaving code comments that speak to recent or temporary changes or fixes (e.g., "fixed bug" or "TODO: refactor later")
- When ensuring comments are evergreen informational texts that will remain relevant far into the future
- When preferring to improve code clarity through better variable and function naming rather than adding explanatory comments
- When documenting non-obvious business rules, algorithms, edge cases, or important constraints that cannot be understood from the code alone

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle global commenting.

## Instructions

For details, refer to the information provided in this file:
[global commenting](../../../agent-os/standards/global/commenting.md)

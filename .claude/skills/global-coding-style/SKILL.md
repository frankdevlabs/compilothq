---
name: Global Coding Style
description: Write clean, consistent code following established naming conventions, automated formatting, DRY principles, meaningful variable names, small focused functions, and consistent indentation across all programming languages. Use this skill when writing or refactoring code in any programming language or file type including JavaScript (.js, .mjs, .cjs), TypeScript (.ts, .tsx, .mts), Python (.py), Ruby (.rb), Java (.java), Go (.go), Rust (.rs), PHP (.php), C# (.cs), Swift (.swift), Kotlin (.kt), or any other source code files. Use this when creating new functions, classes, interfaces, types, or variables that need appropriate naming following language-specific conventions like camelCase for JavaScript/TypeScript variables and functions (getUserById, totalPrice, isActive), PascalCase for class names, type names, and interfaces in most languages (UserProfile, DatabaseConnection, ApiResponse), snake_case for Python functions and variables (get_user_by_id, total_price, is_active), SCREAMING_SNAKE_CASE for constants (API_URL, MAX_RETRY_COUNT, DEFAULT_TIMEOUT), or kebab-case for CSS classes and file names in web projects, keeping functions and methods small and focused on a single, well-defined task for better readability, testability, and maintainability (ideally under 50 lines, maximum 100 lines except for configuration or data structures), choosing descriptive, meaningful names that clearly reveal intent and purpose like calculateTotalWithTax, sendWelcomeEmail, validateUserInput while avoiding cryptic abbreviations like calc, snd, val and single-letter variables except in narrow contexts like loop counters (i, j, k) or mathematical formulas (x, y, z), applying the DRY (Don't Repeat Yourself) principle by extracting common logic into reusable functions, utility modules, custom hooks, or shared libraries to avoid code duplication and reduce maintenance burden, removing dead code including unused functions, commented-out code blocks, unused imports or dependencies, and unreachable code rather than leaving them as clutter that confuses developers and bloats the codebase, ensuring consistent indentation throughout the codebase using either spaces (2 or 4 spaces per indent level) or tabs (never mixing both) and configuring editor/linter tools like ESLint, Prettier, Black, gofmt, rustfmt, or language-specific formatters to automatically enforce it, maintaining consistent code style for line breaks, spacing, brace placement, quote style (single vs double quotes), trailing commas, semicolons, and other formatting details through automated formatting tools configured in .prettierrc, .eslintrc, or similar config files, following established file and directory naming conventions for the project and programming language like camelCase for JavaScript files (userService.ts), PascalCase for React components (UserProfile.tsx), snake_case for Python modules (user_service.py), or kebab-case for CSS/HTML files (user-profile.css), not writing additional code logic to handle backward compatibility unless specifically instructed by the user to avoid unnecessary complexity and maintenance burden, refactoring large functions or classes into smaller, more focused units when they grow too complex or handle multiple responsibilities by extracting helper functions or creating new classes, preferring early returns and guard clauses to reduce nesting and improve readability instead of deeply nested if-else statements, limiting function parameters to 3-4 maximum and using configuration objects for functions requiring many parameters, using consistent import ordering (third-party imports first, then internal imports, grouped by type) and organizing imports alphabetically within groups, avoiding magic numbers and strings by defining named constants with descriptive names, and ensuring all code follows the same style guidelines regardless of who wrote it for better team collaboration, code reviews, and long-term maintenance.
---

# Global Coding Style

## When to use this skill:

- When writing or refactoring code in any programming language (JavaScript, TypeScript, Python, Ruby, Java, Go, etc.)
- When creating new functions, classes, variables, or files that need appropriate naming
- When following established naming conventions (camelCase for variables, PascalCase for classes, snake_case in Python, etc.)
- When ensuring consistent code formatting and indentation throughout the codebase
- When choosing descriptive, meaningful names for variables and functions instead of abbreviations
- When keeping functions small and focused on a single, well-defined task
- When applying the DRY (Don't Repeat Yourself) principle to eliminate code duplication
- When extracting common logic into reusable functions or modules
- When removing dead code, unused imports, or commented-out code blocks
- When configuring or following linter and formatter rules (ESLint, Prettier, Pylint, etc.)
- When refactoring code to improve readability and maintainability
- When writing code that does not require backward compatibility unless specifically instructed
- When establishing and following naming conventions for variables, functions, classes, and files across the codebase
- When maintaining consistent code style (indenting, line breaks, spacing) through automated formatting
- When choosing descriptive names that reveal intent and avoiding abbreviations and single-letter variables except in narrow contexts (like loop counters)
- When keeping functions small and focused on a single task for better readability and testability
- When using consistent indentation (spaces or tabs) and configuring editor/linter to enforce it
- When deleting unused code, commented-out blocks, and imports rather than leaving them as clutter
- When avoiding duplication by extracting common logic into reusable functions or modules
- When not writing additional code logic to handle backward compatibility unless specifically instructed otherwise

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle global coding style.

## Instructions

For details, refer to the information provided in this file:
[global coding style](../../../agent-os/standards/global/coding-style.md)

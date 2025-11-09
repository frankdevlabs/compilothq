---
name: Global Conventions
description: Follow general development conventions including consistent project structure, environment configuration, dependency management, version control best practices, clear commit messages, and documentation standards. Use this skill when organizing project files and directories, managing dependencies in files like package.json, requirements.txt, Gemfile, go.mod, or Cargo.toml, configuring environment variables in .env files, writing git commit messages, creating or updating README files, CONTRIBUTING.md files, or other project documentation, setting up configuration files like .gitignore, .editorconfig, or CI/CD configuration files, or establishing development workflows and team conventions. Use this when organizing files and directories in a predictable, logical structure that team members can easily navigate (like src/ for source code, tests/ for tests, docs/ for documentation, config/ for configuration), maintaining up-to-date README files with clear setup instructions, architecture overview, dependency documentation, and contribution guidelines for onboarding new team members, using clear, descriptive commit messages following Conventional Commits format or similar standards with meaningful descriptions of what changed and why, using feature branches for new development and creating meaningful pull requests or merge requests with detailed descriptions of changes, using environment variables for all configuration values like API endpoints, database URLs, API keys, and feature flags instead of hardcoding them, never committing secrets, API keys, credentials, or sensitive data to version control and ensuring .gitignore is properly configured to exclude them, keeping dependencies minimal, up-to-date, and well-documented including explanations for why major dependencies are used and their purpose in the project, establishing a consistent code review process with clear expectations for reviewers and authors including review checklist items, defining what level of testing is required before merging code (unit tests, integration tests, end-to-end tests) and enforcing it through CI/CD, using feature flags or feature toggles to deploy incomplete features to production safely rather than maintaining long-lived feature branches that become difficult to merge, keeping a CHANGELOG.md file or release notes to track significant changes, new features, bug fixes, and breaking changes for each version, following semantic versioning (semver) for releases and versioning, configuring CI/CD pipelines for automated testing, linting, and deployment, and ensuring consistent development environment setup across team members using tools like Docker, devcontainers, or setup scripts.
---

# Global Conventions

## When to use this skill:

- When organizing or restructuring project files and directories for better navigation
- When managing dependencies in package.json, requirements.txt, Gemfile, go.mod, or similar files
- When configuring environment variables and ensuring secrets are not committed to version control
- When writing commit messages that clearly describe changes and their purpose
- When creating or updating README files, setup instructions, or contribution guidelines
- When establishing or following project structure conventions (src/, lib/, config/, etc.)
- When adding or updating major dependencies and documenting why they're used
- When using feature flags to manage incomplete features instead of long-lived branches
- When maintaining changelogs or release notes for tracking significant changes
- When setting up or following code review processes and expectations
- When defining testing requirements before merging code
- When configuring project settings using environment variables rather than hardcoded values
- When ensuring API keys, secrets, and credentials are never committed to repositories
- When organizing files and directories in a predictable, logical structure that team members can navigate easily
- When maintaining up-to-date README files with setup instructions, architecture overview, and contribution guidelines
- When using clear commit messages, feature branches, and meaningful pull/merge requests with descriptions
- When using environment variables for configuration and never committing secrets or API keys to version control
- When keeping dependencies up-to-date and minimal and documenting why major dependencies are used
- When establishing a consistent code review process with clear expectations for reviewers and authors
- When defining what level of testing is required before merging (unit tests, integration tests, etc.)
- When using feature flags for incomplete features rather than long-lived feature branches
- When keeping a changelog or release notes to track significant changes and improvements

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle global conventions.

## Instructions

For details, refer to the information provided in this file:
[global conventions](../../../agent-os/standards/global/conventions.md)

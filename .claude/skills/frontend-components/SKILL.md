---
name: Frontend Components
description: Design and build reusable, composable UI components with single responsibility, clear interfaces, proper encapsulation, and minimal props following component best practices. Use this skill when creating or modifying React component files (.jsx, .tsx), Vue single-file components (.vue), Angular component files (.component.ts, .component.html), Svelte components (.svelte), Web Components, or any frontend UI component files in directories like components/, src/components/, app/components/, lib/components/, or ui/components/. Use this when designing component APIs by defining explicit, well-documented props with TypeScript interfaces or PropTypes and providing sensible default values for optional props, implementing component composition patterns by combining smaller, simpler components into more complex UIs rather than building monolithic structures that are hard to maintain, ensuring each component has a single clear responsibility and does one thing well following the Single Responsibility Principle, managing component state by keeping it as local as possible and only lifting state up when multiple components need to share it to avoid unnecessary re-renders, breaking down large monolithic components into smaller, focused, reusable pieces for better maintainability, testing, and code reuse, establishing and following consistent component naming conventions that clearly indicate the component's purpose like UserProfileCard, PrimaryButton, NavigationMenu, or SearchInput, keeping the number of props manageable (if a component requires many props like more than 5-7, consider using composition or splitting it into multiple smaller components), encapsulating internal implementation details and only exposing necessary props and methods in the component's public API to reduce coupling, creating reusable components that can work in different contexts by making them configurable through props rather than hardcoding specific use cases or business logic, documenting component usage, prop definitions, and providing code examples or Storybook stories for easier team adoption and onboarding, defining prop validation with TypeScript types or runtime validation libraries to catch errors early, implementing proper error boundaries for React components to handle rendering errors gracefully and prevent entire app crashes, and refactoring components when they grow too large or handle multiple responsibilities to maintain code quality.
---

# Frontend Components

## When to use this skill

- When creating or modifying React components (.jsx, .tsx files)
- When working on Vue components (.vue files) or Angular components (.component.ts files)
- When building Svelte components (.svelte files) or Web Components
- When designing component APIs with clear, well-documented props and sensible defaults
- When implementing component composition by combining smaller components into larger ones
- When ensuring each component has a single, clear responsibility (Single Responsibility Principle)
- When managing component state and deciding whether to keep it local or lift it up
- When defining TypeScript interfaces, PropTypes, or type definitions for component props
- When refactoring large, monolithic components into smaller, reusable pieces
- When creating documentation or usage examples for components (README, Storybook stories)
- When establishing or following component naming conventions that clearly indicate purpose
- When building reusable components for component libraries or design systems
- When keeping component implementation details private and exposing only necessary APIs
- When ensuring each component does one thing well instead of handling multiple responsibilities
- When designing components to be reused across different contexts by making them configurable through props
- When building complex UIs by combining smaller, simpler components instead of creating monolithic structures
- When defining explicit, well-documented props with sensible default values for optional props
- When keeping internal implementation details private and only exposing necessary props and methods to reduce coupling
- When using clear, descriptive component names that indicate their purpose (e.g., `UserProfileCard`, `PrimaryButton`, `NavigationMenu`)
- When keeping component state as local as possible and only lifting it up when multiple components need to share it
- When a component has many props (more than 5-7) and you need to consider using composition or splitting it into smaller components
- When documenting component usage, props, and providing usage examples for team adoption
- When implementing error boundaries to catch and handle component rendering errors gracefully
- When working on component directories like `components/`, `src/components/`, `lib/components/`, or `ui/components/`

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle frontend components.

## Instructions

For details, refer to the information provided in this file:
[frontend components](../../../agent-os/standards/frontend/components.md)

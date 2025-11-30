---
name: Frontend Responsive
description: Implement responsive designs using mobile-first development, standard breakpoints, fluid layouts, relative units, touch-friendly design, and content prioritization across all screen sizes. Use this skill when creating or modifying responsive layouts in React components (.jsx, .tsx), Vue components (.vue), HTML files, CSS files (.css, .scss), or Tailwind CSS implementations, writing CSS media queries or using framework responsive utilities, implementing breakpoint-specific styles that adapt layouts for mobile phones, tablets, and desktops, designing mobile navigation patterns like hamburger menus, slide-out drawers, bottom navigation, or collapsible sidebars, building UI components that change behavior based on viewport size like responsive tables that stack on mobile or multi-column grids that reflow to single columns, or testing and debugging layout issues across different screen sizes and devices. Use this when implementing mobile-first CSS or Tailwind utilities that start with mobile styles as the base and progressively enhance for larger screens using min-width media queries like @media (min-width: 768px) or Tailwind responsive prefixes, defining media queries for standard breakpoints like mobile (320px-639px), small tablet (640px-767px), tablet (768px-1023px), desktop (1024px-1279px), and large desktop (1280px+) to match common device sizes, using Tailwind CSS responsive prefixes like sm:, md:, lg:, xl:, 2xl: to apply utility classes at different breakpoints following mobile-first methodology, creating fluid layouts using percentage-based widths (width: 100%, max-width: 1200px), CSS Grid with fr units (grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))), or Flexbox (flex: 1) that automatically adapt to available screen space without horizontal scrolling, using relative units like rem or em instead of fixed pixel values for typography, spacing, and component sizing to support better scalability and accessibility across different screen sizes and browser zoom levels, ensuring all interactive elements like buttons, links, and form controls have touch targets of at least 44x44 pixels (or 48x48px for better comfort) for mobile users to tap accurately without frustration, optimizing images and assets for mobile devices using responsive image techniques like srcset attribute, picture elements with different image sources, lazy loading with loading="lazy", or modern image formats like WebP and AVIF to reduce bandwidth usage and improve page load times, testing layouts and functionality across multiple real device sizes (iPhone SE, iPhone 14, iPad, Samsung Galaxy, desktop monitors) or using browser DevTools device emulation to ensure a balanced user-friendly viewing experience on all screen sizes, maintaining readable font sizes across all breakpoints (minimum 16px base font size for body text on mobile) without requiring users to pinch-zoom to read content, showing the most important content first on smaller screens through thoughtful layout decisions and content prioritization using techniques like progressive disclosure or hiding non-critical elements, using CSS Grid or Flexbox order property to visually reorder content for different screen sizes when the visual hierarchy needs to differ from DOM order for better mobile UX, implementing responsive typography that scales appropriately with viewport size using techniques like fluid typography with clamp() or viewport-based units like vw combined with min/max constraints, creating mobile-specific navigation patterns like hamburger menus with slide-out drawers, bottom tab bars, or collapsible accordion menus for better mobile usability and thumb-friendly access, hiding or condensing less important content on mobile to reduce cognitive load and scrolling while keeping it accessible on larger screens, using container queries when appropriate to make components responsive to their container size rather than viewport size for better component reusability, and testing responsive behavior at common breakpoint boundaries (639px, 767px, 1023px, 1279px) to catch layout issues that appear during viewport transitions.
---

# Frontend Responsive

## When to use this skill:

- When creating or modifying responsive layouts that adapt to different screen sizes
- When writing media queries for mobile, tablet, and desktop breakpoints
- When implementing mobile-first CSS with progressive enhancement for larger screens
- When using Tailwind CSS responsive prefixes like sm:, md:, lg:, xl:, 2xl:
- When creating fluid layouts with CSS Grid, Flexbox, or percentage-based widths
- When choosing relative units (rem, em) over fixed pixel values for better scalability
- When designing mobile navigation patterns (hamburger menus, bottom navigation, etc.)
- When ensuring touch targets meet minimum size requirements (44x44px) for mobile users
- When optimizing images and assets for different screen sizes and mobile networks
- When testing UI across multiple device sizes (mobile, tablet, desktop)
- When prioritizing content visibility and layout for smaller screens
- When ensuring typography remains readable across all breakpoints without zoom
- When implementing responsive components that change behavior based on screen size
- When starting with mobile layout and progressively enhancing styles for larger screens
- When consistently using standard breakpoints across the application (e.g., mobile: 320px, tablet: 768px, desktop: 1024px)
- When using percentage-based widths and flexible containers (like CSS Grid and Flexbox) that adapt to screen size
- When preferring rem/em units over fixed pixels for better scalability and accessibility
- When testing and verifying UI changes across multiple screen sizes ensuring a balanced user-friendly viewing experience on all devices
- When ensuring tap targets are appropriately sized (minimum 44x44px) for mobile users
- When optimizing images and assets for mobile network conditions and smaller screens
- When maintaining readable font sizes across all breakpoints without requiring users to zoom
- When showing the most important content first on smaller screens through thoughtful layout decisions and content prioritization

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle frontend responsive.

## Instructions

For details, refer to the information provided in this file:
[frontend responsive](../../../agent-os/standards/frontend/responsive.md)

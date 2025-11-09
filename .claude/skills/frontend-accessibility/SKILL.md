---
name: Frontend Accessibility
description: Implement accessible user interfaces using semantic HTML, keyboard navigation, proper color contrast, ARIA attributes, alt text, and focus management to ensure all users can interact with the application. Use this skill when creating or modifying React components (.jsx, .tsx), Vue components (.vue), HTML files, template files, or any frontend UI code that renders user interfaces including forms, buttons, links, navigation menus, modals, dialogs, dropdowns, images, or interactive elements. Use this when implementing semantic HTML elements like nav, main, button, header, footer, article, section, form, label, input that convey proper meaning to assistive technologies, ensuring all interactive elements (buttons, links, form controls) are keyboard accessible with visible focus indicators and proper tab order, adding ARIA attributes like aria-label, aria-describedby, aria-labelledby, aria-hidden, role when semantic HTML alone isn't sufficient for complex components like tabs, accordions, or custom widgets, providing descriptive alt text for all meaningful images (and using empty alt="" for decorative images), implementing proper heading hierarchy with h1-h6 elements in sequential order to create a clear document outline and structure, managing focus appropriately when opening modals, showing dynamic content, or navigating in single-page applications by programmatically moving focus to relevant elements, ensuring sufficient color contrast ratios meeting WCAG standards (4.5:1 minimum for normal text, 3:1 for large text or UI components), not relying solely on color to convey important information and using additional visual cues like icons, text labels, or patterns, providing meaningful labels for all form inputs using label elements or aria-label attributes, testing UI components with screen readers like NVDA, JAWS, or VoiceOver to verify accessibility for blind users, ensuring keyboard-only navigation works for all interactive features without requiring a mouse, and implementing skip links to allow keyboard users to bypass repetitive navigation content.
---

# Frontend Accessibility

## When to use this skill:

- When creating or modifying React, Vue, Angular, Svelte, or any frontend UI components
- When working on HTML, JSX, or template files that render user interfaces
- When implementing interactive elements like buttons, links, forms, modals, dialogs, or dropdowns
- When adding images that need descriptive alt text
- When ensuring keyboard navigation works properly with tab order and focus management
- When using ARIA attributes (aria-label, aria-describedby, role, aria-hidden) for complex components
- When implementing proper semantic HTML elements (nav, main, header, footer, article, section, button)
- When ensuring color contrast meets WCAG standards (4.5:1 for normal text, 3:1 for large text)
- When managing focus in single-page applications, modals, or dynamically loaded content
- When creating logical heading structures with proper h1-h6 hierarchy
- When testing interfaces with screen readers or accessibility tools
- When designing forms with proper labels and error messages for all inputs
- When using appropriate semantic HTML elements that convey meaning to assistive technologies (e.g., `<button>` instead of `<div>` for clickable elements)
- When ensuring all interactive elements can be accessed and activated using only a keyboard
- When maintaining sufficient color contrast and not relying solely on color to convey information
- When providing descriptive alt text for all meaningful images (and empty alt="" for decorative images)
- When testing with screen readers to verify all views are accessible
- When using ARIA attributes only when semantic HTML isn't sufficient for complex components
- When ensuring headings are used in proper order (h1, then h2, then h3, etc.) to create a clear document structure
- When managing focus appropriately when opening modals, showing dynamic content, or navigating in single-page applications

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle frontend accessibility.

## Instructions

For details, refer to the information provided in this file:
[frontend accessibility](../../../agent-os/standards/frontend/accessibility.md)

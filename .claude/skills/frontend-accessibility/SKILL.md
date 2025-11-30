---
name: Frontend Accessibility
description: Implement accessible user interfaces using semantic HTML, keyboard navigation, proper color contrast, ARIA attributes, alt text, and focus management to ensure all users can interact with the application. Use this skill when creating or modifying React components (.jsx, .tsx), Vue components (.vue), Angular component files, Svelte components, HTML files, template files, or any frontend UI code that renders user interfaces including forms, buttons, links, navigation menus, modals, dialogs, dropdowns, images, or interactive elements. Use this when implementing semantic HTML elements like nav, main, button, header, footer, article, section, form, label, input that convey proper meaning to assistive technologies like screen readers rather than using generic div or span elements, ensuring all interactive elements (buttons, links, form controls, custom widgets) are keyboard accessible with visible focus indicators and proper tab order so users can navigate without a mouse, adding ARIA attributes like aria-label, aria-describedby, aria-labelledby, aria-hidden, role when semantic HTML alone isn't sufficient for complex components like tabs, accordions, custom dropdowns, or modal dialogs, providing descriptive alt text for all meaningful images that explains what the image conveys (and using empty alt="" for purely decorative images that don't add information), implementing proper heading hierarchy with h1-h6 elements in sequential order to create a clear document outline and structure that screen reader users can navigate, managing focus appropriately when opening modals or dialogs, showing dynamic content, or navigating in single-page applications by programmatically moving focus to relevant elements using JavaScript, ensuring sufficient color contrast ratios meeting WCAG standards (4.5:1 minimum for normal text, 3:1 for large text or UI components) to ensure text is readable for users with visual impairments, not relying solely on color to convey important information and using additional visual cues like icons, text labels, patterns, or shapes for colorblind users, providing meaningful labels for all form inputs using label elements or aria-label attributes so screen reader users know what each field is for, testing UI components with screen readers like NVDA, JAWS, or VoiceOver to verify accessibility for blind users and catch issues automated tools might miss, ensuring keyboard-only navigation works for all interactive features without requiring a mouse by testing with tab, enter, space, and arrow keys, and implementing skip links to allow keyboard users to bypass repetitive navigation content and jump directly to main content.
---

# Frontend Accessibility

## When to use this skill

- When creating or modifying React, Vue, Angular, Svelte, or any frontend UI components
- When working on HTML, JSX, or template files that render user interfaces
- When implementing interactive elements like buttons, links, forms, modals, dialogs, tabs, accordions, or dropdowns
- When adding images that need descriptive alt text or marking decorative images with empty alt attributes
- When ensuring keyboard navigation works properly with tab order, visible focus indicators, and proper focus management
- When using ARIA attributes (aria-label, aria-describedby, role, aria-hidden) for complex components where semantic HTML isn't sufficient
- When implementing proper semantic HTML elements (nav, main, header, footer, article, section, button, form, label, input) instead of divs
- When ensuring color contrast meets WCAG standards (4.5:1 for normal text, 3:1 for large text) using contrast checkers
- When managing focus in single-page applications, modals, or dynamically loaded content
- When creating logical heading structures with proper h1-h6 hierarchy for screen reader navigation
- When testing interfaces with screen readers (NVDA, JAWS, VoiceOver) or accessibility testing tools
- When designing forms with proper labels and error messages for all inputs
- When using appropriate semantic HTML elements that convey meaning to assistive technologies (e.g., `<button>` instead of `<div>` for clickable elements)
- When ensuring all interactive elements can be accessed and activated using only a keyboard (tab, enter, space, arrow keys)
- When maintaining sufficient color contrast and not relying solely on color to convey information
- When providing descriptive alt text for all meaningful images (and empty alt="" for decorative images)
- When testing with screen readers to verify all views are accessible to blind and low-vision users
- When using ARIA attributes only when semantic HTML isn't sufficient for complex components
- When ensuring headings are used in proper order (h1, then h2, then h3, etc.) to create a clear document structure
- When managing focus appropriately when opening modals, showing dynamic content, or navigating in single-page applications
- When implementing skip links to help keyboard users bypass repetitive navigation and reach main content faster
- When ensuring touch targets are at least 44x44 pixels for mobile accessibility
- When testing accessibility with automated tools like axe DevTools, WAVE, or Lighthouse

This Skill provides Claude Code with specific guidance on how to adhere to coding standards as they relate to how it should handle frontend accessibility.

## Instructions

For details, refer to the information provided in this file:
[frontend accessibility](../../../agent-os/standards/frontend/accessibility.md)

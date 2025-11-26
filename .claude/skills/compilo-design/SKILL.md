---
name: compilo-design-system
description: Enforce Compilo Design System rules - navy/cream minimal aesthetic with OKLCH colors, 8px grid, shadcn/ui components. Use PROACTIVELY when creating or modifying any UI code.
version: 1.0.0
allowed-tools: 'Read,Write,Edit,Grep,Glob,Bash(npm:*,pnpm:*)'
---

# Compilo Design System Enforcement

## Overview

This skill enforces the Compilo Design System across all UI development. Apply these rules to EVERY component, page, and style modification.

## When to Apply This Skill

Apply these rules when:

- Creating or modifying React components
- Writing Tailwind CSS classes
- Reviewing UI code
- Building pages or layouts
- Working with shadcn/ui components

## Core Aesthetic

**Navy/Cream Minimal** inspired by franksblog.nl:

- Dark navy (`#09192B`) for primary/text
- Pure white (`#FFFFFF`) for backgrounds
- Cream (`#FEFBF4`) for dark mode backgrounds
- Gold accent (`#D9BF65`) for highlights and CTAs
- Clean, content-first interfaces
- Generous whitespace
- No unnecessary decoration

## The Core Philosophy: "Confident Minimalism"

Designers should approach Compilo with the mindset: "Every element must justify its existence, and complexity should feel inevitable, not accidental."

## Core Design Principles

1. **Content-first minimalism**: Clean, uncluttered interfaces
2. **Navy/cream palette**: Sophisticated, high-contrast colors
3. **8px spacing grid**: Consistent rhythm and balance
4. **Accessibility first**: WCAG 2.1 AA compliance

---

## 1. Color Rules (OKLCH)

### Mandatory Token Usage

```tsx
// ✅ CORRECT - Use semantic tokens
<div className="bg-background text-foreground">
<Button className="bg-primary text-primary-foreground">
<p className="text-muted-foreground">
<div className="border-border">
<span className="bg-accent-gold text-foreground">Featured</span>

// ❌ FORBIDDEN - Hard-coded values
<div className="bg-[#09192B]">           // Hard-coded hex
<div className="bg-[oklch(0.205_0_0)]">  // Hard-coded OKLCH
<div style={{ color: '#09192B' }}>       // Inline style
<div className="text-blue-500">          // Generic Tailwind color
```

### Token Reference

| Intent          | Class                                        | Light      | Dark       |
| --------------- | -------------------------------------------- | ---------- | ---------- |
| Page background | `bg-background`                              | white      | navy       |
| Primary text    | `text-foreground`                            | navy       | cream      |
| Secondary text  | `text-muted-foreground`                      | gray       | light gray |
| Primary action  | `bg-primary text-primary-foreground`         | navy/cream | cream/navy |
| Card surface    | `bg-card border-border`                      | white      | navy       |
| Gold highlight  | `bg-accent-gold text-foreground`             | gold       | gold       |
| Destructive     | `bg-destructive text-destructive-foreground` | red        | red        |
| Borders         | `border-border`                              | light gray | 10% white  |
| Focus ring      | `ring-ring`                                  | gray       | gray       |

### Gold Accent Usage

The signature `accent-gold` (#D9BF65) should be used for:

- Hover states on important links
- Selected/active states
- Call-to-action highlights
- Featured badges
- Important callout borders

```tsx
// Gold accent patterns
<button className="hover:bg-accent-gold hover:text-foreground">
<Badge className="bg-accent-gold text-foreground">Featured</Badge>
<div className="border-l-4 border-accent-gold pl-4">Important note</div>
```

---

## 2. Spacing Rules (8px Grid)

### Allowed Values Only

| Size | Pixels | Tailwind                 | Usage                    |
| ---- | ------ | ------------------------ | ------------------------ |
| xs   | 8px    | `p-2`, `m-2`, `gap-2`    | Tight spacing            |
| sm   | 16px   | `p-4`, `m-4`, `gap-4`    | Component padding        |
| md   | 24px   | `p-6`, `m-6`, `gap-6`    | **Default card padding** |
| lg   | 32px   | `p-8`, `m-8`, `gap-8`    | Section spacing          |
| xl   | 48px   | `p-12`, `m-12`, `gap-12` | Major sections           |
| 2xl  | 64px   | `p-16`, `m-16`, `gap-16` | Page sections            |
| 3xl  | 96px   | `p-24`, `m-24`, `gap-24` | Hero sections            |

### Forbidden Patterns

```tsx
// ❌ FORBIDDEN - Arbitrary values
<div className="p-[13px]">      // Not on 8px grid
<div className="gap-[22px]">    // Not on 8px grid
<div className="m-[17px]">      // Not on 8px grid
<div className="p-7">           // 28px not on preferred scale
<div className="p-11">          // 44px not on preferred scale

// ✅ CORRECT - 8px grid values
<div className="p-6">           // 24px ✓
<div className="gap-4">         // 16px ✓
<div className="m-8">           // 32px ✓
```

### Common Patterns

```tsx
// Card padding
<Card className="p-6">           // 24px - standard

// Button groups
<div className="flex gap-4">     // 16px between buttons

// Form fields
<div className="space-y-2">      // 8px between label and input

// Section spacing
<section className="py-12">      // 48px vertical padding

// Grid layouts
<div className="grid gap-6">     // 24px grid gap
```

---

## 3. Typography Rules

### Font Families

```tsx
// Headings - Ubuntu
<h1 className="font-heading">    // Ubuntu

// Body - Raleway
<p className="font-sans">        // Raleway (default)

// Code - Monospace
<code className="font-mono">     // System monospace
```

### Type Scale

| Element         | Size | Weight   | Line Height | Classes                                       |
| --------------- | ---- | -------- | ----------- | --------------------------------------------- |
| H1 (page title) | 30px | bold     | 1.25        | `text-3xl font-bold leading-tight`            |
| H2 (section)    | 24px | semibold | 1.25        | `text-2xl font-semibold leading-tight`        |
| H3 (card title) | 20px | medium   | 1.25        | `text-xl font-medium leading-tight`           |
| Body            | 16px | normal   | 1.5         | `text-base leading-normal`                    |
| Small/Meta      | 14px | normal   | 1.5         | `text-sm text-muted-foreground`               |
| Label           | 12px | medium   | 1.25        | `text-xs font-medium uppercase tracking-wide` |

### Examples

```tsx
// Page title
<h1 className="text-3xl font-bold leading-tight text-foreground">
  Dashboard
</h1>

// Section heading
<h2 className="text-2xl font-semibold leading-tight text-foreground">
  Recent Activity
</h2>

// Card title
<h3 className="text-xl font-medium text-foreground">
  Project Name
</h3>

// Body text
<p className="text-base leading-normal text-foreground">
  Content here...
</p>

// Metadata
<span className="text-sm text-muted-foreground">
  Updated 2 hours ago
</span>

// Small label
<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
  Status
</span>
```

---

## 4. Component Rules

### Always Use shadcn/ui Base

```tsx
// ✅ CORRECT - Extend shadcn/ui
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

// ❌ FORBIDDEN - Custom from scratch
const Button = styled.button`...`  // No styled-components
<div role="button">...</div>       // No fake buttons
```

### React 19 Pattern (Required)

```tsx
// ✅ CORRECT - Modern pattern
function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'button'> & ButtonProps) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

// ❌ DEPRECATED - Don't use forwardRef
const Button = React.forwardRef<HTMLButtonElement, Props>(...)
```

### Component Specifications

**Button**:

- Heights: `h-8` (sm), `h-9` (default), `h-10` (lg)
- Variants: default, secondary, destructive, outline, ghost, link
- Focus: `focus-visible:ring-2 focus-visible:ring-ring`

**Card**:

- Padding: `p-6` (24px)
- Border: `border-border rounded-lg`
- Background: `bg-card text-card-foreground`

**Input**:

- Height: `h-9` (36px minimum)
- Border: `border-input rounded-md`
- Focus: `focus-visible:ring-2 focus-visible:ring-ring`

---

## 5. Accessibility Rules (Mandatory)

### Color Contrast

- Text: **4.5:1 minimum** ratio
- Large text (18px+): **3:1 minimum**
- UI components: **3:1 minimum**

### Keyboard Navigation

- All interactive elements must be focusable
- Tab order must be logical
- Escape closes modals/dropdowns
- Enter/Space activates buttons

### Focus Indicators

```tsx
// ✅ REQUIRED - Visible focus
className = 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

// ❌ FORBIDDEN - Hidden focus
className = 'outline-none focus:outline-none' // Never without alternative
```

### Semantic HTML

```tsx
// ✅ CORRECT
<button onClick={...}>Click</button>
<a href="/page">Navigate</a>
<nav><ul><li>...</li></ul></nav>

// ❌ FORBIDDEN
<div onClick={...}>Click</div>
<span onClick={...}>Navigate</span>
<div><div><div>...</div></div></div>
```

### Touch Targets

- Minimum: **44x44px**
- Use: `min-h-[44px] min-w-[44px]` or `size-11`

### Form Accessibility

```tsx
// ✅ REQUIRED pattern
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    aria-invalid={!!error}
    aria-describedby={error ? 'email-error' : undefined}
  />
  {error && (
    <span id="email-error" role="alert" className="text-sm text-destructive">
      {error}
    </span>
  )}
</div>
```

---

## 6. Validation Checklist

Before ANY UI code is complete, verify:

### Design Tokens

- [ ] No hard-coded colors (search for `#`, `rgb`, `hsl`, `oklch` in component code)
- [ ] No arbitrary Tailwind values (search for `[` followed by `px]`)
- [ ] All colors use semantic tokens (`bg-background`, `text-foreground`, etc.)

### Spacing

- [ ] All spacing on 8px grid (2, 4, 6, 8, 12, 16, 24)
- [ ] Card padding is `p-6` (24px)
- [ ] Grid gaps use `gap-4` or `gap-6`

### Typography

- [ ] Headings use `font-heading` or appropriate weight
- [ ] Body text is `text-base` (16px)
- [ ] Metadata uses `text-muted-foreground`

### Components

- [ ] Uses shadcn/ui base component
- [ ] React 19 pattern (no forwardRef)
- [ ] Proper TypeScript types

### Accessibility

- [ ] Semantic HTML elements
- [ ] Focus indicators visible
- [ ] Labels associated with inputs
- [ ] Touch targets 44x44px minimum
- [ ] Color contrast meets WCAG AA

---

## 7. Quick Reference

### Most Common Classes

```tsx
// Backgrounds
bg-background bg-card bg-primary bg-secondary bg-accent bg-muted bg-accent-gold

// Text
text-foreground text-muted-foreground text-primary-foreground

// Borders
border-border border-input rounded-md rounded-lg

// Focus
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2

// Spacing
p-6 (card) gap-4 (buttons) gap-6 (grid) space-y-2 (form)

// Typography
text-3xl font-bold leading-tight (h1)
text-2xl font-semibold leading-tight (h2)
text-xl font-medium (h3)
text-base leading-normal (body)
text-sm text-muted-foreground (meta)
```

### Anti-Patterns to Catch

```tsx
// ❌ Hard-coded colors
"bg-[#09192B]" "text-[#FEFBF4]" "border-[#D9BF65]"

// ❌ Arbitrary spacing
"p-[13px]" "gap-[22px]" "m-[17px]"

// ❌ Non-semantic elements
<div onClick={...}> <span onClick={...}>

// ❌ Missing focus
"outline-none" without focus-visible alternative

// ❌ Inline styles
style={{ color: '...' }}
```

---

## Resources

See reference files for detailed specifications:

- tokens/color.json
- tokens/typography.json
- tokens/spacing.jdon
- tokens/typography.json

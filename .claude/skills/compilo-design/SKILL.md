---
name: compilo-design-system
description: Enforce Compilo Design System rules - navy/cream minimal aesthetic with OKLCH colors, 8px grid, shadcn/ui components. Use PROACTIVELY when creating or modifying any UI code.
version: 1.0.0
allowed-tools: 'Read,Write,Edit,Grep,Glob,Bash(npm:*,pnpm:*)'
---

# Compilo Design System Enforcement

**Philosophy**: "Confident Minimalism" - Every element must justify its existence. Complexity should feel inevitable, not accidental.

**Core Principles**: Content-first minimalism • Navy/cream/gold palette • 8px spacing grid • WCAG 2.1 AA accessibility

Apply to: React components, Tailwind classes, shadcn/ui usage, pages, layouts

---

## 1. Color Rules (OKLCH)

**Mandatory**: Use semantic tokens only. Never hard-code colors or use arbitrary values.

```tsx
// ✅ CORRECT
<div className="bg-background text-foreground">
<Button className="bg-primary text-primary-foreground">
<span className="bg-accent-gold text-foreground">Featured</span>

// ❌ NEVER
<div className="bg-[#09192B]">           // Hard-coded
<div className="text-blue-500">          // Generic Tailwind
```

### Token Reference

| Intent             | Class                                        | Light      | Dark       |
| ------------------ | -------------------------------------------- | ---------- | ---------- |
| Page background    | `bg-background`                              | white      | navy       |
| Primary text       | `text-foreground`                            | navy       | cream      |
| Secondary text     | `text-muted-foreground`                      | gray       | light gray |
| Primary action     | `bg-primary text-primary-foreground`         | navy/cream | cream/navy |
| Card surface       | `bg-card border-border`                      | white      | navy       |
| **Gold highlight** | `bg-accent-gold text-foreground`             | gold       | gold       |
| Destructive        | `bg-destructive text-destructive-foreground` | red        | red        |

### Gold Accent Usage

Signature `accent-gold` (#D9BF65) for: hover states, active states, CTAs, featured badges, callout borders

```tsx
<button className="hover:bg-accent-gold hover:text-foreground">
<div className="border-l-4 border-accent-gold">Important</div>
```

---

## 2. Spacing Rules (8px Grid)

**Allowed values**: 2, 4, 6, 8, 12, 16, 24 (8px, 16px, 24px, 32px, 48px, 64px, 96px)

| Size | Pixels  | Tailwind       | Usage                    |
| ---- | ------- | -------------- | ------------------------ |
| xs   | 8px     | `p-2`, `gap-2` | Tight spacing            |
| sm   | 16px    | `p-4`, `gap-4` | Component padding        |
| md   | 24px    | `p-6`, `gap-6` | **Default card padding** |
| lg   | 32px    | `p-8`, `gap-8` | Section spacing          |
| xl+  | 48-96px | `p-12`-`p-24`  | Major sections           |

```tsx
// Common patterns
<Card className="p-6">                   // 24px standard
<div className="flex gap-4">             // 16px between items
<div className="space-y-2">              // 8px between label/input
<section className="py-12">              // 48px vertical
```

---

## 3. Typography

**Pairing Philosophy**: Ubuntu (geometric, authoritative) + Raleway (humanist, approachable) creates professional contrast. Avoids generic defaults (Inter, Roboto).

| Element | Size | Weight   | Classes                                       |
| ------- | ---- | -------- | --------------------------------------------- |
| H1      | 30px | bold     | `text-3xl font-bold leading-tight`            |
| H2      | 24px | semibold | `text-2xl font-semibold leading-tight`        |
| H3      | 20px | medium   | `text-xl font-medium`                         |
| Body    | 16px | normal   | `text-base leading-normal`                    |
| Meta    | 14px | normal   | `text-sm text-muted-foreground`               |
| Label   | 12px | medium   | `text-xs font-medium uppercase tracking-wide` |

```tsx
<h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
<p className="text-base text-foreground">Content...</p>
<span className="text-sm text-muted-foreground">Updated 2h ago</span>
```

---

## 4. Signature Compilo Elements

**Purpose**: Prevent generic minimalist convergence. Each feature should use ≥1 signature pattern.

### Gold Accent Borders

```tsx
<div className="border-l-4 border-accent-gold">Featured content</div>
<Link className="border-b-2 border-accent-gold">Active item</Link>
```

### Navy-Cream High Contrast

```tsx
<Button className="bg-primary text-primary-foreground hover:bg-accent-gold">
<Card className="bg-primary text-primary-foreground">Emphasis</Card>
```

### Asymmetric Theme Transitions

- Light mode: 0ms (instant, energetic)
- Dark mode: 750ms (slow fade, luxurious)

**Apply to**: Primary CTAs, featured content, active states, callouts, hero sections

---

## 5. Components

**Required**: Always use shadcn/ui base. Use React 19 pattern (no forwardRef).

```tsx
// ✅ CORRECT
import { Button } from "@/components/ui/button"

function Button({ className, ...props }: React.ComponentProps<'button'> & ButtonProps) {
  return <button data-slot="button" className={cn(buttonVariants({ className }))} {...props} />
}

// ❌ NEVER
const Button = styled.button`...`
<div role="button">...</div>
```

**Specs**:

- **Button**: Heights `h-8/9/10`, variants (default, secondary, destructive, outline, ghost), focus `focus-visible:ring-2 focus-visible:ring-ring`
- **Card**: Padding `p-6`, border `border-border rounded-lg`, bg `bg-card`
- **Input**: Height `h-9` (36px min), border `border-input rounded-md`, focus `focus-visible:ring-2`

---

## 6. Motion & Animation

**Philosophy**: Subtle transitions over dramatic effects. Use sparingly.

**Duration Scale** (from effects.json):

- Fast (150ms): Hovers, color changes
- Normal (200ms): Interactions, states
- Slow (300ms): Slides, modals

```tsx
// Standard patterns
<Card className="transition-colors duration-200 hover:border-accent-gold">
<Link className="transition-colors duration-200 hover:text-accent-gold">
<Button className="transition-all duration-200 hover:bg-accent-gold">

// Entrance animations (tw-animate-css)
<div className="animate-in fade-in duration-500">
<Card className="animate-in fade-in slide-in-from-bottom-2 duration-500">
```

**Guidelines**: Prefer CSS over JS, use selectively, maintain consistency, test 60fps

---

## 7. Background & Depth

**Philosophy**: Atmospheric minimalism via opacity and shadow, not complex gradients.

```tsx
// Opacity layering
<section className="bg-accent-gold/5">Subtle emphasis</section>
<div className="bg-accent-gold/10">Stronger emphasis</div>

// Shadow hierarchy (effects.json)
<Card className="shadow-sm">                                    // 2px blur
<Card className="shadow-md">                                    // 6px blur
<Dialog className="shadow-lg">                                  // 15px blur

// Nested surfaces
<div className="bg-background">
  <div className="bg-muted/50 p-8">
    <Card className="bg-card shadow-sm">Content</Card>
  </div>
</div>
```

**Prefer**: Subtle opacity, minimal shadow. **Avoid**: Busy patterns, multiple competing techniques.

---

## 8. Accessibility (Mandatory)

**Color Contrast**: Text 4.5:1, Large text 3:1, UI components 3:1

**Keyboard**: All interactive elements focusable, logical tab order, Escape closes modals, Enter/Space activates

**Focus Indicators** (required):

```tsx
className = 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
```

**Semantic HTML**:

```tsx
// ✅ CORRECT
<button onClick={...}>Click</button>
<a href="/page">Link</a>

// ❌ NEVER
<div onClick={...}>Click</div>
```

**Touch Targets**: 44x44px minimum (`min-h-[44px] min-w-[44px]` or `size-11`)

**Forms**:

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" aria-invalid={!!error} aria-describedby={error ? 'email-error' : undefined} />
  {error && (
    <span id="email-error" role="alert" className="text-sm text-destructive">
      {error}
    </span>
  )}
</div>
```

---

## 9. Validation Checklist

Before completing ANY UI code:

**Design Tokens**:

- [ ] No hard-coded colors (`#`, `rgb`, `oklch`)
- [ ] No arbitrary spacing values (`[` + `px]`)
- [ ] All colors use semantic tokens

**Spacing**:

- [ ] All spacing on 8px grid (2, 4, 6, 8, 12, 16, 24)
- [ ] Card padding is `p-6`

**Typography**:

- [ ] Headings use `font-heading` or correct weight
- [ ] Body text is `text-base`

**Components**:

- [ ] Uses shadcn/ui base
- [ ] React 19 pattern (no forwardRef)

**Accessibility**:

- [ ] Semantic HTML
- [ ] Focus indicators visible
- [ ] Labels associated with inputs
- [ ] Touch targets 44x44px min
- [ ] Color contrast meets WCAG AA

---

## 10. Quick Reference

```tsx
// Most Common Classes
bg-background bg-card bg-primary bg-accent-gold
text-foreground text-muted-foreground text-primary-foreground
border-border border-input rounded-md rounded-lg
focus-visible:ring-2 focus-visible:ring-ring
p-6 gap-4 gap-6 space-y-2
text-3xl font-bold (h1) | text-2xl font-semibold (h2) | text-xl font-medium (h3)
transition-colors duration-200 | shadow-sm shadow-md shadow-lg

// Signature Patterns
border-l-4 border-accent-gold (callouts)
hover:bg-accent-gold hover:text-foreground (CTAs)
bg-accent-gold/5 bg-accent-gold/10 (subtle emphasis)
animate-in fade-in duration-500 (entrances)
```

**Tokens**: See `tokens/color.json`, `tokens/effects.json`, `tokens/spacing.json`, `tokens/typography.json`

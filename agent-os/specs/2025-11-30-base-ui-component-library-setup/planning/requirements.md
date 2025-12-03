# Base UI Component Library Setup - Requirements

## Decisions Summary

### 1. Sidebar Approach

**Decision:** Enhance existing sidebar, don't replace.

**Rationale:**

- Current `apps/web/src/components/navigation/sidebar.tsx:41-113` has solid patterns: collapsible sections, active state highlighting with gold accent, proper focus states
- Follows shadcn/ui Sidebar patterns

**Enhancements to add:**

- Collapsed/mini mode for responsive design
- Keyboard navigation improvements

---

### 2. Organization Switcher

**Decision:** Include "Create New Organization" option.

**Rationale:**

- Standard pattern for multi-tenant SaaS (WorkOS, Clerk patterns)
- Reduces friction for onboarding new organizations
- `/create-organization` route already exists

**Implementation:** Separator + action at bottom of dropdown

---

### 3. PageContainer Components

**Decision:** Include all proposed elements plus subtitle.

**Include:**

- Page title/heading (required)
- Optional breadcrumbs
- Optional action buttons area (right-aligned)
- Standardized padding (`p-6` matching current layout) and responsive max-width
- Optional subtitle/description below heading

**Note:** If PageContainer needs route params (e.g., for breadcrumbs), use Next.js 16 async pattern.

---

### 4. Loading States Color

**Decision:** Use neutral muted tones, NOT gold accent.

**Rationale:**

- Skeleton screens should use neutral gray tones (`--muted`) per industry standard
- Less distracting during loading
- Reserve gold accent for interactive elements only (buttons, links, active states)

**Tokens:** `--muted: oklch(0.97 0 0)` for skeleton base

---

### 5. Toast System

**Decision:** Use shadcn/ui Sonner with full variant support.

**Include:**

- Success/error/warning/info variants
- Custom durations (error messages persist longer than success)
- Action buttons (for undo operations)

**Configuration:** `<Toaster />` in root layout, gold accent for success, destructive red for errors

---

### 6. Reusable Form Components

**Decision:** Include help text/description support.

**Rationale:**

- Existing `form.tsx:106-117` already exports FormDescription component
- Essential for accessibility and user guidance

**Implementation:** Use `useFormContext()` pattern with optional `description?: string` prop

---

### 7. TopBar Elements

**Decision:** Organization switcher + command palette trigger. Skip notification bell.

**Include:**

1. Organization switcher (left side, near logo)
2. Command palette trigger (⌘K)

**Exclude for now:**

- Notification bell — defer until notification infrastructure exists

---

### 8. Explicit Exclusions

1. Dark mode toggle — separate scope
2. Mobile navigation/hamburger menu — separate responsive spec
3. Breadcrumb implementation — PageContainer accepts them, but automatic system is separate
4. Complex form patterns (wizard, multi-step) — single-page form wrappers only
5. Notification system backend — only exclude bell, not toast system
6. Theme customization UI — premature until core is stable

---

## Existing Code Reference

| Pattern                | File Path                                         |
| ---------------------- | ------------------------------------------------- |
| Form primitives        | `packages/ui/src/components/form.tsx`             |
| Button variants        | `packages/ui/src/components/button.tsx`           |
| Dropdown/Select        | `packages/ui/src/components/select.tsx`           |
| Dialog modal           | `packages/ui/src/components/dialog.tsx`           |
| Current sidebar        | `apps/web/src/components/navigation/sidebar.tsx`  |
| Current topbar         | `apps/web/src/components/navigation/topbar.tsx`   |
| Auth layout            | `apps/web/src/app/(auth)/layout.tsx`              |
| UserMenu (org display) | `apps/web/src/components/auth/UserMenu.tsx:21-23` |
| Design tokens          | `apps/web/src/app/globals.css:15-67`              |

---

## Visual Assets

No visual assets provided.

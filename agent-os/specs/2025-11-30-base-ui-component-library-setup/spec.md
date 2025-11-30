# Specification: Base UI Component Library Setup

## Goal

Establish foundational UI infrastructure by enhancing the existing sidebar and topbar navigation, adding organization switching capabilities, creating a standardized PageContainer component, implementing a toast notification system, and building reusable form field wrappers for consistent user experience across the application.

## User Stories

- As a user navigating the application, I want a consistent page layout with clear headings and optional action buttons so that I can quickly understand context and take relevant actions
- As a user belonging to multiple organizations, I want to easily switch between organizations or create a new one so that I can manage all my workspaces efficiently

## Specific Requirements

**Enhanced Sidebar with Collapsed Mode**

- Extend existing `apps/web/src/components/navigation/sidebar.tsx` rather than replacing it
- Add collapsed/mini mode state (icon-only) controlled via local state or context
- Implement toggle button (chevron icon) at bottom of sidebar to expand/collapse
- In collapsed mode, show only icons; expand on hover or click for full labels
- Preserve existing active state highlighting with gold accent (`border-accent-gold`)
- Add keyboard navigation: Arrow keys to move between items, Enter/Space to activate

**Organization Switcher Component**

- Create new `apps/web/src/components/navigation/organization-switcher.tsx`
- Display current organization name with dropdown trigger (using existing Select pattern)
- List all user organizations with checkmark on active organization
- Add separator line followed by "Create New Organization" action at dropdown bottom
- "Create New Organization" navigates to existing `/create-organization` route
- Integrate with session data via `session.user.organization` pattern from UserMenu

**TopBar Enhancements**

- Add OrganizationSwitcher to left side of topbar, adjacent to logo
- Add command palette trigger button showing keyboard shortcut hint (Cmd/Ctrl+K)
- Command palette trigger is visual-only for now (no palette implementation)
- Maintain existing UserMenu on right side
- Keep current `h-16 border-b` structure and `px-6` padding

**PageContainer Component**

- Create `apps/web/src/components/layout/page-container.tsx`
- Required prop: `title: string` for page heading (renders as h1)
- Optional prop: `subtitle?: string` for description below heading
- Optional prop: `breadcrumbs?: ReactNode` for pre-rendered breadcrumb component slot
- Optional prop: `actions?: ReactNode` for right-aligned action buttons area
- Use standardized padding `p-6` matching current `(auth)/layout.tsx` main area
- Apply responsive max-width constraint: `max-w-7xl mx-auto`

**Loading State Components**

- Create `packages/ui/src/components/skeleton.tsx` with standard shadcn/ui Skeleton pattern
- Use neutral muted tones only: base color from `--muted: oklch(0.97 0 0)` token
- Provide variants: `Skeleton` (generic), `SkeletonText` (paragraph lines), `SkeletonCard`
- Animation: subtle pulse using existing Tailwind animate-pulse
- Export from `packages/ui/src/index.ts`

**Toast Notification System**

- Install sonner package and create `packages/ui/src/components/sonner.tsx` wrapper
- Configure four variants: success (gold accent), error (destructive red), warning, info
- Set duration defaults: success 4s, error 8s (persists longer), warning/info 5s
- Support action buttons within toast for undo operations
- Add `<Toaster />` component to `apps/web/src/app/layout.tsx` inside ThemeProvider
- Export toast helper from packages/ui for app-wide usage

**Reusable Form Field Wrapper**

- Create `packages/ui/src/components/form-field.tsx` as convenience wrapper
- Combine FormItem, FormLabel, FormControl, FormDescription, FormMessage from existing form.tsx
- Props: `label: string`, `name: string`, `description?: string`, `children: ReactNode`
- Use existing `useFormContext()` pattern for field state access
- Maintain accessibility: proper aria-describedby linking for descriptions and errors

**Keyboard Navigation Infrastructure**

- Create `apps/web/src/hooks/use-keyboard-shortcut.ts` hook
- Support modifier keys (Cmd/Ctrl, Shift, Alt) with cross-platform detection
- Register Cmd/Ctrl+K for command palette trigger (stubbed action for now)
- Provide cleanup on unmount to prevent memory leaks

## Visual Design

No visual mockups provided for this specification.

## Existing Code to Leverage

**Sidebar Navigation (`apps/web/src/components/navigation/sidebar.tsx`)**

- Reuse collapsible section pattern with `expandedItems` state and `toggleExpanded` function
- Maintain gold accent active states: `bg-accent-gold/5 border-l-4 border-accent-gold`
- Extend focus-visible styling: `focus-visible:ring-2 focus-visible:ring-ring`
- Keep icon + label pattern with `gap-3` spacing

**TopBar Component (`apps/web/src/components/navigation/topbar.tsx`)**

- Preserve async server component pattern with `auth()` session fetch
- Maintain `h-16 border-b` structure for consistent header height
- Follow existing left/right flex container pattern for element placement

**Form Primitives (`packages/ui/src/components/form.tsx`)**

- FormDescription already exists at lines 106-117 with proper aria linking
- useFormField hook provides `formDescriptionId` for accessibility
- FormItem provides consistent `grid gap-2` spacing

**Select Components (`packages/ui/src/components/select.tsx`)**

- Use SelectSeparator pattern for organization switcher dropdown divider
- Follow SelectItem styling for consistent dropdown appearance
- Leverage SelectContent portal and animation patterns

**Design Tokens (`apps/web/src/app/globals.css`)**

- Use `--muted: oklch(0.97 0 0)` for skeleton loading states
- Use `--accent-gold: oklch(0.786 0.088 81.5)` for success toast accent
- Use `--destructive: oklch(0.577 0.245 27.325)` for error states

## Out of Scope

- Dark mode toggle UI component (separate specification scope)
- Mobile hamburger menu and responsive navigation drawer
- Automatic breadcrumb generation system (PageContainer accepts pre-built breadcrumbs only)
- Multi-step form wizards or complex form patterns
- Notification bell icon and notification system backend
- Theme customization UI or user preference settings
- Command palette implementation (only visual trigger button in this spec)
- Data fetching for organization list (assumes data passed as prop)
- Sidebar persistence of collapsed state across sessions
- Animation/transition polish beyond basic Tailwind defaults

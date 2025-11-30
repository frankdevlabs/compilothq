# Task Breakdown: Base UI Component Library Setup

## Overview

Total Tasks: 32

This specification establishes foundational UI infrastructure including navigation enhancements, loading states, toast notifications, and form utilities. Tasks are organized to build shared UI primitives first, then infrastructure hooks, followed by navigation components, and finally integration.

## Task List

### Shared UI Primitives (packages/ui)

#### Task Group 1: Skeleton Loading Components

**Dependencies:** None

- [x] 1.0 Complete skeleton loading components
  - [x] 1.1 Write 3-5 focused tests for Skeleton component functionality
    - Test Skeleton base component renders with correct muted styling
    - Test SkeletonText renders multiple paragraph lines
    - Test SkeletonCard renders card placeholder structure
    - Test animate-pulse class is applied correctly
  - [x] 1.2 Create `packages/ui/src/components/skeleton.tsx`
    - Base `Skeleton` component with `bg-muted` using `--muted: oklch(0.97 0 0)` token
    - Apply `animate-pulse` for subtle loading animation
    - Accept className and standard div props for flexibility
  - [x] 1.3 Create `SkeletonText` variant
    - Props: `lines?: number` (default 3) for paragraph placeholder
    - Render multiple `Skeleton` elements with varying widths
    - Last line shorter (75%) to simulate natural text ending
  - [x] 1.4 Create `SkeletonCard` variant
    - Combine card structure with skeleton elements
    - Include header area, content lines, and optional action area
    - Match existing Card component proportions from `packages/ui/src/components/card.tsx`
  - [x] 1.5 Export skeleton components from `packages/ui/src/index.ts`
    - Add `export * from './components/skeleton'`
  - [x] 1.6 Ensure skeleton component tests pass
    - Run ONLY the 3-5 tests written in 1.1
    - Verify components render correctly with muted styling

**Acceptance Criteria:**

- The 3-5 tests written in 1.1 pass
- Skeleton components use neutral `--muted` token (NOT gold accent)
- animate-pulse animation works smoothly
- Components exported and importable from `@compilothq/ui`

---

#### Task Group 2: Toast Notification System

**Dependencies:** None (can run parallel to Task Group 1)

- [x] 2.0 Complete toast notification system
  - [x] 2.1 Write 4-6 focused tests for toast functionality
    - Test Toaster component renders without errors
    - Test success toast uses gold accent styling
    - Test error toast uses destructive red styling and 8s duration
    - Test toast with action button renders correctly
    - Test warning and info variants render with correct durations
  - [x] 2.2 Install sonner package in packages/ui
    - Run `pnpm add sonner` in packages/ui directory
    - Verify peer dependencies are satisfied
  - [x] 2.3 Create `packages/ui/src/components/sonner.tsx` wrapper
    - Import and configure Toaster from sonner
    - Set position to `top-right` or `bottom-right` (consistent with design)
    - Configure base styling to match design system
  - [x] 2.4 Configure toast variant durations and styling
    - Success: 4000ms duration, gold accent (`--accent-gold`)
    - Error: 8000ms duration (persists longer), destructive red (`--destructive`)
    - Warning: 5000ms duration
    - Info: 5000ms duration
  - [x] 2.5 Implement action button support in toast helper
    - Create typed toast helper functions: `toast.success()`, `toast.error()`, etc.
    - Support `action` prop with label and onClick for undo operations
    - Export toast helper for app-wide usage
  - [x] 2.6 Export sonner components from `packages/ui/src/index.ts`
    - Add `export * from './components/sonner'`
    - Export both `Toaster` component and `toast` helper
  - [x] 2.7 Ensure toast system tests pass
    - Run ONLY the 4-6 tests written in 2.1
    - Verify variant styling and durations are correct

**Acceptance Criteria:**

- The 4-6 tests written in 2.1 pass
- Four toast variants work with correct durations
- Action buttons functional within toasts
- Success uses gold accent, error uses destructive red
- Exported and importable from `@compilothq/ui`

---

#### Task Group 3: Reusable Form Field Wrapper

**Dependencies:** None (can run parallel to Task Groups 1-2)

- [x] 3.0 Complete form field wrapper component
  - [x] 3.1 Write 3-5 focused tests for FormFieldWrapper functionality
    - Test FormFieldWrapper renders label correctly
    - Test description text renders when provided
    - Test error message displays when form field has error
    - Test proper aria-describedby linking for accessibility
  - [x] 3.2 Create `packages/ui/src/components/form-field.tsx`
    - Props interface: `label: string`, `name: string`, `description?: string`, `children: ReactNode`
    - Import FormItem, FormLabel, FormControl, FormDescription, FormMessage from existing `form.tsx`
  - [x] 3.3 Implement FormFieldWrapper component logic
    - Use `useFormContext()` from react-hook-form for field state access
    - Compose: FormItem > FormLabel > FormControl (children) > FormDescription > FormMessage
    - Conditionally render FormDescription only when `description` prop provided
  - [x] 3.4 Ensure accessibility compliance
    - Verify proper `aria-describedby` linking via existing `formDescriptionId` pattern
    - Maintain existing error state highlighting from FormLabel
    - Follow patterns from `packages/ui/src/components/form.tsx:92-104`
  - [x] 3.5 Export form-field component from `packages/ui/src/index.ts`
    - Add `export * from './components/form-field'`
  - [x] 3.6 Ensure form field wrapper tests pass
    - Run ONLY the 3-5 tests written in 3.1
    - Verify accessibility attributes are correct

**Acceptance Criteria:**

- The 3-5 tests written in 3.1 pass
- FormFieldWrapper combines all form primitives correctly
- Description and error messages display appropriately
- Accessibility requirements met (aria-describedby linking)
- Exported and importable from `@compilothq/ui`

---

### Infrastructure Hooks

#### Task Group 4: Keyboard Shortcut Hook

**Dependencies:** None

- [x] 4.0 Complete keyboard shortcut infrastructure
  - [x] 4.1 Write 3-4 focused tests for useKeyboardShortcut hook
    - Test hook registers keyboard event listener on mount
    - Test hook cleans up listener on unmount (no memory leaks)
    - Test Cmd/Ctrl modifier detection works cross-platform
    - Test callback fires when correct shortcut pressed
  - [x] 4.2 Create `apps/web/src/hooks/use-keyboard-shortcut.ts`
    - Define shortcut config type: `{ key: string, modifiers?: ('cmd' | 'ctrl' | 'shift' | 'alt')[], callback: () => void }`
    - Implement cross-platform detection: `navigator.platform` or `navigator.userAgent` for Mac vs Windows/Linux
  - [x] 4.3 Implement core hook logic
    - Use `useEffect` to add/remove `keydown` event listener on `window`
    - Check modifier keys: `event.metaKey` (Cmd on Mac), `event.ctrlKey` (Ctrl on Windows/Linux)
    - Normalize key comparison (case-insensitive)
    - Call `event.preventDefault()` when shortcut matches
  - [x] 4.4 Add cleanup on unmount
    - Return cleanup function from useEffect
    - Ensure no dangling event listeners after component unmount
    - Verify with test that cleanup is called
  - [x] 4.5 Ensure keyboard shortcut hook tests pass
    - Run ONLY the 3-4 tests written in 4.1
    - Verify cross-platform modifier detection works

**Acceptance Criteria:**

- The 3-4 tests written in 4.1 pass
- Hook properly registers and cleans up event listeners
- Cross-platform modifier key support (Cmd on Mac, Ctrl on Windows/Linux)
- No memory leaks on unmount

---

### Navigation Components

#### Task Group 5: Organization Switcher Component

**Dependencies:** Task Groups 1-3 (UI primitives available)

- [x] 5.0 Complete organization switcher component
  - [x] 5.1 Write 4-6 focused tests for OrganizationSwitcher
    - Test component renders current organization name
    - Test dropdown opens and shows organization list
    - Test checkmark appears on active organization
    - Test "Create New Organization" action navigates to `/create-organization`
    - Test separator line renders between org list and create action
  - [x] 5.2 Create `apps/web/src/components/navigation/organization-switcher.tsx`
    - Mark as `'use client'` component
    - Define props interface: `currentOrg: Organization`, `organizations: Organization[]`
    - Organization type: `{ id: string, name: string }`
  - [x] 5.3 Implement dropdown trigger using Select pattern
    - Use Select, SelectTrigger, SelectContent, SelectItem from `@compilothq/ui`
    - Display current organization name in trigger
    - Follow styling from `packages/ui/src/components/select.tsx`
  - [x] 5.4 Implement organization list with checkmark indicator
    - Map organizations to SelectItem components
    - Show CheckIcon for active organization (via SelectPrimitive.ItemIndicator)
    - Handle organization switch via `onValueChange` callback
  - [x] 5.5 Add "Create New Organization" action with separator
    - Use SelectSeparator before the create action
    - Render "Create New Organization" as clickable item
    - Navigate to `/create-organization` route using `next/navigation` `useRouter`
  - [x] 5.6 Ensure organization switcher tests pass
    - Run ONLY the 4-6 tests written in 5.1
    - Verify dropdown behavior and navigation work correctly

**Acceptance Criteria:**

- The 4-6 tests written in 5.1 pass
- Current organization displayed in dropdown trigger
- Checkmark shows on active organization
- Create action navigates to correct route
- Follows existing Select component patterns

---

#### Task Group 6: Enhanced Sidebar with Collapsed Mode

**Dependencies:** Task Group 4 (keyboard hook)

- [ ] 6.0 Complete enhanced sidebar with collapsed mode
  - [ ] 6.1 Write 4-6 focused tests for enhanced Sidebar
    - Test sidebar renders in expanded mode by default
    - Test collapse toggle button shows/hides labels
    - Test collapsed mode shows only icons
    - Test keyboard navigation (Arrow keys) moves between items
    - Test Enter/Space activates focused item
  - [ ] 6.2 Add collapsed state management to `apps/web/src/components/navigation/sidebar.tsx`
    - Add `isCollapsed` state via `useState(false)`
    - Consider future context extraction (out of scope for this spec)
    - Maintain existing `expandedItems` state for collapsible sections
  - [ ] 6.3 Implement collapse toggle button
    - Add toggle button at bottom of sidebar
    - Use ChevronLeft/ChevronRight icon (or similar) to indicate direction
    - Style: `focus-visible:ring-2 focus-visible:ring-ring` for accessibility
  - [ ] 6.4 Implement collapsed mode styling
    - Collapsed width: ~64px (icon-only)
    - Expanded width: existing 256px (`w-64`)
    - Hide text labels in collapsed mode using conditional rendering or CSS
    - Keep icons visible at `h-4 w-4` size
    - Preserve gold accent active states: `bg-accent-gold/5 border-l-4 border-accent-gold`
  - [ ] 6.5 Add hover expansion behavior for collapsed mode
    - On hover in collapsed mode, show tooltip with label OR expand temporarily
    - Use CSS transitions for smooth expand/collapse animation
    - Keep existing `transition-colors duration-200` pattern
  - [ ] 6.6 Implement keyboard navigation
    - Arrow Up/Down to move focus between nav items
    - Enter/Space to activate (navigate or expand section)
    - Use `tabIndex` and `onKeyDown` handlers
    - Maintain focus visible styling: `focus-visible:ring-2 focus-visible:ring-ring`
  - [ ] 6.7 Ensure enhanced sidebar tests pass
    - Run ONLY the 4-6 tests written in 6.1
    - Verify collapsed mode and keyboard navigation work

**Acceptance Criteria:**

- The 4-6 tests written in 6.1 pass
- Toggle button collapses/expands sidebar
- Collapsed mode shows icons only
- Keyboard navigation functional
- Existing gold accent styling preserved

---

#### Task Group 7: TopBar Enhancements

**Dependencies:** Task Groups 4, 5 (keyboard hook, organization switcher)

- [ ] 7.0 Complete topbar enhancements
  - [ ] 7.1 Write 3-5 focused tests for enhanced TopBar
    - Test OrganizationSwitcher renders on left side of topbar
    - Test command palette trigger button renders with shortcut hint
    - Test existing UserMenu still renders on right side
    - Test topbar maintains h-16 border-b structure
  - [ ] 7.2 Update `apps/web/src/components/navigation/topbar.tsx` structure
    - Keep async server component pattern with `auth()` session fetch
    - Maintain existing left/right flex container: `flex items-center justify-between`
    - Keep `h-16 border-b` and `px-6` padding
  - [ ] 7.3 Add OrganizationSwitcher to left side
    - Import OrganizationSwitcher component
    - Position adjacent to logo in left container
    - Pass session.user.organization as current org
    - Pass organizations array (stubbed/from session for now, data fetching out of scope)
  - [ ] 7.4 Create command palette trigger button
    - Create client component for the trigger button (or inline)
    - Display keyboard shortcut hint: show "Cmd+K" on Mac, "Ctrl+K" on Windows/Linux
    - Use Button with `variant="ghost"` and size="sm"
    - Include Search icon from lucide-react
  - [ ] 7.5 Wire up keyboard shortcut for command palette trigger
    - Use `useKeyboardShortcut` hook from Task Group 4
    - Register Cmd/Ctrl+K shortcut
    - Stubbed callback: `console.log('Command palette triggered')` (implementation out of scope)
  - [ ] 7.6 Ensure UserMenu remains on right side
    - Verify existing `{session && <UserMenu session={session} />}` pattern preserved
    - Maintain gap-4 spacing between elements
  - [ ] 7.7 Ensure topbar enhancement tests pass
    - Run ONLY the 3-5 tests written in 7.1
    - Verify component placement and structure

**Acceptance Criteria:**

- The 3-5 tests written in 7.1 pass
- OrganizationSwitcher renders left of center
- Command palette trigger shows correct platform shortcut
- UserMenu preserved on right side
- Original h-16 border-b structure maintained

---

### Layout Components

#### Task Group 8: PageContainer Component

**Dependencies:** Task Groups 1-3 (UI primitives available)

- [ ] 8.0 Complete PageContainer component
  - [ ] 8.1 Write 4-6 focused tests for PageContainer
    - Test PageContainer renders title as h1 element
    - Test subtitle renders below heading when provided
    - Test breadcrumbs slot renders when provided
    - Test actions slot renders right-aligned when provided
    - Test container applies p-6 padding and max-w-7xl constraint
  - [ ] 8.2 Create `apps/web/src/components/layout/page-container.tsx`
    - Props interface: `title: string`, `subtitle?: string`, `breadcrumbs?: ReactNode`, `actions?: ReactNode`, `children: ReactNode`
    - Mark as client or server component based on usage (likely server-compatible)
  - [ ] 8.3 Implement header section with title and actions
    - Render `title` as `<h1>` with appropriate heading styles
    - Render optional `subtitle` as `<p>` with muted text styling below h1
    - Flex container with `justify-between` for title/actions alignment
    - Actions slot right-aligned
  - [ ] 8.4 Implement breadcrumbs slot
    - Render `breadcrumbs` ReactNode above the title section
    - No automatic breadcrumb generation (accepts pre-built component)
    - Appropriate margin-bottom between breadcrumbs and title
  - [ ] 8.5 Apply standardized layout styling
    - Container padding: `p-6` matching `(auth)/layout.tsx` main area
    - Max-width constraint: `max-w-7xl mx-auto` for responsive centering
    - Ensure children render below header section with appropriate spacing
  - [ ] 8.6 Ensure PageContainer tests pass
    - Run ONLY the 4-6 tests written in 8.1
    - Verify all slots render correctly

**Acceptance Criteria:**

- The 4-6 tests written in 8.1 pass
- Title renders as h1, subtitle as description
- Breadcrumbs and actions slots work correctly
- Standardized p-6 padding and max-w-7xl applied
- Responsive layout maintained

---

### Integration

#### Task Group 9: Root Layout Integration

**Dependencies:** Task Group 2 (Toast system)

- [ ] 9.0 Complete root layout integration
  - [ ] 9.1 Write 2-3 focused tests for root layout integration
    - Test Toaster component renders inside ThemeProvider
    - Test toast notifications can be triggered from child components
  - [ ] 9.2 Add Toaster to `apps/web/src/app/layout.tsx`
    - Import Toaster from `@compilothq/ui`
    - Place `<Toaster />` inside ThemeProvider, after {children}
    - Ensure Toaster respects theme (light/dark mode)
  - [ ] 9.3 Verify toast notifications work app-wide
    - Create simple test page or use existing page to trigger toast
    - Test all four variants: success, error, warning, info
    - Verify styling matches design tokens
  - [ ] 9.4 Ensure root layout integration tests pass
    - Run ONLY the 2-3 tests written in 9.1
    - Verify toasts render correctly

**Acceptance Criteria:**

- The 2-3 tests written in 9.1 pass
- Toaster component renders in root layout
- Toast notifications visible from any page
- Theme-aware styling works

---

### Testing & Verification

#### Task Group 10: Test Review and Gap Analysis

**Dependencies:** Task Groups 1-9

- [ ] 10.0 Review existing tests and fill critical gaps only
  - [ ] 10.1 Review tests from Task Groups 1-9
    - Review 3-5 skeleton tests (Task 1.1)
    - Review 4-6 toast tests (Task 2.1)
    - Review 3-5 form field tests (Task 3.1)
    - Review 3-4 keyboard hook tests (Task 4.1)
    - Review 4-6 organization switcher tests (Task 5.1)
    - Review 4-6 sidebar tests (Task 6.1)
    - Review 3-5 topbar tests (Task 7.1)
    - Review 4-6 PageContainer tests (Task 8.1)
    - Review 2-3 integration tests (Task 9.1)
    - Total existing tests: approximately 30-46 tests
  - [ ] 10.2 Analyze test coverage gaps for this feature only
    - Identify critical user workflows that lack test coverage
    - Focus on integration between components (e.g., sidebar + keyboard navigation)
    - Prioritize end-to-end workflows over unit test gaps
  - [ ] 10.3 Write up to 10 additional strategic tests maximum
    - Focus on component integration points
    - Test navigation flow: sidebar collapse + org switcher interaction
    - Test toast triggering from various contexts
    - Skip edge cases unless business-critical
  - [ ] 10.4 Run feature-specific tests only
    - Run ONLY tests related to this spec's feature
    - Expected total: approximately 40-56 tests maximum
    - Verify critical workflows pass
    - Do NOT run entire application test suite

**Acceptance Criteria:**

- All feature-specific tests pass (approximately 40-56 tests total)
- Critical user workflows for this feature are covered
- No more than 10 additional tests added when filling in testing gaps
- Testing focused exclusively on this spec's feature requirements

---

## Execution Order

Recommended implementation sequence based on dependencies:

```
Phase 1: Shared UI Primitives (Parallel)
├── Task Group 1: Skeleton Loading Components
├── Task Group 2: Toast Notification System
└── Task Group 3: Reusable Form Field Wrapper

Phase 2: Infrastructure (Can start during Phase 1)
└── Task Group 4: Keyboard Shortcut Hook

Phase 3: Navigation Components (Sequential)
├── Task Group 5: Organization Switcher Component
├── Task Group 6: Enhanced Sidebar with Collapsed Mode (depends on 4)
└── Task Group 7: TopBar Enhancements (depends on 4, 5)

Phase 4: Layout Components (Can start during Phase 3)
└── Task Group 8: PageContainer Component

Phase 5: Integration (After Phase 3)
└── Task Group 9: Root Layout Integration

Phase 6: Verification (After all phases)
└── Task Group 10: Test Review and Gap Analysis
```

## File Summary

### New Files to Create

| File Path                                                      | Task Group |
| -------------------------------------------------------------- | ---------- |
| `packages/ui/src/components/skeleton.tsx`                      | 1          |
| `packages/ui/src/components/sonner.tsx`                        | 2          |
| `packages/ui/src/components/form-field.tsx`                    | 3          |
| `apps/web/src/hooks/use-keyboard-shortcut.ts`                  | 4          |
| `apps/web/src/components/navigation/organization-switcher.tsx` | 5          |
| `apps/web/src/components/layout/page-container.tsx`            | 8          |

### Existing Files to Modify

| File Path                                        | Task Group |
| ------------------------------------------------ | ---------- |
| `packages/ui/src/index.ts`                       | 1, 2, 3    |
| `apps/web/src/components/navigation/sidebar.tsx` | 6          |
| `apps/web/src/components/navigation/topbar.tsx`  | 7          |
| `apps/web/src/app/layout.tsx`                    | 9          |

## Design Token Reference

| Token           | Value                       | Usage                         |
| --------------- | --------------------------- | ----------------------------- |
| `--muted`       | `oklch(0.97 0 0)`           | Skeleton loading backgrounds  |
| `--accent-gold` | `oklch(0.786 0.088 81.5)`   | Success toasts, active states |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Error toasts, error states    |

## Out of Scope Reminders

- Dark mode toggle UI component
- Mobile hamburger menu / responsive drawer
- Automatic breadcrumb generation
- Multi-step form wizards
- Notification bell and backend
- Command palette implementation (only trigger button)
- Data fetching for organization list
- Sidebar collapsed state persistence across sessions
- Advanced animations beyond Tailwind defaults

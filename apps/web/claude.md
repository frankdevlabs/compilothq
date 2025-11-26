# Design System Context

We use a minimal design system inspired by franksblog.nl with these principles:

- Content-first minimalism
- System fonts only (no custom fonts to load)
- Neutral color palette with single accent color
- Consistent 8px spacing scale
- Clean, professional aesthetic

## Design Tokens Location

- All tokens in `.claude/skills/compilo-design/tokens/*.json`
- Generated CSS variables in `./src/app/global.css`

## Token Naming Convention

- Colors: `color.semantic.{purpose}.{variant}`
- Spacing: `spacing.{size}` (xs, sm, md, lg, xl, 2xl, 3xl)
- Typography: `font.{category}.{property}`

## Component Patterns

- Always use semantic color tokens, never primitive colors directly
- All interactive elements need hover, focus, disabled states
- Mobile-first responsive approach
- Minimum touch target: 44x44px

## Focus Indicators

**Standard**: All interactive elements use `ring-2` (2px width)
**Pattern**: `focus-visible:ring-2 focus-visible:ring-ring`
**Rationale**: Aligns with 8px grid (2px = 8px / 4)
**WCAG**: Ensures 3:1 contrast minimum for AA compliance

Example usage:

```tsx
<button className="focus-visible:ring-2 focus-visible:ring-ring">Click me</button>
```

## Email Templates Exception

**Location**: `/apps/web/src/emails/*.tsx`
**Pattern**: Inline styles with `EMAIL_COLORS` constants
**Rationale**: Email clients don't support CSS variables or Tailwind classes

All email template colors must be documented in the `EMAIL_COLORS` constant with design token mappings:

- background: #f6f9fc → bg-background (light mode)
- cardBackground: #ffffff → bg-card
- text: #333 → text-foreground
- buttonBg: #000 → bg-primary (dark navy)
- buttonText: #fff → text-primary-foreground
- mutedText: #8898aa → text-muted-foreground

## Acceptable Arbitrary Values

Allowed for specific use cases only:

- `top-[1px]` - Icon alignment (1px micro-adjustments)
- `top-[50%]` - Centering transforms
- `top-[60%]` - Popover arrow positioning
- `calc(100% - Xrem)` - Responsive calculations using rem units

All other arbitrary values should use the 8px grid system.

## Development Authentication for Testing

When validating or testing authenticated UI features, use the development authentication system:

```bash
# Quick authentication for browser testing
pnpm dev:login --persona=DPO

# Use in Playwright tests
import { setAuthCookie } from './__tests__/e2e/helpers/dev-auth'
await setAuthCookie(page, 'DPO')
```

**Available personas**: DPO, PRIVACY_OFFICER, BUSINESS_OWNER, IT_ADMIN, SECURITY_TEAM, LEGAL_TEAM

**Common scenarios**:

- Validating protected pages and components in browser
- Taking screenshots of authenticated features for Claude Code validation
- E2E testing of user-specific UI flows
- Testing persona-based access control and permissions

**Full guide**: [docs/development-authentication.md](../../docs/development-authentication.md)

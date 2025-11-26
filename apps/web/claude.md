# Design System Context

We use a minimal design system inspired by franksblog.nl with these principles:

- Content-first minimalism
- System fonts only (no custom fonts to load)
- Neutral color palette with single accent color
- Consistent 8px spacing scale
- Clean, professional aesthetic

## Design Tokens Location

- All tokens in `../../docs/design-tokens/*.json`
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

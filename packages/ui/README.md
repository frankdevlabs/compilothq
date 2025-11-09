# @compilothq/ui

Shared UI component library for Compilot HQ built with shadcn/ui and Radix UI.

## Purpose

Provides reusable, accessible UI components with consistent styling across the application. Components are built on top of Radix UI primitives with class-variance-authority for variant management.

## Usage

```typescript
import { Button, Card, CardContent, CardHeader, CardTitle, Input, cn } from '@compilothq/ui'

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello World</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Enter text..." />
        <Button variant="default">Submit</Button>
      </CardContent>
    </Card>
  )
}
```

## Available Components

### Button

Versatile button component with multiple variants:

- `default` - Primary button style
- `destructive` - For dangerous actions
- `outline` - Outlined button
- `secondary` - Secondary style
- `ghost` - Minimal style
- `link` - Link-styled button

Sizes: `default`, `sm`, `lg`, `icon`

### Card

Container component with header, content, footer, title, and description sub-components:

- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardDescription` - Description text
- `CardContent` - Main content area
- `CardFooter` - Footer section

### Input

Form input component with consistent styling and focus states.

## Utilities

### cn Function

Utility function for merging Tailwind CSS classes with proper precedence:

```typescript
import { cn } from '@compilothq/ui'

<div className={cn('base-classes', conditionalClasses, props.className)} />
```

Uses `clsx` and `tailwind-merge` under the hood.

## Available Scripts

- `pnpm build` - Build TypeScript to dist/
- `pnpm dev` - Watch mode for TypeScript compilation
- `pnpm clean` - Remove dist/ folder

## Peer Dependencies

This package requires:

- `react` ^19.0.0
- `react-dom` ^19.0.0

These should be installed in the consuming application.

## Styling

Components use Tailwind CSS classes and require Tailwind to be configured in the consuming application. All components support:

- Dark mode via `dark:` prefix
- Focus-visible states
- Accessibility features from Radix UI

## Development

To add new components:

1. Create component file in `src/components/`
2. Export from `src/index.ts`
3. Run `pnpm build` to compile
4. Import in your Next.js app

## Component Design Principles

- **Accessibility First** - Built on Radix UI primitives
- **Composable** - Components can be combined flexibly
- **Customizable** - Accept className and style props
- **Type-Safe** - Full TypeScript support with proper types
- **Consistent** - Unified design language across all components

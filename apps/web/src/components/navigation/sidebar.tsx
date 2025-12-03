'use client'

import { cn } from '@compilothq/ui'
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck,
  FileText,
  LayoutDashboard,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { KeyboardEvent, useCallback, useRef, useState } from 'react'

/**
 * Navigation item type with optional children for collapsible sections
 */
type NavItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  children?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Processing Activities', href: '/activities', icon: FileText },
  {
    label: 'Components',
    icon: Building2,
    children: [
      { label: 'Processors', href: '/components/processors' },
      { label: 'Data Categories', href: '/components/data-categories' },
      { label: 'Risks', href: '/components/risks' },
    ],
  },
  { label: 'Questionnaires', href: '/questionnaires', icon: ClipboardList },
  {
    label: 'Documents',
    icon: FileCheck,
    children: [
      { label: 'DPIAs', href: '/documents/dpias' },
      { label: 'ROPAs', href: '/documents/ropas' },
    ],
  },
  { label: 'Settings', href: '/settings', icon: Settings },
]

/**
 * Enhanced Sidebar Component with Collapsed Mode
 *
 * Features:
 * - Collapsed/expanded mode toggle
 * - Keyboard navigation (Arrow keys, Enter/Space)
 * - Hover tooltips in collapsed mode
 * - Gold accent active state highlighting
 * - Smooth CSS transitions
 */
export function Sidebar() {
  const pathname = usePathname()

  // Task 6.2: Collapsed state management
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Existing expandedItems state for collapsible sections
  const [expandedItems, setExpandedItems] = useState<string[]>(['Components', 'Documents'])

  // Ref for keyboard navigation
  const navRef = useRef<HTMLElement>(null)

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    )
  }

  // Task 6.3: Toggle collapse handler
  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev)
    // When collapsing, also collapse all sections
    if (!isCollapsed) {
      setExpandedItems([])
    }
  }

  // Task 6.6: Get all focusable elements in the nav
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!navRef.current) return []
    const elements = navRef.current.querySelectorAll<HTMLElement>(
      'a, button:not([data-collapse-toggle])'
    )
    return Array.from(elements)
  }, [])

  // Task 6.6: Focus element at index safely
  const focusElementAtIndex = useCallback((elements: HTMLElement[], index: number) => {
    // Using at() method for safe array access without direct index notation
    const element = elements.at(index)
    element?.focus()
  }, [])

  // Task 6.6: Handle keyboard navigation
  const handleNavKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const focusableElements = getFocusableElements()
    const currentIndex = focusableElements.findIndex((el) => el === document.activeElement)

    if (currentIndex === -1 || focusableElements.length === 0) return

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault()
        const nextIndex = (currentIndex + 1) % focusableElements.length
        focusElementAtIndex(focusableElements, nextIndex)
        break
      }
      case 'ArrowUp': {
        event.preventDefault()
        const prevIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length
        focusElementAtIndex(focusableElements, prevIndex)
        break
      }
      // Enter and Space are handled natively by links and buttons
    }
  }

  return (
    <aside
      className={cn(
        'hidden md:flex border-r bg-card flex-col transition-all duration-300 ease-in-out',
        // Task 6.4: Collapsed width (~64px) vs expanded width (256px)
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo section */}
      <div className={cn('p-6', isCollapsed && 'p-4 flex justify-center')}>
        <h1
          className={cn(
            'text-2xl font-bold text-foreground transition-all duration-300',
            isCollapsed && 'text-lg'
          )}
        >
          {isCollapsed ? 'C' : 'Compilo'}
        </h1>
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="flex-1 px-4 py-2" onKeyDown={handleNavKeyDown}>
        {navItems.map((item) => {
          if ('children' in item && item.children) {
            const isExpanded = expandedItems.includes(item.label)

            return (
              <div key={item.label} className="mb-1 group relative">
                <button
                  onClick={() => !isCollapsed && toggleExpanded(item.label)}
                  // Task 6.5: Show tooltip on hover in collapsed mode
                  title={isCollapsed ? item.label : undefined}
                  aria-label={item.label}
                  tabIndex={0}
                  className={cn(
                    'flex items-center w-full px-3 py-2 text-sm rounded transition-colors duration-200',
                    'hover:bg-accent-gold/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    isCollapsed ? 'justify-center gap-0' : 'gap-3'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span
                    className={cn(
                      'flex-1 text-left transition-opacity duration-200',
                      // Task 6.4: Hide labels in collapsed mode (sr-only for accessibility)
                      isCollapsed && 'sr-only'
                    )}
                  >
                    {item.label}
                  </span>
                  {!isCollapsed && (
                    <ChevronDown
                      className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
                    />
                  )}
                </button>

                {/* Task 6.5: CSS tooltip for collapsed mode on hover */}
                {isCollapsed && (
                  <div
                    className={cn(
                      'absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1',
                      'bg-popover text-popover-foreground text-sm rounded shadow-md',
                      'opacity-0 group-hover:opacity-100 pointer-events-none',
                      'transition-opacity duration-200 whitespace-nowrap z-50'
                    )}
                  >
                    {item.label}
                  </div>
                )}

                {/* Expanded children - only show when not collapsed and section is expanded */}
                {isExpanded && !isCollapsed && (
                  <div className="ml-7 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        tabIndex={0}
                        className={cn(
                          'block px-3 py-2 text-sm rounded transition-colors duration-200',
                          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                          // Task 6.4: Preserve gold accent active states
                          pathname === child.href
                            ? 'bg-accent-gold/5 text-foreground font-medium border-l-4 border-accent-gold'
                            : 'hover:bg-accent-gold/5 text-foreground'
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          // Regular nav item (no children) - href is guaranteed to exist for items without children
          const itemHref = item.href ?? '#'
          return (
            <div key={itemHref} className="mb-1 group relative">
              <Link
                href={itemHref}
                // Task 6.5: Show tooltip on hover in collapsed mode
                title={isCollapsed ? item.label : undefined}
                tabIndex={0}
                className={cn(
                  'flex items-center px-3 py-2 text-sm rounded transition-colors duration-200',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  isCollapsed ? 'justify-center gap-0' : 'gap-3',
                  // Task 6.4: Preserve gold accent active states
                  pathname === item.href
                    ? 'bg-accent-gold/5 text-foreground font-medium border-l-4 border-accent-gold'
                    : 'hover:bg-accent-gold/5 text-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span
                  className={cn(
                    'transition-opacity duration-200',
                    // Task 6.4: Hide labels in collapsed mode (sr-only for accessibility)
                    isCollapsed && 'sr-only'
                  )}
                >
                  {item.label}
                </span>
              </Link>

              {/* Task 6.5: CSS tooltip for collapsed mode on hover */}
              {isCollapsed && (
                <div
                  className={cn(
                    'absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1',
                    'bg-popover text-popover-foreground text-sm rounded shadow-md',
                    'opacity-0 group-hover:opacity-100 pointer-events-none',
                    'transition-opacity duration-200 whitespace-nowrap z-50'
                  )}
                >
                  {item.label}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Task 6.3: Collapse toggle button at bottom of sidebar */}
      <div className={cn('p-4 border-t', isCollapsed && 'flex justify-center')}>
        <button
          onClick={toggleCollapse}
          data-collapse-toggle
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex items-center px-3 py-2 text-sm rounded transition-colors duration-200',
            'hover:bg-accent-gold/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            isCollapsed ? 'justify-center' : 'gap-3 w-full'
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

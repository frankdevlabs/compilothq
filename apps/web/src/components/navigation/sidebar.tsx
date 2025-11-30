'use client'

import { cn } from '@compilothq/ui'
import {
  Building2,
  ChevronDown,
  ClipboardList,
  FileCheck,
  FileText,
  LayoutDashboard,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navItems = [
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

export function Sidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['Components', 'Documents'])

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    )
  }

  return (
    <aside className="hidden md:flex w-64 border-r bg-card flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground">Compilo</h1>
      </div>
      <nav className="flex-1 px-4 py-2">
        {navItems.map((item) => {
          if ('children' in item && item.children) {
            const isExpanded = expandedItems.includes(item.label)
            return (
              <div key={item.label} className="mb-1">
                <button
                  onClick={() => toggleExpanded(item.label)}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded hover:bg-accent-gold/5 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
                  />
                </button>
                {isExpanded && (
                  <div className="ml-7 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block px-3 py-2 text-sm rounded transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
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

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 mb-1 text-sm rounded transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                pathname === item.href
                  ? 'bg-accent-gold/5 text-foreground font-medium border-l-4 border-accent-gold'
                  : 'hover:bg-accent-gold/5 text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

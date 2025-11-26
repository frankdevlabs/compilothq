'use client'

import { Button, Sheet, SheetContent, SheetTrigger } from '@compilothq/ui'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="border-b bg-background">
      <nav className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold">
          Compilo
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/features" className="hover:text-accent-gold transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-accent-gold transition-colors">
            Pricing
          </Link>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="gold" asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="flex flex-col gap-6 mt-6">
              <Link
                href="/features"
                onClick={() => setIsOpen(false)}
                className="text-lg hover:text-accent-gold transition-colors"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                onClick={() => setIsOpen(false)}
                className="text-lg hover:text-accent-gold transition-colors"
              >
                Pricing
              </Link>
              <div className="flex flex-col gap-3 mt-4">
                <Button variant="outline" asChild>
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    Login
                  </Link>
                </Button>
                <Button variant="gold" asChild>
                  <Link href="/signup" onClick={() => setIsOpen(false)}>
                    Sign Up
                  </Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}

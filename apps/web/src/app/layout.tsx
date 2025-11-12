import './globals.css'

import type { Metadata } from 'next'
import { Raleway, Ubuntu } from 'next/font/google'

import { ThemeProvider } from '@/components/theme-provider'
import { TRPCProvider } from '@/lib/trpc/client'

const ubuntu = Ubuntu({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-ubuntu',
})

const raleway = Raleway({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  variable: '--font-raleway',
})

export const metadata: Metadata = {
  title: 'Compilo - Component-based Compliance',
  description: 'Generate GDPR documentation in hours, not weeks',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ubuntu.variable} ${raleway.variable} antialiased`}>
        <TRPCProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
          >
            {children}
          </ThemeProvider>
        </TRPCProvider>
      </body>
    </html>
  )
}

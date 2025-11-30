import './globals.css'

import { Toaster } from '@compilothq/ui'
import type { Metadata } from 'next'
import { Raleway, Ubuntu } from 'next/font/google'

import { SessionProvider } from '@/components/auth/SessionProvider'
import { ThemeProvider } from '@/components/theme-provider'
import { auth } from '@/lib/auth/config'
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ubuntu.variable} ${raleway.variable} antialiased`}>
        <SessionProvider session={session}>
          <TRPCProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange={false}
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </TRPCProvider>
        </SessionProvider>
      </body>
    </html>
  )
}

import { redirect } from 'next/navigation'

import { Sidebar } from '@/components/navigation/sidebar'
import { TopBar } from '@/components/navigation/topbar'
import { auth } from '@/lib/auth/config'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Redirect to create-organization if user doesn't have one yet
  if (!session?.user.organizationId) {
    redirect('/create-organization')
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

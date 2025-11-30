import { Sidebar } from '@/components/navigation/sidebar'
import { TopBar } from '@/components/navigation/topbar'
import { requireAuthWithOrg } from '@/lib/auth/helpers'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Ensure user is authenticated and has an organization
  // Redirects to login or create-organization if needed
  await requireAuthWithOrg()

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

import { UserMenu } from '@/components/auth/UserMenu'
import { ThemeToggle } from '@/components/theme-toggle'
import { auth } from '@/lib/auth/config'

export async function TopBar() {
  const session = await auth()

  return (
    <div className="h-16 border-b flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Compilo</h1>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {session && <UserMenu session={session} />}
      </div>
    </div>
  )
}

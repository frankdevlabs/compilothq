import { Card, CardContent } from '@compilothq/ui'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Settings className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Settings coming soon</h2>
          <p className="text-muted-foreground text-center">
            Account settings will be available in a future update
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

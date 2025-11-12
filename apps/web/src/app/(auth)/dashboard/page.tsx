import { Button, Card, CardContent, CardHeader, CardTitle } from '@compilothq/ui'
import { FileText } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your compliance activities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Processing Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Total activities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Components</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Reusable components</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Generated documents</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No activities yet</h2>
          <p className="text-muted-foreground mb-4 text-center">
            Create your first processing activity to get started
          </p>
          <Button asChild>
            <Link href="/activities">View Activities</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

import { Button, Card, CardContent } from '@compilothq/ui'
import { FileText, Plus } from 'lucide-react'

export default function ActivitiesPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Processing Activities</h1>
          <p className="text-muted-foreground">Manage GDPR processing activities</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-background" disabled>
          <Plus className="mr-2 h-4 w-4" />
          New Activity
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No activities found</h2>
          <p className="text-muted-foreground text-center">
            Click &quot;New Activity&quot; to create your first processing activity
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

import { Button, Card, CardContent } from '@compilothq/ui'
import { Building2, Plus } from 'lucide-react'

export default function ProcessorsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Data Processors</h1>
          <p className="text-muted-foreground">Manage data processor components</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-background" disabled>
          <Plus className="mr-2 h-4 w-4" />
          New Processor
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No processors found</h2>
          <p className="text-muted-foreground text-center">
            Click &quot;New Processor&quot; to add your first data processor
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

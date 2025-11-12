import { Card, CardContent } from '@compilothq/ui'
import { FileText } from 'lucide-react'

export default function DPIAsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">DPIAs</h1>
        <p className="text-muted-foreground">Data Protection Impact Assessments</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No DPIAs yet</h2>
          <p className="text-muted-foreground text-center">
            DPIAs will be automatically generated from your processing activities
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

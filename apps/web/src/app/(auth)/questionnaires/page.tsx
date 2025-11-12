import { Card, CardContent } from '@compilothq/ui'
import { ClipboardList } from 'lucide-react'

export default function QuestionnairesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Questionnaires</h1>
        <p className="text-muted-foreground">Manage compliance questionnaires</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Questionnaires coming soon</h2>
          <p className="text-muted-foreground text-center">
            Guided questionnaires will be available in a future update
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

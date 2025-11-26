import { Card, CardContent, CardHeader, CardTitle } from '@compilothq/ui'
import { Building2, ClipboardList, FileText } from 'lucide-react'

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-6 py-24">
      <h1 className="text-4xl font-bold text-center mb-4">Features</h1>
      <p className="text-xl text-muted-foreground text-center mb-12">
        Everything you need for GDPR compliance
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <Building2 className="h-12 w-12 text-primary mb-4" />
            <CardTitle>Reusable Component Library</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Build and maintain a library of processors, data categories, risks, and controls.
              Reuse components across all your compliance activities for consistency and efficiency.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <ClipboardList className="h-12 w-12 text-primary mb-4" />
            <CardTitle>Guided Questionnaires</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Business-friendly questionnaires with conditional logic and smart suggestions. Collect
              data from stakeholders without requiring privacy expertise.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <FileText className="h-12 w-12 text-primary mb-4" />
            <CardTitle>Instant Document Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Generate professional DPIAs, ROPAs, and compliance documents in seconds. Export to
              Word, PDF, or Markdown with full formatting.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

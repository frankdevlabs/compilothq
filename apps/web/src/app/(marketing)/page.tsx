import { Button, Card, CardContent, CardHeader, CardTitle } from '@compilothq/ui'
import { Building2, ClipboardList, FileText } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div>
      <section className="container mx-auto px-6 py-24 text-center bg-accent-gold/5">
        <h1 className="text-3xl font-bold leading-tight mb-6">
          Component-based compliance that generates documents
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Build GDPR documentation in hours, not weeks. Compilo&apos;s reusable component library
          makes compliance scalable.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" variant="gold" asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/features">Learn More</Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="transition-all duration-200 hover:shadow-md hover:border-accent-gold">
            <CardHeader>
              <Building2 className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Reusable Components</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Build a library of processors, data categories, and risks that you can reuse across
                all your compliance activities.
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md hover:border-accent-gold border-l-4 border-l-accent-gold">
            <CardHeader>
              <ClipboardList className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Guided Questionnaires</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Business-friendly questionnaires guide stakeholders through data collection without
                requiring privacy expertise.
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md hover:border-accent-gold">
            <CardHeader>
              <FileText className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Instant Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Generate professional DPIAs, ROPAs, and other compliance documents in seconds from
                your component library.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

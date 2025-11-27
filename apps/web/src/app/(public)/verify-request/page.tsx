import { Button, Card, CardContent, CardHeader, CardTitle } from '@compilothq/ui'
import Link from 'next/link'

export default function VerifyRequestPage() {
  return (
    <div className="container max-w-md mx-auto py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Check your email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            A sign in link has been sent to your email address.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Click the link in the email to sign in. The link will expire in 15 minutes.
          </p>
          <div className="pt-4">
            <Button asChild variant="ghost" className="w-full text-sm">
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

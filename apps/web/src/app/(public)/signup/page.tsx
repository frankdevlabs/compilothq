import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@compilothq/ui'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Create an account</CardTitle>
        <p className="text-center text-muted-foreground">Start using Compilo today</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" type="text" placeholder="John Doe" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" disabled />
          </div>
          <Button className="w-full" disabled>
            Create Account
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Authentication will be implemented in a future update
        </p>
      </CardContent>
    </Card>
  )
}

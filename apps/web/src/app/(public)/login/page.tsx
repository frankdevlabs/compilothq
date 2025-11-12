import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@compilothq/ui'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
        <p className="text-center text-muted-foreground">Sign in to your Compilo account</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" disabled />
          </div>
          <Button className="w-full" disabled>
            Sign In
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Authentication will be implemented in a future update
        </p>
      </CardContent>
    </Card>
  )
}

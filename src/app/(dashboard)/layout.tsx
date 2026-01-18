import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Central
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/my-todos">
              <Button variant="ghost">My Todos</Button>
            </Link>
            <Link href="/shared">
              <Button variant="ghost">Shared</Button>
            </Link>
            <span className="text-sm text-muted-foreground">
              {session.user?.email}
            </span>
          </div>
        </div>
      </nav>
      <main className="container mx-auto">{children}</main>
    </div>
  )
}

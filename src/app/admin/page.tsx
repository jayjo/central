import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MoveUserToOrg } from '@/components/admin/MoveUserToOrg'

export default async function AdminPage() {
  const session = await getSession()

  // Get some basic stats
  const [userCount, orgCount, todoCount, invitationCount] = await Promise.all([
    prisma.user.count(),
    prisma.org.count(),
    prisma.todo.count(),
    prisma.orgInvitation.count({
      where: {
        accepted: false,
        expires: {
          gt: new Date(),
        },
      },
    }),
  ])

  // Get recent users (with org id for move form)
  const recentUsers = await prisma.user.findMany({
    take: 20,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })

  // Get all orgs for move-user dropdown
  const orgs = await prisma.org.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome, {session?.user?.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Total registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>Total organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{orgCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Todos</CardTitle>
            <CardDescription>Total todos created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todoCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>Active invitations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{invitationCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Last 20 registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{user.name || 'No name'}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  {user.org && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Org: {user.org.name} ({user.org.slug})
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Move user to org */}
      <MoveUserToOrg users={recentUsers} orgs={orgs} />
    </div>
  )
}

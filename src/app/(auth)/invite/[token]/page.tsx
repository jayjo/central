import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AcceptInvitationForm } from '@/components/invitations/AcceptInvitationForm'

export default async function InvitePage({
  params,
}: {
  params: { token: string }
}) {
  const invitation = await prisma.orgInvitation.findUnique({
    where: { token: params.token },
    include: {
      org: true,
      inviter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/">
              <Button className="w-full">Go to Home</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (invitation.accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Already Accepted</CardTitle>
            <CardDescription>
              This invitation has already been accepted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/">
              <Button className="w-full">Go to Home</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (new Date() > invitation.expires) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Expired</CardTitle>
            <CardDescription>
              This invitation has expired. Please request a new invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/">
              <Button className="w-full">Go to Home</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  const session = await getSession()
  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
      })
    : null

  // If user is logged in and it's their email, auto-accept
  if (currentUser && currentUser.email.toLowerCase() === invitation.email.toLowerCase()) {
    // Check if user is already in the org
    if (currentUser.orgId === invitation.orgId) {
      redirect('/')
    }

    // Auto-accept the invitation
    await prisma.orgInvitation.update({
      where: { id: invitation.id },
      data: { accepted: true },
    })

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { orgId: invitation.orgId },
    })

    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-center">Nuclio</h1>
          <p className="mt-2 text-center text-muted-foreground">
            You've been invited to join {invitation.org.name}
          </p>
        </div>
        <AcceptInvitationForm invitation={invitation} />
      </div>
    </div>
  )
}

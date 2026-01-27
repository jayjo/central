import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { RedirectToOrg } from '@/components/auth/RedirectToOrg'

export default async function DashboardPage() {
  try {
    const session = await getSession()
    
    if (!session?.user?.email) {
      redirect('/login')
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { org: true },
    })
    
    if (!user) {
      redirect('/login')
    }

    // Ensure user has an org
    if (!user.org) {
      // Create a new org for this user
      const newOrg = await prisma.org.create({
        data: {
          name: `${user.name || user.email}'s Organization`,
          slug: user.id, // Use user ID as slug for uniqueness
        },
      })
      await prisma.user.update({
        where: { id: user.id },
        data: { orgId: newOrg.id },
      })
      return <RedirectToOrg orgSlug={newOrg.slug!} />
    }

    // Ensure org has a slug
    if (!user.org.slug) {
      // Generate slug from org ID
      const updatedOrg = await prisma.org.update({
        where: { id: user.org.id },
        data: { slug: user.org.id }, // Use org ID as slug
      })
      return <RedirectToOrg orgSlug={updatedOrg.slug!} />
    }

    // Use client-side redirect to ensure session cookie is available
    return <RedirectToOrg orgSlug={user.org.slug!} />
  } catch (error) {
    redirect('/login')
  }
}

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { QuickLauncherProvider } from '@/components/quick-launcher/QuickLauncherProvider'
import { OrgSlugProvider } from '@/components/layout/OrgSlugProvider'
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout is only used for routes that haven't been migrated to org-slug routes yet
  // Most routes should redirect to org-slug routes, so we just pass through children
  // The org-slug layout will handle the sidebar
  
  // Get user's org slug for the provider (needed for components that use org slug hooks)
  const session = await getSession()
  
  let orgSlug = null
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { org: true },
    })
    orgSlug = user?.org?.slug || null
  }

  let userCreatedAt = null
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { createdAt: true },
    })
    userCreatedAt = user?.createdAt || null
  }

  return (
    <QuickLauncherProvider>
      <OrgSlugProvider orgSlug={orgSlug}>
        <OnboardingProvider userCreatedAt={userCreatedAt}>
          {children}
        </OnboardingProvider>
      </OrgSlugProvider>
    </QuickLauncherProvider>
  )
}

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

const ADMIN_EMAIL = 'jeff@jayjodesign.com'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session?.user?.email) {
    redirect('/login?redirect=/admin')
  }

  // Check if user is admin
  if (session.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}

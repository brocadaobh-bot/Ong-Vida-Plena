import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/session'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (!['admin', 'instructor'].includes(user.role)) redirect('/login')

  return (
    <DashboardLayout
      role={user.role as 'instructor' | 'admin'}
      userName={user.full_name}
      userEmail={user.email}
      title="Área do Instrutor"
    >
      {children}
    </DashboardLayout>
  )
}

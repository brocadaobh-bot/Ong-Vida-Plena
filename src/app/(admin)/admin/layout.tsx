import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/session'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/login')

  return (
    <DashboardLayout
      role={user.role}
      userName={user.full_name}
      userEmail={user.email}
      title="Administração"
    >
      {children}
    </DashboardLayout>
  )
}

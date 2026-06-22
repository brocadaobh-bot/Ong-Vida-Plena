import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/session'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default async function AssistantLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (!['admin', 'assistant'].includes(user.role)) redirect('/login')

  return (
    <DashboardLayout
      role={user.role as 'assistant' | 'admin'}
      userName={user.full_name}
      userEmail={user.email}
      title="Assistente Administrativo"
    >
      {children}
    </DashboardLayout>
  )
}

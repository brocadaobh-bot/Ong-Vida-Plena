import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getBeneficiaryLgpdUnreadCount } from '@/server/queries/lgpd-requests'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ConsentBanner } from '@/components/lgpd/ConsentBanner'
import type { PrivacyPolicy } from '@/types/domain'

export default async function BeneficiaryLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'beneficiary') redirect('/login')

  const supabase = await createClient()
  let pendingPolicy = null

  if (!user.has_accepted_current_policy) {
    const { data } = await supabase.rpc('get_active_privacy_policy').single()
    pendingPolicy = data
  }

  const lgpdUnreadCount = await getBeneficiaryLgpdUnreadCount(user.id)

  return (
    <>
      {pendingPolicy && (
        <ConsentBanner
          policy={{ ...pendingPolicy, is_active: true } satisfies PrivacyPolicy}
        />
      )}
      <DashboardLayout
        role={user.role}
        userName={user.full_name}
        userEmail={user.email}
        title="Área do Usuário"
        navBadges={
          lgpdUnreadCount > 0
            ? { '/beneficiario/lgpd': lgpdUnreadCount }
            : undefined
        }
      >
        {children}
      </DashboardLayout>
    </>
  )
}

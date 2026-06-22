import Link from 'next/link'
import { getAuthUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { RevokeConsentButton } from './RevokeConsentButton'
import { CheckCircle, XCircle, FileText } from 'lucide-react'
import { CONSENT_TYPE_LABELS } from '@/types/domain'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function ConsentimentosPage() {
  const user     = await getAuthUser()
  const supabase = await createClient()

  const { data: consents } = await supabase
    .from('consents')
    .select('*, privacy_policies(version, title)')
    .eq('profile_id', user!.id)
    .order('granted_at', { ascending: false })

  const mandatory = ['privacy_policy', 'data_processing']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meus Consentimentos</h1>
        <p className="text-muted-foreground">
          Gerencie os consentimentos que você forneceu. Consentimentos obrigatórios
          não podem ser revogados diretamente — para isso, abra uma solicitação de exclusão.
        </p>
      </div>

      <Card>
        {!consents || consents.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhum consentimento registrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {consents.map((consent: any) => {
              const isRevoked   = !!consent.revoked_at
              const isMandatory = mandatory.includes(consent.consent_type)
              const isActive    = consent.granted && !isRevoked

              return (
                <div
                  key={consent.id}
                  className={`flex items-start justify-between gap-3 rounded-lg border p-4 ${
                    isRevoked
                      ? 'border-border bg-muted/50 opacity-60'
                      : 'border-border bg-surface'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isActive ? (
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500 dark:text-green-400" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">
                        {CONSENT_TYPE_LABELS[consent.consent_type as keyof typeof CONSENT_TYPE_LABELS]}
                        {isMandatory && (
                          <span className="ml-2 text-xs font-normal text-red-500 dark:text-red-400">Obrigatório</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Política: {(consent.privacy_policies as any)?.title} (v{(consent.privacy_policies as any)?.version})
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground/80">
                        {isActive
                          ? `Concedido em ${format(new Date(consent.granted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                          : `Revogado em ${format(new Date(consent.revoked_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                        }
                      </p>
                    </div>
                  </div>

                  {isActive && !isMandatory && (
                    <RevokeConsentButton consentId={consent.id} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Sobre Consentimentos Obrigatórios</h2>
        <p className="text-sm text-muted-foreground">
          Os consentimentos de Política de Privacidade e Tratamento de Dados são necessários
          para uso da plataforma. Para solicitar a exclusão de todos os seus dados,
          acesse{' '}
          <Link href="/beneficiario/lgpd" className="text-primary-600 underline dark:text-primary-400">
            Meus Dados
          </Link>.
        </p>
      </Card>
    </div>
  )
}

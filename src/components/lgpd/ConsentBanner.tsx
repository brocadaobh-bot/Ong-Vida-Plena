'use client'

import { useState, useTransition } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { acceptPrivacyPolicyAction } from '@/server/actions/lgpd'
import type { PrivacyPolicy } from '@/types/domain'

interface ConsentBannerProps {
  policy: PrivacyPolicy
}

export function ConsentBanner({ policy }: ConsentBannerProps) {
  const [error, setError]       = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptPrivacyPolicyAction(policy.id)
      if (!result.success) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
      <div className="flex max-h-[min(90dvh,100%)] w-full max-w-lg flex-col rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-4 sm:px-6">
          <ShieldCheck className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-bold text-foreground">
            Política de Privacidade Atualizada
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          <p className="mb-3 text-sm text-muted-foreground">
            Para continuar utilizando a plataforma, você precisa aceitar nossa Política de Privacidade
            versão <strong className="text-foreground">{policy.version}</strong>.
          </p>
          <div className="rounded-lg bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
            <p><strong className="text-foreground">{policy.title}</strong></p>
            <p className="mt-2">
              Coletamos e utilizamos seus dados pessoais para gestão de inscrições, cursos e atividades da ONG
              Vida Plena, conforme descrito na Política de Privacidade completa.
            </p>
            <p className="mt-2">
              Você tem direito de acesso, correção, exclusão e portabilidade dos seus dados a qualquer momento.
            </p>
          </div>
        </div>

        {error && (
          <div className="px-6 pb-2">
            <Alert variant="error" message={error} />
          </div>
        )}

        <div className="flex shrink-0 flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:px-6">
          <p className="flex-1 text-xs text-muted-foreground">
            Ao aceitar, você confirma que leu e concorda com o tratamento dos seus dados conforme
            descrito na{' '}
            <a href="/politica-de-privacidade" target="_blank" className="text-primary-600 underline dark:text-primary-400">
              Política de Privacidade
            </a>.
          </p>
          <Button onClick={handleAccept} loading={isPending} className="w-full shrink-0 sm:w-auto">
            Aceitar e Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}

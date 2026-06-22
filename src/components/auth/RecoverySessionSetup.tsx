'use client'

import { useEffect, useState } from 'react'
import type { EmailOtpType } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { createClient } from '@/lib/supabase/client'

interface RecoverySessionSetupProps {
  children: React.ReactNode
}

/**
 * Estabelece sessão de recuperação a partir do link do e-mail
 * (hash #access_token, ?code= ou ?token_hash=) antes de exibir o formulário.
 */
export function RecoverySessionSetup({ children }: RecoverySessionSetupProps) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function initSession() {
      const supabase = createClient()

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        if (!cancelled) setReady(true)
        return
      }

      const hash = window.location.hash.slice(1)
      if (hash) {
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            if (!cancelled) {
              setError('Link de recuperação expirado ou inválido. Solicite um novo e-mail.')
            }
            return
          }

          window.history.replaceState(null, '', window.location.pathname)
          if (!cancelled) setReady(true)
          return
        }
      }

      const query = new URLSearchParams(window.location.search)
      const code = query.get('code')
      if (code) {
        window.location.replace(
          `/auth/confirm?code=${encodeURIComponent(code)}&next=${encodeURIComponent('/redefinir-senha')}`,
        )
        return
      }

      const tokenHash = query.get('token_hash')
      const type = query.get('type')
      if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        })

        if (verifyError) {
          if (!cancelled) {
            setError('Link de recuperação expirado ou inválido. Solicite um novo e-mail.')
          }
          return
        }

        window.history.replaceState(null, '', window.location.pathname)
        if (!cancelled) setReady(true)
        return
      }

      if (!cancelled) {
        setError(
          'Abra o link mais recente enviado ao seu e-mail ou solicite uma nova recuperação de senha.',
        )
      }
    }

    void initSession()

    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm space-y-4">
          <Alert variant="error" message={error} />
          <p className="text-center text-sm text-muted-foreground">
            Abra o link no <strong>mesmo navegador</strong> em que solicitou a recuperação, ou{' '}
            <a href="/recuperar-senha" className="text-primary-600 underline dark:text-primary-400">
              solicite um novo e-mail
            </a>
            .
          </p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden />
        <p className="text-sm">Validando link de recuperação…</p>
      </div>
    )
  }

  return <>{children}</>
}

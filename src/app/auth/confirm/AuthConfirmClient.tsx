'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import {
  cleanAuthErrorFromUrl,
  messageForAuthRedirectError,
  readAuthRedirectError,
} from '@/lib/auth/auth-redirect-error'
import { createClient } from '@/lib/supabase/client'

/** Evita trocar o mesmo ?code= duas vezes (React Strict Mode invalida o link). */
const exchangedCodes = new Set<string>()

function goTo(path: string) {
  window.location.replace(path)
}

/**
 * Confirma link de recuperação de senha (code, token_hash ou hash).
 */
export function AuthConfirmClient() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Confirmando link…')

  useEffect(() => {
    let cancelled = false

    async function confirm() {
      const redirectError = readAuthRedirectError()
      if (redirectError.error || redirectError.errorCode) {
        if (!cancelled) {
          setError(
            messageForAuthRedirectError(
              redirectError.errorCode,
              redirectError.description,
            ),
          )
          cleanAuthErrorFromUrl()
        }
        return
      }

      const supabase = createClient()
      const next = searchParams.get('next') ?? '/redefinir-senha'
      const safeNext = next.startsWith('/') ? next : '/redefinir-senha'

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        goTo(safeNext)
        return
      }

      const hash = window.location.hash.slice(1)
      if (hash) {
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        if (accessToken && refreshToken) {
          if (!cancelled) setStatus('Autenticando…')
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (sessionError) {
            if (!cancelled) setError('Link expirado ou inválido. Solicite um novo e-mail.')
            return
          }
          goTo(safeNext)
          return
        }
      }

      const code = searchParams.get('code')
      if (code) {
        if (exchangedCodes.has(code)) {
          const {
            data: { session: retrySession },
          } = await supabase.auth.getSession()
          if (retrySession) {
            goTo(safeNext)
            return
          }
        } else {
          exchangedCodes.add(code)
          if (!cancelled) setStatus('Validando link…')
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            exchangedCodes.delete(code)
            console.error('exchangeCodeForSession:', exchangeError)
            if (!cancelled) {
              const msg = exchangeError.message.toLowerCase()
              setError(
                msg.includes('expired') || msg.includes('invalid') || msg.includes('already')
                  ? 'Este link expirou ou já foi usado. Solicite um novo e-mail e clique nele em seguida.'
                  : 'Não foi possível validar o link. Solicite um novo e-mail e abra no mesmo navegador em que pediu a recuperação.',
              )
            }
            return
          }
          goTo(safeNext)
          return
        }
      }

      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      if (tokenHash && type) {
        if (!cancelled) setStatus('Validando link…')
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        })
        if (verifyError) {
          console.error('verifyOtp:', verifyError)
          if (!cancelled) setError('Link expirado ou inválido. Solicite um novo e-mail.')
          return
        }
        goTo(safeNext)
        return
      }

      if (!cancelled) {
        setError('Link inválido. Solicite uma nova recuperação de senha.')
      }
    }

    void confirm()

    return () => {
      cancelled = true
    }
  }, [searchParams])

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="error" message={error} />
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>Use somente o <strong>e-mail mais recente</strong>.</li>
            <li>Cada link vale <strong>uma única vez</strong>.</li>
            <li>Abra no <strong>mesmo navegador</strong> em que solicitou a recuperação.</li>
          </ul>
          <Link href="/recuperar-senha">
            <Button className="w-full">Solicitar novo link</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden />
      <p className="text-sm">{status}</p>
    </div>
  )
}

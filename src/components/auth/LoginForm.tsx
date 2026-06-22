'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { loginAction } from '@/server/actions/auth'
import { ResendConfirmation } from '@/components/auth/ResendConfirmation'
import { REMEMBER_LOGIN_LOCAL_KEY } from '@/lib/auth/remember-login'

type LoginFormProps = {
  urlError?: string | null
  urlMessage?: string | null
}

function readRememberLoginPreference(): boolean {
  try {
    return localStorage.getItem(REMEMBER_LOGIN_LOCAL_KEY) !== '0'
  } catch {
    return true
  }
}

export function LoginForm({ urlError = null, urlMessage = null }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [rememberLogin, setRememberLogin] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setRememberLogin(readRememberLoginPreference())
  }, [])

  const showResend = Boolean(
    error?.includes('Confirme seu e-mail') ||
    urlError?.includes('expirado') ||
    urlError?.includes('inválido') ||
    urlError?.includes('confirmação')
  )

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    try {
      localStorage.setItem(REMEMBER_LOGIN_LOCAL_KEY, rememberLogin ? '1' : '0')
    } catch {
      // ignore
    }
    if (rememberLogin) {
      formData.set('rememberMe', 'on')
    } else {
      formData.delete('rememberMe')
    }
    startTransition(async () => {
      const result = await loginAction(formData)
      if (!result.success) setError(result.error)
    })
  }

  return (
    <div className="flex min-h-dvh">
      <div
        aria-hidden="true"
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-600 dark:bg-primary-700"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(255,255,255,0.1)_0%,_transparent_60%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-sm font-bold">VP</span>
            </div>
            <span className="text-xl font-bold">Vida Plena</span>
          </Link>

          <div>
            <blockquote className="text-2xl font-semibold leading-relaxed mb-6">
              "Transformando vidas através da educação e capacitação comunitária."
            </blockquote>
            <p className="text-primary-100 text-sm">
              Plataforma de gestão da ONG Vida Plena
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-primary-100">
            <span>Conforme LGPD</span>
            <span aria-hidden="true">·</span>
            <span>Dados protegidos</span>
            <span aria-hidden="true">·</span>
            <span>Acesso seguro</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="flex items-center gap-2.5 mb-8 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            aria-label="Voltar à página inicial"
          >
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">VP</span>
            </div>
            <span className="font-bold text-foreground">Vida Plena</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Bem-vindo de volta
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Entre na sua conta para continuar
            </p>
          </div>

          {urlMessage && (
            <Alert variant="success" className="mb-5">{urlMessage}</Alert>
          )}
          {(error || urlError) && (
            <Alert
              variant="danger"
              dismissible
              onDismiss={() => setError(null)}
              className="mb-5"
            >
              {error ?? urlError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              name="email"
              type="email"
              label="E-mail"
              placeholder="seu@email.com"
              required
              autoComplete="email"
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Input
              name="password"
              type="password"
              label="Senha"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={rememberLogin}
                  onChange={e => setRememberLogin(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-sm leading-snug text-muted-foreground">
                  <span className="font-medium text-foreground">Manter conectado</span>
                  <span className="mt-0.5 block text-xs">
                    Permanece logado neste dispositivo por até 30 dias.
                  </span>
                </span>
              </label>
              <Link
                href="/recuperar-senha"
                className="shrink-0 text-sm text-primary-600 hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded dark:text-primary-400"
              >
                Esqueci minha senha
              </Link>
            </div>

            <Button
              type="submit"
              isLoading={isPending}
              loadingText="Entrando..."
              size="lg"
              className="w-full"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Entrar
            </Button>
          </form>

          {showResend && <ResendConfirmation />}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Não tem conta?{' '}
            <Link
              href="/cadastro"
              className="font-medium text-primary-600 dark:text-primary-400 hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Cadastre-se gratuitamente
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Ao entrar, você concorda com nossa{' '}
            <Link href="/politica-de-privacidade" className="underline underline-offset-2 hover:text-foreground">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

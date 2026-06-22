'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { getPasswordRecoveryRedirectUrl } from '@/lib/auth/app-url'
import { formatAuthError } from '@/lib/auth/format-auth-error'
import { createClient } from '@/lib/supabase/client'
import type { AuthError } from '@supabase/supabase-js'

export default function RecuperarSenhaPage() {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const email = String(formData.get('email') ?? '').trim()

    if (!email) {
      setError('Informe seu e-mail.')
      return
    }

    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getPasswordRecoveryRedirectUrl(),
        })

        if (resetError) {
          setError(formatAuthError(resetError))
          return
        }

        // Por segurança, não revelamos se o e-mail existe quando o envio foi aceito
        setSentEmail(email)
        setSent(true)
      } catch (err) {
        const authErr = err as AuthError
        setError(
          authErr?.message
            ? formatAuthError(authErr)
            : 'Erro ao enviar e-mail. Tente novamente.',
        )
      }
    })
  }

  if (sent) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm text-center animate-fade-in">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950/40">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">E-mail enviado!</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Se o e-mail <strong>{sentEmail}</strong> estiver cadastrado na plataforma da ONG Vida Plena,
            você receberá uma mensagem automática de recuperação de senha. Verifique a caixa de entrada
            e a pasta de <strong>spam</strong>.
          </p>

          <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4 text-left">
            <p className="text-sm font-semibold text-foreground">O que fazer quando o e-mail chegar</p>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal pl-5 leading-relaxed">
              <li>
                Procure um e-mail com assunto parecido com{' '}
                <strong className="text-foreground">“Reset your password”</strong> (redefinir senha).
              </li>
              <li>
                Abra o e-mail e clique no link <strong className="text-foreground">“Reset password”</strong>{' '}
                ou equivalente.
              </li>
              <li>
                Você será levado(a) à página da plataforma para criar uma <strong className="text-foreground">nova senha</strong>.
              </li>
              <li>
                Depois, volte ao login e entre com a senha nova.
              </li>
            </ol>
          </div>

          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
            Abra o link no <strong>mesmo navegador</strong> em que solicitou a recuperação.
            Use só o e-mail <strong>mais recente</strong> e clique <strong>uma vez</strong> (expira em cerca de 1 hora).
            Se você não pediu a redefinição, ignore o e-mail — sua senha continua a mesma.
          </p>
          <Link href="/login" className="mt-8 inline-block">
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Voltar ao Login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Login
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Recuperar senha</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Informe o e-mail da conta. Funciona para usuários, instrutores, assistentes e administradores.
          </p>
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            Enviaremos um link seguro por e-mail. A mensagem pode vir em inglês (padrão do sistema),
            mas o link leva direto para a página de redefinição da plataforma Vida Plena.
          </p>
        </div>

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="mb-5">
            {error}
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

          <Button
            type="submit"
            isLoading={isPending}
            loadingText="Enviando..."
            size="lg"
            className="w-full"
          >
            Enviar link de recuperação
          </Button>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { RecoverySessionSetup } from '@/components/auth/RecoverySessionSetup'
import { resetPasswordAction } from '@/server/actions/auth'

export default function RedefinirSenhaPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [isPending, startTransition]    = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await resetPasswordAction(formData)
      if (!result.success) {
        setError(result.error)
      }
    })
  }

  return (
    <RecoverySessionSetup>
      <div className="flex min-h-dvh items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Nova senha</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Escolha uma senha segura para sua conta.
            </p>
          </div>

          {error && (
            <Alert variant="error" message={error} className="mb-4" onDismiss={() => setError(null)} />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Nova senha"
              placeholder="Mínimo 8 caracteres"
              required
              autoComplete="new-password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(v => !v)} aria-label="Mostrar senha">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <Input
              name="confirm_password"
              type={showConfirm ? 'text' : 'password'}
              label="Confirmar nova senha"
              placeholder="Repita a senha"
              required
              autoComplete="new-password"
              leftIcon={<CheckCircle className="h-4 w-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowConfirm(v => !v)} aria-label="Mostrar confirmação">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <Button type="submit" loading={isPending} size="lg" className="w-full">
              Salvar nova senha
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            O link expira em algumas horas. Se não funcionar, solicite outro em{' '}
            <Link href="/recuperar-senha" className="text-primary-600 underline dark:text-primary-400">
              recuperar senha
            </Link>.
          </p>
        </div>
      </div>
    </RecoverySessionSetup>
  )
}

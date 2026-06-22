'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Heart, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { registerAction } from '@/server/actions/auth'

export default function CadastroPage() {
  const [showPassword, setShowPassword]    = useState(false)
  const [showConfirm,  setShowConfirm]     = useState(false)
  const [error,  setError]    = useState<string | null>(null)
  const [successMode, setSuccessMode] = useState<'email' | 'login' | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    formData.set('consent_privacy_policy',  formData.get('consent_privacy_policy')  ? 'true' : 'false')
    formData.set('consent_data_processing', formData.get('consent_data_processing') ? 'true' : 'false')
    formData.set('consent_communications',  formData.get('consent_communications')  ? 'true' : 'false')
    formData.set('consent_image_use',       formData.get('consent_image_use')       ? 'true' : 'false')

    startTransition(async () => {
      const result = await registerAction(formData)
      if (result.success) {
        if (result.data.requiresEmailConfirmation) {
          setSuccessMode('email')
        } else if (result.data.autoLoginFailed) {
          setSuccessMode('login')
        }
      } else {
        setError(result.error)
      }
    })
  }

  if (successMode) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Cadastro realizado!</h1>
          {successMode === 'email' ? (
            <>
              <p className="mt-3 text-muted-foreground">
                Enviamos um e-mail de confirmação para você. Verifique sua caixa de entrada
                e clique no link para ativar sua conta.
              </p>
              <p className="mt-2 text-sm text-muted-foreground/80">
                Não encontrou o e-mail? Verifique a pasta de spam.
              </p>
            </>
          ) : (
            <p className="mt-3 text-muted-foreground">
              Sua conta foi criada. Faça login para acessar a plataforma.
            </p>
          )}
          <Link href="/login" className="mt-6 inline-block">
            <Button variant="secondary">Ir para o Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600">
            <Heart className="h-8 w-8 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Crie sua conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesso gratuito a cursos e capacitações da ONG Vida Plena
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-8 shadow-soft-sm">
          {error && (
            <Alert
              variant="error"
              message={error}
              className="mb-4"
              onDismiss={() => setError(null)}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="full_name"
              label="Nome Completo"
              placeholder="Seu nome completo"
              required
              autoComplete="name"
            />

            <Input
              name="email"
              type="email"
              label="E-mail"
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="phone"
                type="tel"
                label="Telefone"
                placeholder="(00) 00000-0000"
                autoComplete="tel"
              />
              <Input
                name="birth_date"
                type="date"
                label="Data de Nascimento"
              />
            </div>

            <Input
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Senha"
              placeholder="Mínimo 8 caracteres"
              required
              autoComplete="new-password"
              rightIcon={
                <button type="button" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <Input
              name="confirm_password"
              type={showConfirm ? 'text' : 'password'}
              label="Confirmar Senha"
              placeholder="Digite a senha novamente"
              required
              autoComplete="new-password"
              rightIcon={
                <button type="button" onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {/* Consentimentos LGPD */}
            <div className="consent-box">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Consentimentos (LGPD)
              </p>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="consent_privacy_policy"
                  value="true"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary-600"
                />
                <span className="text-sm text-foreground">
                  <span className="font-medium text-red-500">* </span>
                  Li e aceito a{' '}
                  <Link href="/politica-de-privacidade" target="_blank" className="text-primary-600 underline dark:text-primary-400">
                    Política de Privacidade
                  </Link>
                  {' '}e autorizo o tratamento dos meus dados pessoais para gestão de cursos.
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="consent_data_processing"
                  value="true"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary-600"
                />
                <span className="text-sm text-foreground">
                  <span className="font-medium text-red-500">* </span>
                  Autorizo o uso dos meus dados para elaboração de relatórios de impacto social (anonimizados).
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="consent_communications"
                  value="true"
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary-600"
                />
                <span className="text-sm text-foreground">
                  (Opcional) Aceito receber comunicações sobre novos cursos e eventos.
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="consent_image_use"
                  value="true"
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary-600"
                />
                <span className="text-sm text-foreground">
                  (Opcional) Autorizo o uso de minha imagem em materiais institucionais da ONG.
                </span>
              </label>
            </div>

            <Button type="submit" loading={isPending} className="w-full">
              Criar Minha Conta
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

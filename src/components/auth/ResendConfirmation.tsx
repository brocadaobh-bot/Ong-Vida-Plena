'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { resendConfirmationAction } from '@/server/actions/auth'

interface ResendConfirmationProps {
  defaultEmail?: string
}

export function ResendConfirmation({ defaultEmail = '' }: ResendConfirmationProps) {
  const [email, setEmail]       = useState(defaultEmail)
  const [message, setMessage]   = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleResend(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)

    const formData = new FormData()
    formData.set('email', email)

    startTransition(async () => {
      const result = await resendConfirmationAction(formData)
      if (result.success) {
        setMessage('Novo e-mail de confirmação enviado. Verifique sua caixa de entrada (e spam).')
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium text-foreground">Não confirmou o e-mail?</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Links antigos param de funcionar se você apagou a conta. Cadastre-se de novo ou reenvie abaixo.
      </p>

      <form onSubmit={handleResend} className="mt-3 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" variant="secondary" loading={isPending} className="shrink-0">
          Reenviar
        </Button>
      </form>

      {message && <p className="mt-2 text-xs text-green-600">{message}</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}

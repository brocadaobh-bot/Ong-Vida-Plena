'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { createBeneficiaryAction } from '@/server/actions/beneficiaries'

export default function NovoBeneficiarioPage() {
  const router = useRouter()
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createBeneficiaryAction(formData)
      if (result.success) {
        setSuccess(`Usuário criado com sucesso! ID: ${result.data.id}`)
        setTimeout(() => router.push('/assistente/beneficiarios'), 2000)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/assistente/beneficiarios">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-2">
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Novo Usuário</h1>
        <p className="text-muted-foreground">Cadastrar usuário de forma assistida.</p>
      </div>

      <Card className="max-w-2xl">
        {error   && <Alert variant="error"   message={error}   className="mb-4" />}
        {success && <Alert variant="success" message={success} className="mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="full_name"
            label="Nome Completo"
            required
            placeholder="Nome completo do usuário"
          />
          <Input
            name="email"
            type="email"
            label="E-mail"
            required
            placeholder="email@exemplo.com"
          />
          <Input
            name="phone"
            type="tel"
            label="Telefone"
            placeholder="(00) 00000-0000"
          />
          <Input
            name="birth_date"
            type="date"
            label="Data de Nascimento"
          />

          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-800">
            <strong>Atenção:</strong> O usuário receberá um e-mail para definir sua senha.
            O consentimento será registrado como concedido pelo assistente em nome do titular.
            Certifique-se de que o titular foi informado e está de acordo com o tratamento dos dados.
          </div>

          <div className="flex gap-3">
            <Link href="/assistente/beneficiarios">
              <Button type="button" variant="secondary">Cancelar</Button>
            </Link>
            <Button type="submit" loading={isPending}>
              Cadastrar Usuário
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

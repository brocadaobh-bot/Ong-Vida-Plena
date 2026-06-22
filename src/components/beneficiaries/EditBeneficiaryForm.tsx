'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { StaffCertificateNameNotice } from '@/components/beneficiaries/StaffCertificateNameNotice'
import { editBeneficiaryAction } from '@/server/actions/beneficiaries'
import type { CourseCertificate } from '@/types/domain'
import type { Profile } from '@/types/domain'

type EditBeneficiaryFormProps = {
  beneficiary: Profile
  certificates: CourseCertificate[]
  backHref: string
}

export function EditBeneficiaryForm({
  beneficiary,
  certificates,
  backHref,
}: EditBeneficiaryFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [nameCorrected, setNameCorrected] = useState(false)
  const [isPending, startTransition] = useTransition()

  const birthDateValue = beneficiary.birth_date
    ? beneficiary.birth_date.slice(0, 10)
    : ''

  const hasCertificates = certificates.length > 0

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setNameCorrected(false)

    const formData = new FormData(e.currentTarget)
    const newName = String(formData.get('full_name') ?? '').trim()
    const nameChanged = newName !== beneficiary.full_name.trim()

    if (hasCertificates && nameChanged) {
      const confirmed = window.confirm(
        `O nome será alterado de "${beneficiary.full_name}" para "${newName}".\n\n` +
          `Todos os ${certificates.length} certificado(s) serão atualizados e a ação será registrada em auditoria.\n\n` +
          'Deseja continuar?',
      )
      if (!confirmed) return
    }

    startTransition(async () => {
      const result = await editBeneficiaryAction(beneficiary.id, formData)
      if (result.success) {
        setSuccess(true)
        if (hasCertificates && nameChanged) setNameCorrected(true)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={backHref}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-2">
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Editar Usuário</h1>
        <p className="text-muted-foreground">{beneficiary.email}</p>
      </div>

      <StaffCertificateNameNotice
        certificates={certificates}
        currentName={beneficiary.full_name}
      />

      <Card className="max-w-2xl">
        {error && <Alert variant="error" message={error} className="mb-4" />}
        {success && !nameCorrected && (
          <Alert variant="success" message="Dados atualizados com sucesso!" className="mb-4" />
        )}
        {nameCorrected && (
          <Alert
            variant="success"
            message="Nome corrigido com sucesso. Perfil, certificados e auditoria foram atualizados."
            className="mb-4"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="full_name"
            label="Nome Completo"
            defaultValue={beneficiary.full_name}
            required
            hint={
              hasCertificates
                ? 'Altere apenas se necessário corrigir erro de cadastro. Atualiza todos os certificados.'
                : undefined
            }
          />
          <Input
            name="email_display"
            label="E-mail"
            defaultValue={beneficiary.email}
            disabled
            hint="O e-mail é gerenciado pelo cadastro de autenticação."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="phone"
              label="Telefone"
              type="tel"
              defaultValue={beneficiary.phone ?? ''}
            />
            <Input
              name="birth_date"
              label="Data de Nascimento"
              type="date"
              defaultValue={birthDateValue}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              name="document_type"
              label="Tipo de Documento"
              options={[
                { value: 'cpf',      label: 'CPF' },
                { value: 'rg',       label: 'RG' },
                { value: 'passport', label: 'Passaporte' },
                { value: 'other',    label: 'Outro' },
              ]}
              placeholder="Selecione"
              defaultValue={beneficiary.document_type ?? ''}
            />
            <Input
              name="document_number"
              label="Número do Documento"
              defaultValue={beneficiary.document_number ?? ''}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Link href={backHref}>
              <Button type="button" variant="secondary">Cancelar</Button>
            </Link>
            <Button type="submit" loading={isPending}>Salvar Alterações</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { updateOwnProfileAction } from '@/server/actions/beneficiaries'
import { ROLE_LABELS } from '@/types/domain'
import type { OwnProfileData } from '@/types/domain'
import type { UserRole } from '@/types/database'

interface ProfileFormProps {
  profile: OwnProfileData
  /** Nome e documentos bloqueados após emissão de certificado (beneficiário). */
  lockCertificateIdentity?: boolean
}

export function ProfileForm({ profile, lockCertificateIdentity = false }: ProfileFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateOwnProfileAction(formData)
      if (result.success) {
        setSuccess(true)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  const birthDateValue = profile.birth_date
    ? profile.birth_date.slice(0, 10)
    : ''

  const identityLockedHint =
    'Bloqueado após emissão de certificado. Solicite correção via LGPD ou administração.'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground">Mantenha seus dados atualizados.</p>
      </div>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-foreground">Dados Pessoais</h2>
        {error   && <Alert variant="error"   message={error}   className="mb-4" />}
        {success && <Alert variant="success" message="Dados atualizados com sucesso!" className="mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          {lockCertificateIdentity && (
            <>
              <input type="hidden" name="full_name" value={profile.full_name} />
              {profile.document_type != null && (
                <input type="hidden" name="document_type" value={profile.document_type} />
              )}
              {profile.document_number != null && (
                <input type="hidden" name="document_number" value={profile.document_number} />
              )}
            </>
          )}
          <Input
            name={lockCertificateIdentity ? undefined : 'full_name'}
            label="Nome Completo"
            defaultValue={profile.full_name}
            required={!lockCertificateIdentity}
            readOnly={lockCertificateIdentity}
            aria-readonly={lockCertificateIdentity || undefined}
            className={lockCertificateIdentity ? 'cursor-not-allowed bg-muted' : undefined}
            hint={lockCertificateIdentity ? identityLockedHint : undefined}
          />
          <Input
            name="email"
            label="E-mail"
            defaultValue={profile.email}
            disabled
            hint="O e-mail não pode ser alterado aqui."
          />
          <Input
            name="role_display"
            label="Papel"
            defaultValue={ROLE_LABELS[profile.role as UserRole] ?? profile.role}
            disabled
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="phone"
              label="Telefone"
              type="tel"
              defaultValue={profile.phone ?? ''}
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
              name={lockCertificateIdentity ? undefined : 'document_type'}
              label="Tipo de Documento"
              options={[
                { value: 'cpf',      label: 'CPF' },
                { value: 'rg',       label: 'RG' },
                { value: 'passport', label: 'Passaporte' },
                { value: 'other',    label: 'Outro' },
              ]}
              placeholder="Selecione"
              defaultValue={profile.document_type ?? ''}
              disabled={lockCertificateIdentity}
              hint={lockCertificateIdentity ? identityLockedHint : undefined}
            />
            <Input
              name={lockCertificateIdentity ? undefined : 'document_number'}
              label="Número do Documento"
              defaultValue={profile.document_number ?? ''}
              readOnly={lockCertificateIdentity}
              aria-readonly={lockCertificateIdentity || undefined}
              className={lockCertificateIdentity ? 'cursor-not-allowed bg-muted' : undefined}
              hint={lockCertificateIdentity ? identityLockedHint : undefined}
            />
          </div>
          <Button type="submit" loading={isPending}>Salvar</Button>
        </form>
      </Card>
    </div>
  )
}

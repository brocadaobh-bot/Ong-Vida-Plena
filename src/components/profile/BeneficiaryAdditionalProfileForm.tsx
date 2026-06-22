'use client'

import { useState, useTransition } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { updateOwnBeneficiaryProfileAction } from '@/server/actions/beneficiaries'
import {
  GENDER_LABELS,
  EDUCATION_LEVEL_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  FAMILY_INCOME_RANGE_OPTIONS,
} from '@/types/domain'

export function BeneficiaryAdditionalProfileForm() {
  const [additionalError, setAdditionalError] = useState<string | null>(null)
  const [additionalSuccess, setAdditionalSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const genderOptions = Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }))
  const educationOptions = Object.entries(EDUCATION_LEVEL_LABELS).map(([value, label]) => ({
    value,
    label,
  }))
  const employmentOptions = Object.entries(EMPLOYMENT_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }))

  function handleAdditionalSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAdditionalError(null)
    setAdditionalSuccess(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateOwnBeneficiaryProfileAction(formData)
      if (result.success) {
        setAdditionalSuccess(true)
      } else {
        setAdditionalError(result.error)
      }
    })
  }

  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-foreground">Dados Complementares</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Estas informações são usadas apenas para relatórios de impacto social e nunca são
        divulgadas individualmente.
      </p>
      {additionalError && (
        <Alert variant="error" message={additionalError} className="mb-4" />
      )}
      {additionalSuccess && (
        <Alert variant="success" message="Dados complementares atualizados!" className="mb-4" />
      )}
      <form onSubmit={handleAdditionalSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="social_name" label="Nome Social" />
          <Select name="gender" label="Gênero" options={genderOptions} placeholder="Selecione (opcional)" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            name="education_level"
            label="Escolaridade"
            options={educationOptions}
            placeholder="Selecione (opcional)"
          />
          <Select
            name="employment_status"
            label="Situação de Emprego"
            options={employmentOptions}
            placeholder="Selecione (opcional)"
          />
        </div>
        <Select
          name="family_income_range"
          label="Faixa de Renda Familiar (mensal)"
          options={FAMILY_INCOME_RANGE_OPTIONS}
          placeholder="Selecione (opcional)"
        />

        <div className="border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Endereço</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="postal_code" label="CEP" placeholder="00000-000" />
            <Input name="state" label="UF" maxLength={2} placeholder="SP" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Input name="street" label="Logradouro" placeholder="Rua, Avenida..." />
            </div>
            <Input name="number" label="Número" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input name="complement" label="Complemento" placeholder="Apto, Bloco..." />
            <Input name="district" label="Bairro" />
          </div>
          <Input name="city" label="Cidade" className="mt-4" />
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Contato de Emergência</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="emergency_contact_name" label="Nome" />
            <Input name="emergency_contact_phone" label="Telefone" type="tel" />
          </div>
        </div>

        <Button type="submit" loading={isPending}>
          Salvar Dados Complementares
        </Button>
      </form>
    </Card>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { createDataSubjectRequestAction } from '@/server/actions/lgpd'
import { dataSubjectRequestSchema, type DataSubjectRequestInput } from '@/lib/validation/schemas'
import { DATA_REQUEST_TYPE_LABELS } from '@/types/domain'

const requestTypeOptions = Object.entries(DATA_REQUEST_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export function DataRequestForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<DataSubjectRequestInput>({
    resolver: zodResolver(dataSubjectRequestSchema),
  })

  const requestType = useWatch({ control, name: 'request_type' })
  const isCorrection = requestType === 'correction'

  function onSubmit(data: DataSubjectRequestInput) {
    startTransition(async () => {
      setError(null)
      const fd = new FormData()
      fd.append('request_type', data.request_type)
      fd.append('description', data.description)
      if (data.correct_full_name) {
        fd.append('correct_full_name', data.correct_full_name)
      }

      const fileInput = document.getElementById('lgpd-initial-attachment') as HTMLInputElement | null
      if (fileInput?.files?.[0]) {
        fd.append('attachment', fileInput.files[0])
      } else if (isCorrection) {
        setError('Envie a foto ou PDF do RG para solicitações de correção de nome.')
        return
      }

      const result = await createDataSubjectRequestAction(fd)
      if (result.success) {
        reset()
        if (fileInput) fileInput.value = ''
        router.push(`/beneficiario/lgpd/${result.data!.id}`)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert variant="error" message={error} />}

      <Select
        label="Tipo de Solicitação"
        required
        options={requestTypeOptions}
        placeholder="Selecione o tipo"
        error={errors.request_type?.message}
        {...register('request_type')}
      />

      {isCorrection && (
        <Input
          label="Nome completo correto"
          required
          placeholder="Como deve constar no certificado e cadastro"
          error={errors.correct_full_name?.message}
          hint="Informe exatamente o nome que deve aparecer nos documentos."
          {...register('correct_full_name')}
        />
      )}

      <Textarea
        label="Descrição"
        required
        rows={5}
        placeholder={
          isCorrection
            ? 'Explique o erro (ex.: nome errado no certificado após conclusão do curso)...'
            : 'Descreva sua solicitação com o máximo de detalhes possível...'
        }
        error={errors.description?.message}
        hint="Mínimo de 10 caracteres."
        {...register('description')}
      />

      <div>
        <label htmlFor="lgpd-initial-attachment" className="mb-1.5 block text-sm font-medium text-foreground">
          {isCorrection ? 'Documento de identidade (RG)' : 'Anexo (opcional)'}
          {isCorrection && <span className="ml-1 text-red-500">*</span>}
        </label>
        <input
          id="lgpd-initial-attachment"
          type="file"
          required={isCorrection}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700 dark:file:bg-primary-950/40 dark:file:text-primary-300"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {isCorrection
            ? 'Foto ou PDF do RG para confirmarmos sua identidade. Máximo 5 MB.'
            : 'JPG, PNG, WEBP ou PDF. Máximo 5 MB.'}
        </p>
      </div>

      <Button type="submit" loading={isPending} className="w-full">
        Enviar Solicitação
      </Button>
    </form>
  )
}

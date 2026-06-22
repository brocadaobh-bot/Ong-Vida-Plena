'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Clock,
  MessageSquareText,
  MoreHorizontal,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Alert } from '@/components/ui/Alert'
import { processDataSubjectRequestAction } from '@/server/actions/lgpd'
import { isLgpdRequestActive } from '@/lib/lgpd/status'

type LgpdRequestActionsProps = {
  requestId: string
  currentStatus: string
  requestType?: string
  requestedName?: string | null
  compact?: boolean
}

type ActionMode = 'complete' | 'waiting' | 'other' | null

const DEFAULT_COMPLETE_MESSAGE =
  'Sua solicitação foi atendida. Os dados foram corrigidos conforme solicitado. ' +
  'Se precisar de algo mais, abra uma nova solicitação.'

export function LgpdRequestActions({
  requestId,
  currentStatus,
  requestType,
  requestedName,
  compact = false,
}: LgpdRequestActionsProps) {
  const router = useRouter()
  const [mode, setMode] = useState<ActionMode>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isActive = isLgpdRequestActive(currentStatus)

  const otherStatuses = [
    { value: 'in_review',    label: 'Colocar em análise' },
    { value: 'waiting_user', label: 'Aguardando titular' },
    { value: 'completed',    label: 'Concluir / Deferir' },
    { value: 'rejected',     label: 'Indeferir' },
    { value: 'cancelled',    label: 'Cancelar solicitação' },
  ].filter(s => s.value !== currentStatus)

  function closeModal() {
    setMode(null)
    setError(null)
  }

  function submitStatus(status: string, responseNotes: string) {
    setError(null)
    const fd = new FormData()
    fd.set('request_id', requestId)
    fd.set('status', status)
    if (responseNotes.trim()) {
      fd.set('response_notes', responseNotes.trim())
    }

    startTransition(async () => {
      const result = await processDataSubjectRequestAction(fd)
      if (result.success) {
        closeModal()
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const status = String(fd.get('status') ?? '')
    const notes = String(fd.get('response_notes') ?? '')
    submitStatus(status, notes)
  }

  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Solicitação encerrada
      </span>
    )
  }

  const completeDefaultMessage =
    requestType === 'correction' && requestedName
      ? `Sua solicitação foi atendida. O nome foi corrigido para "${requestedName}" no cadastro e nos certificados.`
      : DEFAULT_COMPLETE_MESSAGE

  return (
    <>
      <div className={compact ? 'flex flex-wrap gap-2' : 'flex flex-col gap-2 sm:items-end'}>
        {!compact && (
          <p className="text-xs text-muted-foreground text-right max-w-xs">
            Após corrigir o cadastro, clique em <strong>Concluir solicitação</strong>.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
            onClick={() => setMode('complete')}
          >
            Concluir solicitação
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Clock className="h-4 w-4" />}
            onClick={() => setMode('waiting')}
          >
            Aguardar titular
          </Button>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<MoreHorizontal className="h-4 w-4" />}
            onClick={() => setMode('other')}
          >
            Outras ações
          </Button>
        </div>
      </div>

      <Modal
        isOpen={mode === 'complete'}
        onClose={closeModal}
        title="Concluir solicitação"
        size="sm"
      >
        {error && <Alert variant="error" message={error} className="mb-4" />}
        <form
          onSubmit={e => {
            e.preventDefault()
            const notes = new FormData(e.currentTarget).get('response_notes')
            submitStatus('completed', String(notes ?? ''))
          }}
          className="space-y-4"
        >
          <Alert
            variant="success"
            message="O titular verá esta solicitação como Concluída e não poderá mais responder neste ticket."
          />
          <Textarea
            name="response_notes"
            label="Mensagem de conclusão ao titular"
            defaultValue={completeDefaultMessage}
            rows={4}
            required
            hint="Esta mensagem aparece na conversa e notifica o usuário."
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={isPending} leftIcon={<CheckCircle2 className="h-4 w-4" />}>
              Confirmar conclusão
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={mode === 'waiting'}
        onClose={closeModal}
        title="Aguardar resposta do titular"
        size="sm"
      >
        {error && <Alert variant="error" message={error} className="mb-4" />}
        <form
          onSubmit={e => {
            e.preventDefault()
            const notes = new FormData(e.currentTarget).get('response_notes')
            submitStatus('waiting_user', String(notes ?? ''))
          }}
          className="space-y-4"
        >
          <Textarea
            name="response_notes"
            label="O que você precisa do titular?"
            placeholder="Ex.: Envie foto do RG e confirme o nome completo correto..."
            rows={4}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={isPending} leftIcon={<MessageSquareText className="h-4 w-4" />}>
              Enviar e aguardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={mode === 'other'} onClose={closeModal} title="Outras ações" size="sm">
        {error && <Alert variant="error" message={error} className="mb-4" />}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Select
            name="status"
            label="Novo status"
            required
            options={otherStatuses}
            placeholder="Selecione"
          />
          <Textarea
            name="response_notes"
            label="Mensagem ao titular (opcional)"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={isPending} leftIcon={<XCircle className="h-4 w-4" />}>
              Aplicar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

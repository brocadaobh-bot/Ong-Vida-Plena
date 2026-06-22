'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Paperclip, Send, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { sendLgpdRequestMessageAction } from '@/server/actions/lgpd'
import { getLgpdSenderLabel } from '@/lib/lgpd/message-labels'
import type { LgpdRequestMessage } from '@/types/domain'
import { cn } from '@/lib/utils/cn'

type LgpdRequestThreadProps = {
  requestId: string
  ticketOwnerId: string
  messages: LgpdRequestMessage[]
  currentUserId: string
  canReply: boolean
  legacyResponseNotes?: string | null
}

export function LgpdRequestThread({
  requestId,
  ticketOwnerId,
  messages,
  currentUserId,
  canReply,
  legacyResponseNotes,
}: LgpdRequestThreadProps) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('request_id', requestId)

    startTransition(async () => {
      const result = await sendLgpdRequestMessageAction(formData)
      if (result.success) {
        form.reset()
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  const hasMessages = messages.length > 0
  const showLegacy =
    legacyResponseNotes && messages.every(m => m.body !== legacyResponseNotes)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div
        ref={scrollRef}
        className="flex max-h-[min(440px,55vh)] min-h-[300px] flex-col gap-3 overflow-y-auto bg-[#f0f2f5] px-3 py-4 dark:bg-[#0f1419] sm:px-4"
      >
        {!hasMessages && !showLegacy && (
          <p className="m-auto max-w-xs text-center text-sm text-muted-foreground">
            Nenhuma mensagem ainda. Escreva abaixo para iniciar a conversa.
          </p>
        )}

        {messages.map(message => {
          const isMine = message.sender_id === currentUserId
          const senderLabel = getLgpdSenderLabel(message, ticketOwnerId)
          const timeLabel = format(new Date(message.created_at), 'HH:mm', { locale: ptBR })

          return (
            <div
              key={message.id}
              className={cn('flex w-full', isMine ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[min(100%,22rem)] rounded-xl px-3.5 py-2.5 shadow-sm sm:max-w-[78%]',
                  isMine
                    ? 'rounded-br-sm bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]'
                    : 'rounded-bl-sm bg-white text-[#111b21] dark:bg-[#202c33] dark:text-[#e9edef]',
                )}
              >
                {!isMine && (
                  <p className="mb-1 text-[11px] font-semibold leading-tight text-[#667781] dark:text-[#8696a0]">
                    {senderLabel}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-[15px] leading-[1.45]">{message.body}</p>
                {message.attachment_path && (
                  <div className="mt-2">
                    {message.attachment_url ? (
                      <a
                        href={message.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-black/5 px-2 py-1.5 text-xs font-medium text-[#027eb5] underline-offset-2 hover:underline dark:bg-white/10 dark:text-[#53bdeb]"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        {message.attachment_name ?? 'Ver anexo'}
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#667781] dark:text-[#8696a0]">
                        <FileText className="h-3.5 w-3.5" />
                        {message.attachment_name ?? 'Anexo'}
                      </span>
                    )}
                  </div>
                )}
                <p className="mt-1 text-right text-[11px] text-[#667781] dark:text-[#8696a0]">
                  {timeLabel}
                </p>
              </div>
            </div>
          )
        })}

        {showLegacy && (
          <div className="flex justify-start">
            <div className="max-w-[78%] rounded-xl rounded-bl-sm bg-white px-3.5 py-2.5 text-[#111b21] shadow-sm dark:bg-[#202c33] dark:text-[#e9edef]">
              <p className="mb-1 text-[11px] font-semibold text-[#667781] dark:text-[#8696a0]">
                Equipe ONG Vida Plena
              </p>
              <p className="whitespace-pre-wrap text-[15px] leading-[1.45]">{legacyResponseNotes}</p>
            </div>
          </div>
        )}
      </div>

      {canReply ? (
        <form
          onSubmit={handleSubmit}
          className="border-t border-border bg-[#f0f2f5] p-3 dark:bg-[#202c33] sm:p-4"
        >
          {error && <Alert variant="error" message={error} className="mb-3" />}
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1 rounded-2xl border border-border bg-white px-3 py-2 dark:border-transparent dark:bg-[#2a3942]">
              <textarea
                name="body"
                rows={2}
                required
                placeholder="Digite uma mensagem..."
                className="w-full resize-none bg-transparent text-[15px] leading-snug text-[#111b21] placeholder:text-[#667781] focus:outline-none dark:text-[#e9edef] dark:placeholder:text-[#8696a0]"
              />
              <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs text-[#667781] hover:text-[#111b21] dark:text-[#8696a0] dark:hover:text-[#e9edef]">
                <Paperclip className="h-3.5 w-3.5" />
                Anexar RG ou documento
                <input
                  type="file"
                  name="attachment"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="sr-only"
                />
              </label>
            </div>
            <Button
              type="submit"
              loading={isPending}
              size="sm"
              className="h-10 w-10 shrink-0 rounded-full p-0 sm:h-11 sm:w-11"
              aria-label="Enviar mensagem"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      ) : (
        <div className="border-t border-border bg-surface p-4">
          <Alert
            variant="info"
            message="Esta solicitação foi encerrada. Abra uma nova solicitação se precisar de algo mais."
          />
        </div>
      )}
    </div>
  )
}

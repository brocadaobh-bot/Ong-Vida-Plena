'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Megaphone, MapPin, MessageCircle, Calendar, Trash2, Pin } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Alert } from '@/components/ui/Alert'
import {
  updateClassInfoAction,
  createClassAnnouncementAction,
  deleteClassAnnouncementAction,
  upsertClassSessionAction,
  deleteClassSessionAction,
} from '@/server/actions/class-info'
import {
  fetchClassInfoPanelAction,
  type ClassInfoPanelData,
} from '@/server/queries/class-info'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ClassInfoManagerProps {
  classId: string
  className?: string
  triggerLabel?: string
  triggerVariant?: 'primary' | 'secondary' | 'ghost'
  triggerSize?: 'sm' | 'md'
}

export function ClassInfoManager({
  classId,
  className,
  triggerLabel = 'Avisos e info',
  triggerVariant = 'ghost',
  triggerSize = 'sm',
}: ClassInfoManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'info' | 'avisos' | 'aulas'>('info')
  const [data, setData] = useState<ClassInfoPanelData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  function loadData() {
    setLoading(true)
    setError(null)
    startTransition(async () => {
      const result = await fetchClassInfoPanelAction(classId, 'manage')
      setLoading(false)
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error)
      }
    })
  }

  useEffect(() => {
    if (open) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, classId])

  function handleInfoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateClassInfoAction(classId, fd)
      if (result.success) {
        setSuccess('Informações salvas!')
        loadData()
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  function handleAnnouncementSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setError(null)
    setSuccess(null)
    const fd = new FormData(form)
    fd.set('class_id', classId)
    startTransition(async () => {
      const result = await createClassAnnouncementAction(fd)
      if (result.success) {
        setSuccess('Aviso publicado!')
        form.reset()
        loadData()
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  function handleSessionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setError(null)
    setSuccess(null)
    const fd = new FormData(form)
    fd.set('class_id', classId)
    startTransition(async () => {
      const result = await upsertClassSessionAction(fd)
      if (result.success) {
        setSuccess('Aula adicionada!')
        form.reset()
        loadData()
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  function handleDeleteAnnouncement(id: string) {
    if (!confirm('Remover este aviso?')) return
    startTransition(async () => {
      const result = await deleteClassAnnouncementAction(id, classId)
      if (result.success) {
        loadData()
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  function handleDeleteSession(id: string) {
    if (!confirm('Remover esta aula?')) return
    startTransition(async () => {
      const result = await deleteClassSessionAction(id, classId)
      if (result.success) {
        loadData()
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  const cls = data?.class

  return (
    <>
      <Button
        size={triggerSize}
        variant={triggerVariant}
        className={className}
        leftIcon={<Megaphone className="h-4 w-4" />}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={cls ? `${cls.courseTitle} — ${cls.name}` : 'Informações da turma'}
        size="xl"
      >
        {error && <Alert variant="error" message={error} className="mb-4" />}
        {success && <Alert variant="success" message={success} className="mb-4" />}

        {loading && !data ? (
          <p className="py-8 text-center text-muted-foreground">Carregando…</p>
        ) : data ? (
          <>
            <div className="-mx-1 mb-4 flex gap-1 overflow-x-auto overscroll-x-contain border-b border-border pb-px">
              {([
                ['info', 'Local e links'],
                ['avisos', 'Avisos'],
                ['aulas', 'Aulas presenciais'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setTab(key); setSuccess(null); setError(null) }}
                  className={`shrink-0 whitespace-nowrap px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors min-h-[44px] sm:min-h-0 sm:py-2 ${
                    tab === key
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'info' && (
              <form onSubmit={handleInfoSubmit} className="space-y-4">
                <Input
                  name="location"
                  label="Local"
                  defaultValue={cls?.location ?? ''}
                  placeholder="Ex: Sede ONG Vida Plena"
                />
                <Input
                  name="room"
                  label="Sala"
                  defaultValue={cls?.room ?? ''}
                  placeholder="Ex: Sala 3"
                />
                <Input
                  name="whatsapp_link"
                  label="Link do WhatsApp"
                  defaultValue={cls?.whatsapp_link ?? ''}
                  placeholder="https://chat.whatsapp.com/... ou https://wa.me/5511..."
                  hint="Grupo ou contato para os alunos entrarem."
                />
                <Textarea
                  name="schedule_description"
                  label="Horário e observações"
                  defaultValue={cls?.schedule_description ?? ''}
                  placeholder="Ex: Segundas e quartas, 14h às 17h"
                  rows={3}
                />
                <Button type="submit" loading={isPending}>Salvar informações</Button>
              </form>
            )}

            {tab === 'avisos' && (
              <div className="space-y-4">
                <form onSubmit={handleAnnouncementSubmit} className="inset-box space-y-3">
                  <p className="text-sm font-medium text-foreground">Novo aviso</p>
                  <Input name="title" label="Título" required placeholder="Ex: Material para a 1ª aula" />
                  <Textarea name="body" label="Mensagem" required rows={3} placeholder="Texto do aviso para os inscritos..." />
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" name="is_pinned" className="rounded border-border" />
                    Fixar no topo
                  </label>
                  <Button type="submit" size="sm" loading={isPending}>Publicar aviso</Button>
                </form>

                {data.announcements.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">Nenhum aviso publicado.</p>
                ) : (
                  <div className="space-y-2">
                    {data.announcements.map(a => (
                      <div key={a.id} className="inset-box">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-foreground flex items-center gap-1.5">
                              {a.is_pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
                              {a.title}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{a.body}</p>
                            <p className="mt-1 text-xs text-muted-foreground/70">
                              {format(new Date(a.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAnnouncement(a.id)}
                            className="text-red-600 dark:text-red-400 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'aulas' && (
              <div className="space-y-4">
                <form onSubmit={handleSessionSubmit} className="inset-box space-y-3">
                  <p className="text-sm font-medium text-foreground">Nova aula presencial</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input name="session_date" type="date" label="Data" required />
                    <Input name="room" label="Sala" placeholder="Opcional — usa sala da turma se vazio" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input name="start_time" type="time" label="Início" />
                    <Input name="end_time" type="time" label="Término" />
                  </div>
                  <Input name="topic" label="Tema / conteúdo" placeholder="Ex: Introdução ao Excel" />
                  <Button type="submit" size="sm" loading={isPending}>Adicionar aula</Button>
                </form>

                {data.sessions.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma aula cadastrada.</p>
                ) : (
                  <div className="divide-y divide-border rounded-lg border border-border">
                    {data.sessions.map(s => (
                      <div key={s.id} className="inset-box flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {format(new Date(s.session_date), "dd/MM/yyyy", { locale: ptBR })}
                            {s.start_time && ` · ${s.start_time.slice(0, 5)}`}
                            {s.end_time && ` — ${s.end_time.slice(0, 5)}`}
                          </p>
                          {s.topic && <p className="text-xs text-muted-foreground">{s.topic}</p>}
                          {(s.room || cls?.room) && (
                            <p className="text-xs text-muted-foreground">
                              Sala: {s.room ?? cls?.room}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSession(s.id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}
      </Modal>
    </>
  )
}

interface ClassInfoViewProps {
  data: ClassInfoPanelData
}

export function ClassInfoView({ data }: ClassInfoViewProps) {
  const { class: cls, announcements, sessions } = data

  return (
    <div className="space-y-6">
      <CardSection title="Local e horário" icon={MapPin}>
        <dl className="grid gap-2 text-sm">
          {cls.location && (
            <div>
              <dt className="text-muted-foreground">Local</dt>
              <dd className="font-medium text-foreground">{cls.location}</dd>
            </div>
          )}
          {cls.room && (
            <div>
              <dt className="text-muted-foreground">Sala</dt>
              <dd className="font-medium text-foreground">{cls.room}</dd>
            </div>
          )}
          {cls.schedule_description && (
            <div>
              <dt className="text-muted-foreground">Horário / observações</dt>
              <dd className="text-foreground whitespace-pre-wrap">{cls.schedule_description}</dd>
            </div>
          )}
          {!cls.location && !cls.room && !cls.schedule_description && (
            <p className="text-muted-foreground">Informações de local ainda não publicadas.</p>
          )}
        </dl>
      </CardSection>

      {cls.whatsapp_link && (
        <CardSection title="Grupo WhatsApp" icon={MessageCircle}>
          <a
            href={cls.whatsapp_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white shadow-soft-xs hover:bg-green-800 transition-colors dark:bg-green-700 dark:hover:bg-green-600"
          >
            <MessageCircle className="h-4 w-4" />
            Entrar no grupo / conversar
          </a>
        </CardSection>
      )}

      <CardSection title="Aulas presenciais" icon={Calendar}>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma aula programada ainda.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className="inset-box">
                <p className="font-medium text-foreground">
                  {format(new Date(s.session_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  {s.start_time && ` · ${s.start_time.slice(0, 5)}`}
                  {s.end_time && ` — ${s.end_time.slice(0, 5)}`}
                </p>
                {s.topic && <p className="text-sm text-muted-foreground">{s.topic}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {[cls.location, s.room ?? cls.room].filter(Boolean).join(' — ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardSection>

      <CardSection title="Avisos" icon={Megaphone}>
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum aviso no momento.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className="inset-box">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  {a.is_pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
                  {a.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{a.body}</p>
                <p className="mt-2 text-xs text-muted-foreground/70">
                  {format(new Date(a.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardSection>
    </div>
  )
}

function CardSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </h2>
      {children}
    </section>
  )
}

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type SessionRef = {
  id: string
  session_date: string
  topic: string | null
  start_time: string | null
}

export function formatSessionLabel(session: SessionRef | null | undefined): string {
  if (!session) return 'Sem aula vinculada'

  const date = format(new Date(session.session_date), "dd/MM/yyyy", { locale: ptBR })
  const time = session.start_time ? ` · ${session.start_time.slice(0, 5)}` : ''
  const topic = session.topic ? ` — ${session.topic}` : ''

  return `${date}${time}${topic}`
}

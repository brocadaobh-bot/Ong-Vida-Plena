import { getAuthUser } from '@/lib/auth/session'
import { getOwnLgpdRequestsWithUnread } from '@/server/queries/lgpd-requests'
import { isLgpdRequestActive } from '@/lib/lgpd/status'
import { Card } from '@/components/ui/Card'
import { DataRequestForm } from '@/components/lgpd/DataRequestForm'
import { LgpdRequestListItem } from '@/components/lgpd/LgpdRequestListItem'
import { FileSearch, FilePen, Trash2, Download } from 'lucide-react'

export default async function LgpdPage() {
  const user = await getAuthUser()
  const requests = await getOwnLgpdRequestsWithUnread(user!.id)
  const active = requests.filter(r => isLgpdRequestActive(r.status))
  const closed = requests.filter(r => !isLgpdRequestActive(r.status))
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meus Dados (LGPD)</h1>
        <p className="text-muted-foreground">
          Gerencie seus dados pessoais conforme a Lei Geral de Proteção de Dados.
        </p>
      </div>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-foreground">Seus Direitos</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: FileSearch, title: 'Acesso',        desc: 'Consulte todos os dados que temos sobre você.' },
            { icon: FilePen,    title: 'Correção',      desc: 'Solicite a correção de dados incorretos.' },
            { icon: Trash2,     title: 'Exclusão',      desc: 'Peça a exclusão dos seus dados pessoais.' },
            { icon: Download,   title: 'Portabilidade', desc: 'Exporte seus dados em formato estruturado.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 rounded-lg bg-muted p-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-foreground">Nova Solicitação</h2>
        <DataRequestForm />
      </Card>

      {active.length > 0 && (
        <Card>
          <h2 className="mb-4 text-base font-semibold text-foreground">Em andamento ({active.length})</h2>
          <div className="space-y-3">
            {active.map(request => (
              <LgpdRequestListItem
                key={request.id}
                request={request}
                detailHref={`/beneficiario/lgpd/${request.id}`}
              />
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground/80">
            Clique em <strong>Abrir conversa</strong> para responder mensagens da equipe ou enviar documentos.
          </p>
        </Card>
      )}

      {closed.length > 0 && (
        <Card>
          <h2 className="mb-4 text-base font-semibold text-foreground">Concluídas / Encerradas</h2>
          <div className="space-y-3">
            {closed.map(request => (
              <LgpdRequestListItem
                key={request.id}
                request={request}
                detailHref={`/beneficiario/lgpd/${request.id}`}
              />
            ))}
          </div>
        </Card>
      )}    </div>
  )
}

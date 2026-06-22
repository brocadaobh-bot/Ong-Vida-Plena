import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { UserStatusBadge } from '@/components/ui/Badge'
import { AdminFilterBar, AdminNavLink } from '@/components/admin/AdminFilterBar'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { STATUS_LABELS } from '@/types/domain'
import type { UserStatus } from '@/types/database'

export default async function BeneficiariosAssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status: statusFilter } = await searchParams
  const search = q?.trim() ?? ''
  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'beneficiary')
    .order('full_name')

  if (search) {
    const term = search.replace(/[%_,]/g, ' ')
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
  }

  if (statusFilter && statusFilter in STATUS_LABELS) {
    query = query.eq('status', statusFilter as UserStatus)
  }

  const { data: beneficiaries, count } = await query

  const { data: enrollmentCounts } = await supabase
    .from('enrollments')
    .select('beneficiary_id')
    .not('status', 'eq', 'cancelled')

  const countByBeneficiary = new Map<string, number>()
  enrollmentCounts?.forEach(e => {
    countByBeneficiary.set(e.beneficiary_id, (countByBeneficiary.get(e.beneficiary_id) ?? 0) + 1)
  })

  const hasFilters = Boolean(search || statusFilter)

  const filters = [
    search
      ? { key: 'q', label: `Busca: "${search}"`, value: search }
      : null,
    statusFilter && statusFilter in STATUS_LABELS
      ? { key: 'status', label: `Status: ${STATUS_LABELS[statusFilter as UserStatus]}`, value: statusFilter }
      : null,
  ].filter(Boolean) as { key: string; label: string; value: string }[]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground">
            {count ?? 0} usuário{count !== 1 ? 's' : ''} cadastrado{count !== 1 ? 's' : ''}
            {hasFilters ? ' com os filtros aplicados' : ''}.
          </p>
        </div>
        <Link href="/assistente/beneficiarios/novo">
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Novo Usuário
          </Button>
        </Link>
      </div>

      <form method="get" action="/assistente/beneficiarios" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={search}
          placeholder="Buscar por nome, e-mail ou telefone..."
          className="input-base min-w-[220px] flex-1 max-w-lg"
        />
        <select
          name="status"
          defaultValue={statusFilter ?? ''}
          className="input-base min-w-[160px]"
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        {hasFilters && (
          <Button type="button" variant="ghost" asChild>
            <Link href="/assistente/beneficiarios">Limpar filtros</Link>
          </Button>
        )}
      </form>

      <AdminFilterBar filters={filters} basePath="/assistente/beneficiarios" />

      <Card className="overflow-hidden p-0">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {['Nome', 'E-mail', 'Telefone', 'Inscrições', 'Status', 'Desde', 'Ações'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!beneficiaries || beneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    {hasFilters
                      ? 'Nenhum usuário encontrado com esses filtros.'
                      : 'Nenhum usuário encontrado.'}
                  </td>
                </tr>
              ) : (
                beneficiaries.map((b: any) => (
                  <tr key={b.id}>
                    <td className="cell-primary">{b.full_name}</td>
                    <td>{b.email}</td>
                    <td>{b.phone ?? '—'}</td>
                    <td>
                      <AdminNavLink href={`/assistente/inscricoes?beneficiary_id=${b.id}&view=person`}>
                        {countByBeneficiary.get(b.id) ?? 0}
                      </AdminNavLink>
                    </td>
                    <td><UserStatusBadge status={b.status} /></td>
                    <td className="text-xs whitespace-nowrap">
                      {format(new Date(b.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        <Link href={`/assistente/beneficiarios/${b.id}`}>
                          <Button size="sm" variant="ghost">Editar</Button>
                        </Link>
                        <Link href={`/assistente/inscricoes?beneficiary_id=${b.id}&view=person`}>
                          <Button size="sm" variant="ghost">Inscrições</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

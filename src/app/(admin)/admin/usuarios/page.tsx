import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { isProtectedAdminEmail } from '@/lib/auth/protected-admins'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserStatusBadge, UserRoleBadge } from '@/components/ui/Badge'
import { AdminFilterBar, type AdminFilter } from '@/components/admin/AdminFilterBar'
import { sortUsersForManagement } from '@/lib/utils/sort-ptbr'
import { CANCELLABLE_ENROLLMENT_STATUSES } from '@/lib/enrollments/cancel-profile-enrollments'
import { ROLE_LABELS, STATUS_LABELS } from '@/types/domain'
import { UserActions } from './UserActions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { UserRole, UserStatus } from '@/types/database'

export default async function UsuariosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>
}) {
  const { q: search, role: roleFilter, status: statusFilter } = await searchParams
  const [supabase, authUser] = await Promise.all([
    createClient(),
    getAuthUser(),
  ])

  let query = supabase.from('profiles').select('*')

  if (search?.trim()) {
    const term = search.trim().replace(/[%_,]/g, ' ')
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
  }

  if (roleFilter && roleFilter in ROLE_LABELS) {
    query = query.eq('role', roleFilter as UserRole)
  }

  if (statusFilter && statusFilter in STATUS_LABELS) {
    query = query.eq('status', statusFilter as UserStatus)
  }

  const { data: rawUsers } = await query
  const users = sortUsersForManagement(rawUsers ?? [])

  const staffIds = users.filter(u => u.role !== 'beneficiary').map(u => u.id)
  const studentEnrollmentCountByUser = new Map<string, number>()

  if (staffIds.length > 0) {
    const { data: staffEnrollments } = await supabase
      .from('enrollments')
      .select('beneficiary_id')
      .in('beneficiary_id', staffIds)
      .in('status', CANCELLABLE_ENROLLMENT_STATUSES)

    for (const row of staffEnrollments ?? []) {
      studentEnrollmentCountByUser.set(
        row.beneficiary_id,
        (studentEnrollmentCountByUser.get(row.beneficiary_id) ?? 0) + 1,
      )
    }
  }

  const hasFilters = Boolean(search?.trim() || roleFilter || statusFilter)

  const filters: AdminFilter[] = [
    search?.trim()
      ? { key: 'q', label: `Busca: "${search.trim()}"`, value: search.trim() }
      : null,
    roleFilter && roleFilter in ROLE_LABELS
      ? { key: 'role', label: `Papel: ${ROLE_LABELS[roleFilter as UserRole]}`, value: roleFilter }
      : null,
    statusFilter && statusFilter in STATUS_LABELS
      ? {
          key: 'status',
          label: `Status: ${STATUS_LABELS[statusFilter as UserStatus]}`,
          value: statusFilter,
        }
      : null,
  ].filter(Boolean) as AdminFilter[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Papéis e Acesso</h1>
        <p className="text-muted-foreground">
          Gerencie papéis e status de todas as contas.
          {users.length > 0 && (
            <>
              {' '}
              {users.length} conta{users.length !== 1 ? 's' : ''} encontrada
              {users.length !== 1 ? 's' : ''}
              {hasFilters ? ' com os filtros aplicados' : ''}.
            </>
          )}
          {' '}
          Contas em <code className="text-xs">PROTECTED_ADMIN_EMAILS</code> no servidor não podem ser rebaixadas pelo painel.
        </p>
      </div>

      <form method="get" action="/admin/usuarios" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={search ?? ''}
          placeholder="Buscar por nome ou e-mail..."
          className="input-base min-w-[220px] flex-1 max-w-lg"
        />
        <select
          name="role"
          defaultValue={roleFilter ?? ''}
          className="input-base min-w-[180px]"
          aria-label="Filtrar por papel"
        >
          <option value="">Todos os papéis</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
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
            <Link href="/admin/usuarios">Limpar filtros</Link>
          </Button>
        )}
      </form>

      <AdminFilterBar filters={filters} basePath="/admin/usuarios" />

      <Card className="overflow-hidden p-0">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {['Nome', 'E-mail', 'Papel', 'Status', 'Desde', 'Ações'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    {hasFilters
                      ? 'Nenhuma conta encontrada com esses filtros.'
                      : 'Nenhuma conta encontrada.'}
                  </td>
                </tr>
              ) : (
                users.map((user: any) => (
                  <tr key={user.id}>
                    <td className="cell-primary">{user.full_name}</td>
                    <td>{user.email}</td>
                    <td><UserRoleBadge role={user.role} /></td>
                    <td><UserStatusBadge status={user.status} /></td>
                    <td className="text-xs whitespace-nowrap">
                      {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td>
                      <UserActions
                        user={user}
                        currentUserId={authUser?.id}
                        isProtectedAdmin={isProtectedAdminEmail(user.email)}
                        studentEnrollmentCount={studentEnrollmentCountByUser.get(user.id) ?? 0}
                      />
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

import { getAuthUser } from '@/lib/auth/session'
import { getBeneficiaryAttendance, type BeneficiaryAttendanceRecord } from '@/server/queries/enrollments'
import { computeAttendanceStats } from '@/lib/attendance/stats'
import {
  BeneficiaryAttendanceAccordion,
  type AttendanceGroupItem,
} from '@/components/beneficiary/BeneficiaryAttendanceAccordion'
import { Card, StatCard } from '@/components/ui/Card'
import { ClipboardList, CheckCircle, XCircle, Clock, Percent } from 'lucide-react'

function buildAttendanceGroups(records: BeneficiaryAttendanceRecord[]): AttendanceGroupItem[] {
  const groups = new Map<string, AttendanceGroupItem>()

  for (const record of records) {
    const courseTitle = record.class_sessions?.classes?.courses?.title ?? 'Curso'
    const className = record.class_sessions?.classes?.name ?? 'Turma'
    const classId = record.class_sessions?.classes?.id ?? null
    const key = classId ?? `${courseTitle}::${className}`

    const existing = groups.get(key)
    const row = {
      id: record.id,
      status: record.status,
      notes: record.notes,
      sessionDate: record.class_sessions?.session_date ?? null,
      topic: record.class_sessions?.topic ?? null,
    }

    if (existing) {
      existing.records.push(row)
    } else {
      groups.set(key, {
        id: key,
        classId,
        courseTitle,
        className,
        stats: { total: 0, present: 0, absent: 0, late: 0, justified: 0, presenceRate: 0 },
        records: [row],
      })
    }
  }

  return Array.from(groups.values()).map(group => ({
    ...group,
    records: group.records.sort(
      (a, b) =>
        new Date(b.sessionDate ?? 0).getTime() - new Date(a.sessionDate ?? 0).getTime(),
    ),
    stats: computeAttendanceStats(
      group.records.map(r => ({ status: r.status })),
    ),
  }))
}

export default async function PresencasPage() {
  const user = await getAuthUser()
  const records = await getBeneficiaryAttendance(user!.id)
  const stats = computeAttendanceStats(records)
  const groups = buildAttendanceGroups(records)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minhas Presenças</h1>
        <p className="text-muted-foreground">
          Clique em uma turma para ver o detalhamento das aulas. Os registros são feitos pelo instrutor.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard title="Aulas registradas" value={stats.total} icon={ClipboardList} />
        <StatCard title="Presentes" value={stats.present} icon={CheckCircle} />
        <StatCard title="Faltas" value={stats.absent} icon={XCircle} />
        <StatCard title="Atrasos" value={stats.late} icon={Clock} />
        <StatCard
          title="Presença"
          value={`${stats.presenceRate}%`}
          icon={Percent}
          description={
            stats.justified > 0
              ? `${stats.justified} justificada${stats.justified !== 1 ? 's' : ''}`
              : undefined
          }
        />
      </div>

      {records.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <ClipboardList className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhum registro de presença ainda.</p>
            <p className="mt-1 text-sm text-muted-foreground/80">
              Quando o instrutor registrar sua frequência nas aulas, os dados aparecerão aqui.
            </p>
          </div>
        </Card>
      ) : (
        <BeneficiaryAttendanceAccordion groups={groups} />
      )}
    </div>
  )
}

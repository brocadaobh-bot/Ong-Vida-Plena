'use client'

import { useState, useTransition } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { bulkRecordAttendanceAction } from '@/server/actions/attendance'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

type AttendanceStatus = 'present' | 'absent' | 'justified' | 'late'
type AttendanceSelection = AttendanceStatus | null

interface Enrollment {
  id:             string
  beneficiary_id: string
  profiles:       { full_name: string } | null
}

interface AttendanceFormProps {
  sessionId:          string
  sessionDate:        string
  enrollments:        Enrollment[]
  existingAttendance: Map<string, { status: AttendanceStatus; notes?: string | null }>
  classId:            string
}

const statusOptions: { value: AttendanceStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'present',   label: 'Presente',    icon: CheckCircle },
  { value: 'absent',    label: 'Ausente',     icon: XCircle },
  { value: 'justified', label: 'Justificado', icon: AlertCircle },
  { value: 'late',      label: 'Atrasado',    icon: Clock },
]

export function AttendanceForm({
  sessionId,
  sessionDate,
  enrollments,
  existingAttendance,
  classId: _classId,
}: AttendanceFormProps) {
  const [attendance, setAttendance] = useState<Record<string, AttendanceSelection>>(() => {
    const initial: Record<string, AttendanceSelection> = {}
    enrollments.forEach(e => {
      initial[e.id] = existingAttendance.get(e.id)?.status ?? null
    })
    return initial
  })

  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleMarkAll(status: AttendanceStatus) {
    const updated: Record<string, AttendanceSelection> = {}
    enrollments.forEach(e => { updated[e.id] = status })
    setAttendance(updated)
  }

  function handleClearAll() {
    const updated: Record<string, AttendanceSelection> = {}
    enrollments.forEach(e => { updated[e.id] = null })
    setAttendance(updated)
  }

  function handleSubmit() {
    setError(null)
    setSuccess(false)

    const unmarked = enrollments.filter(e => attendance[e.id] === null)
    if (unmarked.length > 0) {
      setError('Marque a presença de todos os alunos antes de salvar.')
      return
    }

    const records = enrollments.map(e => ({
      enrollment_id: e.id,
      status:        attendance[e.id] as AttendanceStatus,
    }))

    startTransition(async () => {
      const result = await bulkRecordAttendanceAction(sessionId, records)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error)
      }
    })
  }

  const markedCount  = Object.values(attendance).filter(s => s !== null).length
  const presentCount = Object.values(attendance).filter(s => s === 'present' || s === 'late').length
  const totalCount   = enrollments.length

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Aula de {format(new Date(sessionDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {markedCount === 0
              ? 'Nenhuma presença marcada — selecione o status de cada aluno'
              : `${presentCount}/${totalCount} presentes · ${markedCount}/${totalCount} marcados`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleMarkAll('present')}>
            Todos presentes
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleMarkAll('absent')}>
            Todos ausentes
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClearAll}>
            Limpar marcações
          </Button>
        </div>
      </div>

      {error   && <Alert variant="error"   message={error}                       className="mb-4" />}
      {success && <Alert variant="success" message="Presenças registradas com sucesso!" className="mb-4" />}

      {totalCount === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nenhum aluno confirmado para registrar presença nesta aula.
        </p>
      ) : (
      <div className="space-y-2">
        {enrollments.map(enrollment => (
          <div
            key={enrollment.id}
            className="inset-box flex items-center justify-between"
          >
            <p className="text-sm font-medium text-foreground">
              {enrollment.profiles?.full_name ?? 'Aluno'}
            </p>
            <div className="flex items-center gap-1">
              {statusOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAttendance(prev => ({ ...prev, [enrollment.id]: value }))}
                  title={label}
                  className={`rounded-lg p-1.5 transition-colors ${
                    attendance[enrollment.id] === value
                      ? value === 'present'   ? 'bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400'
                      : value === 'absent'    ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                      : value === 'justified' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-400'
                      : 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                      : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
              {attendance[enrollment.id] === null && (
                <span className="ml-1 text-xs text-muted-foreground">Pendente</span>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {totalCount > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <Button onClick={handleSubmit} loading={isPending} className="w-full">
            Salvar Registros de Presença
          </Button>
        </div>
      )}
    </Card>
  )
}

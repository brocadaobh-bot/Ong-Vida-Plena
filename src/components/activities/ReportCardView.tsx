import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import type { ReportCardActivityItem, StudentReportCard } from '@/lib/activities/report-card'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  MessageSquare,
  Percent,
  XCircle,
} from 'lucide-react'

interface ReportCardViewProps {
  report: StudentReportCard
  showStudentName?: boolean
  /** Oculta cabeçalho duplicado quando embutido no acordeão do beneficiário */
  embedded?: boolean
}

function ActivityStatusBadge({ passed }: { passed: boolean | null }) {
  if (passed === null) {
    return (
      <Badge variant="default" size="sm" dot>
        <Clock className="h-3 w-3" />
        Pendente (sem nota)
      </Badge>
    )
  }

  if (passed) {
    return (
      <Badge variant="success" size="sm" dot>
        <CheckCircle2 className="h-3 w-3" />
        Aprovado
      </Badge>
    )
  }

  return (
    <Badge variant="warning" size="sm" dot>
      <XCircle className="h-3 w-3" />
      Abaixo do mínimo
    </Badge>
  )
}

function ScoreBar({ score, maxScore, minPassingScore }: { score: number; maxScore: number; minPassingScore: number }) {
  const percent = maxScore > 0 ? Math.min(100, (score / maxScore) * 100) : 0
  const minPercent = maxScore > 0 ? (minPassingScore / maxScore) * 100 : 0
  const passed = score >= minPassingScore

  return (
    <div className="space-y-1.5">
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            passed ? 'bg-green-500 dark:bg-green-400' : 'bg-amber-500 dark:bg-amber-400',
          )}
          style={{ width: `${percent}%` }}
        />
        {minPercent > 0 && minPercent < 100 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-foreground/30"
            style={{ left: `${minPercent}%` }}
            title={`Nota mínima: ${minPassingScore}`}
          />
        )}
      </div>
    </div>
  )
}

function ActivityGradeCard({ item, index }: { item: ReportCardActivityItem; index: number }) {
  const hasScore = item.score !== null

  return (
    <article
      className={cn(
        'rounded-xl border border-border bg-surface p-4 sm:p-5',
        item.passed === false && 'border-amber-200/80 dark:border-amber-900/40',
        item.passed === true && 'border-green-200/60 dark:border-green-900/30',
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <h4 className="text-base font-semibold leading-snug text-foreground">{item.title}</h4>
          </div>

          {item.sessionLabel && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {item.sessionLabel}
            </p>
          )}
        </div>

        <ActivityStatusBadge passed={item.passed} />
      </div>

      <div className="mt-4 grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nota obtida</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {hasScore ? (
              <>
                {item.score}
                <span className="text-base font-normal text-muted-foreground"> / {item.maxScore}</span>
              </>
            ) : (
              <span className="text-lg font-medium text-muted-foreground">—</span>
            )}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nota mínima</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{item.minPassingScore}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avaliado em</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {item.gradedAt
              ? format(new Date(item.gradedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
              : '—'}
          </p>
        </div>
      </div>

      {hasScore && (
        <div className="mt-4">
          <ScoreBar
            score={item.score!}
            maxScore={item.maxScore}
            minPassingScore={item.minPassingScore}
          />
        </div>
      )}

      {item.feedback && (
        <div className="mt-4 rounded-lg border border-border/60 bg-muted/30 p-3 sm:p-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            Observações do instrutor
          </p>
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{item.feedback}</p>
        </div>
      )}
    </article>
  )
}

export function ReportCardView({ report, showStudentName = false, embedded = false }: ReportCardViewProps) {
  const enrollmentLabel =
    report.approved
      ? 'Aprovado'
      : report.enrollmentStatus === 'recovery'
        ? 'Em recuperação'
        : 'Não aprovado'

  const enrollmentVariant = report.approved ? 'success' : 'warning'

  return (
    <div className="space-y-6">
      <Card variant="elevated" className="overflow-hidden p-0">
        {!embedded && (
          <CardHeader className="border-b border-border bg-muted/20 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden />
                  Boletim escolar
                </CardTitle>
                <CardDescription className="text-sm">
                  {report.courseTitle} — {report.className}
                </CardDescription>
                {showStudentName && (
                  <p className="pt-1 text-sm font-medium text-foreground">{report.studentName}</p>
                )}
              </div>
              <Badge variant={enrollmentVariant} size="md" dot>
                {enrollmentLabel}
              </Badge>
            </div>
          </CardHeader>
        )}

        <CardContent className={cn('pt-5', embedded && 'px-4 pb-4 sm:px-5 sm:pb-5')}>
          {embedded && (
            <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
              <Badge variant={enrollmentVariant} size="sm" dot>
                {enrollmentLabel}
              </Badge>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <Percent className="h-4 w-4" aria-hidden />
                <span className="text-xs font-medium uppercase tracking-wide">Presença</span>
              </div>
              <p
                className={cn(
                  'text-3xl font-bold tabular-nums',
                  report.attendanceMet
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-amber-600 dark:text-amber-400',
                )}
              >
                {report.attendancePercent}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Mínimo exigido: {report.minAttendancePercent}%
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" aria-hidden />
                <span className="text-xs font-medium uppercase tracking-wide">Média</span>
              </div>
              <p className="text-3xl font-bold tabular-nums text-foreground">
                {report.averageScore !== null ? report.averageScore : '—'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Média nas atividades avaliadas</p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                <span className="text-xs font-medium uppercase tracking-wide">Atividades</span>
              </div>
              <p className="text-3xl font-bold tabular-nums text-foreground">
                {report.activitiesPassed}
                <span className="text-lg font-normal text-muted-foreground"> / {report.activitiesTotal}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Aprovadas no mínimo exigido</p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="h-4 w-4" aria-hidden />
                <span className="text-xs font-medium uppercase tracking-wide">Requisitos</span>
              </div>
              <p className="text-sm font-semibold leading-snug text-foreground">
                {report.activitiesMet && report.attendanceMet
                  ? 'Presença e notas OK'
                  : 'Ainda pendentes'}
              </p>
              {report.generatedAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Atualizado em{' '}
                  {format(new Date(report.generatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
            </div>
          </div>

          {report.recoveryReopenedAt && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              Recuperação reaberta em{' '}
              {format(new Date(report.recoveryReopenedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              . O instrutor pode reavaliar suas notas nesta turma.
            </div>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2 px-1">
          <div>
            <h3 className="text-base font-semibold text-foreground">Atividades e notas</h3>
            <p className="text-sm text-muted-foreground">
              Detalhamento de cada trabalho, nota e observações do instrutor.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {report.activities.filter(a => a.score !== null).length} de {report.activities.length} avaliada(s)
          </p>
        </div>

        {report.activities.length === 0 ? (
          <Card>
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma atividade cadastrada nesta turma.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {report.activities.map((item, index) => (
              <ActivityGradeCard key={item.activityId} item={item} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { buildInscricoesQueryString } from '@/lib/enrollments/inscricoes-query'

interface InscricoesViewTabsProps {
  basePath: string
  currentView: 'class' | 'person'
  params: {
    classId?: string
    beneficiaryId?: string
    courseId?: string
    search?: string
    status?: string
  }
}

export function InscricoesViewTabs({ basePath, currentView, params }: InscricoesViewTabsProps) {
  const tabs = [
    { id: 'class' as const, label: 'Por turma' },
    { id: 'person' as const, label: 'Por usuário' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(tab => {
        const href = `${basePath}${buildInscricoesQueryString({ ...params, view: tab.id })}`
        const isActive = currentView === tab.id

        return (
          <Link
            key={tab.id}
            href={href}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

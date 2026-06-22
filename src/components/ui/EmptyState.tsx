import { cn } from '@/lib/utils/cn'
import React from 'react'
import {
  BookOpen,
  Users,
  FileText,
  Search,
  Inbox,
  AlertCircle,
  ClipboardList,
  GraduationCap,
  Bell,
  type LucideIcon,
} from 'lucide-react'

/* ─── Types ──────────────────────────────────────────────── */
interface EmptyStateProps {
  icon?:        LucideIcon | React.ElementType
  variant?:     'default' | 'search' | 'error' | 'comingSoon'
  title:        string
  description?: string
  action?:      React.ReactNode
  className?:   string
  size?:        'sm' | 'md' | 'lg'
}

/* ─── Preset icons por contexto ──────────────────────────── */
export const EmptyIcons = {
  courses:      GraduationCap,
  beneficiaries:Users,
  reports:      FileText,
  enrollments:  ClipboardList,
  classes:      BookOpen,
  notifications:Bell,
  inbox:        Inbox,
  search:       Search,
  generic:      Inbox,
}

/* ─── Main Component ─────────────────────────────────────── */
export function EmptyState({
  icon: Icon = Inbox,
  variant = 'default',
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: { wrapper: 'py-8',  icon: 'h-10 w-10', iconBox: 'h-16 w-16', title: 'text-sm', desc: 'text-xs', gap: 'gap-2' },
    md: { wrapper: 'py-12', icon: 'h-12 w-12', iconBox: 'h-20 w-20', title: 'text-base', desc: 'text-sm', gap: 'gap-3' },
    lg: { wrapper: 'py-16', icon: 'h-14 w-14', iconBox: 'h-24 w-24', title: 'text-lg', desc: 'text-base', gap: 'gap-4' },
  }
  const s = sizeClasses[size]

  const variantStyles: Record<typeof variant, string> = {
    default:    'bg-muted/40 text-muted-foreground',
    search:     'bg-blue-50    dark:bg-blue-950/30  text-blue-500    dark:text-blue-400',
    error:      'bg-red-50     dark:bg-red-950/30   text-red-500     dark:text-red-400',
    comingSoon: 'bg-purple-50  dark:bg-purple-950/30 text-purple-500 dark:text-purple-400',
  }

  return (
    <div
      role="status"
      aria-label={title}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        s.wrapper,
        'animate-fade-in',
        className,
      )}
    >
      {/* Icon container */}
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl mb-4',
          s.iconBox,
          variantStyles[variant],
        )}
        aria-hidden="true"
      >
        <Icon className={s.icon} />
      </div>

      {/* Text */}
      <div className={cn('flex flex-col items-center', s.gap)}>
        <h3 className={cn('font-semibold text-foreground', s.title)}>{title}</h3>
        {description && (
          <p className={cn('max-w-xs text-muted-foreground leading-relaxed', s.desc)}>
            {description}
          </p>
        )}
      </div>

      {/* Action */}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

/* ─── Specific presets ───────────────────────────────────── */
export function EmptySearch({
  query,
  onClear,
  className,
}: {
  query?:   string
  onClear?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={Search}
      variant="search"
      title="Nenhum resultado encontrado"
      description={
        query
          ? `Não encontramos resultados para "${query}". Tente outros termos.`
          : 'Nenhum item corresponde aos filtros aplicados.'
      }
      action={
        onClear && (
          <button
            onClick={onClear}
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Limpar filtros
          </button>
        )
      }
      className={className}
    />
  )
}

export function EmptyError({
  onRetry,
  className,
}: {
  onRetry?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      variant="error"
      title="Algo deu errado"
      description="Não foi possível carregar os dados. Por favor, tente novamente."
      action={
        onRetry && (
          <button
            onClick={onRetry}
            className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Tentar novamente
          </button>
        )
      }
      className={className}
    />
  )
}

import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'
import React from 'react'
import type {
  UserRole,
  UserStatus,
  EnrollmentStatus,
  CourseStatus,
  ClassStatus,
  AttendanceStatus,
  DataRequestStatus,
} from '@/types/database'

/* ─── Variants ───────────────────────────────────────────── */
const badgeVariants = cva(
  [
    'inline-flex items-center gap-1.5 rounded-full font-medium',
    'transition-colors duration-150',
    'border',
  ],
  {
    variants: {
      variant: {
        // Semantic
        default:     'bg-muted text-muted-foreground border-border/60',
        primary:     'bg-primary-50  dark:bg-primary-950/50  text-primary-700  dark:text-primary-300  border-primary-200  dark:border-primary-800/50',
        success:     'bg-green-50    dark:bg-green-950/50    text-green-700    dark:text-green-300    border-green-200    dark:border-green-800/50',
        warning:     'bg-yellow-50   dark:bg-yellow-950/50   text-yellow-700   dark:text-yellow-300   border-yellow-200   dark:border-yellow-800/50',
        danger:      'bg-red-50      dark:bg-red-950/50      text-red-700      dark:text-red-300      border-red-200      dark:border-red-800/50',
        info:        'bg-blue-50     dark:bg-blue-950/50     text-blue-700     dark:text-blue-300     border-blue-200     dark:border-blue-800/50',
        purple:      'bg-purple-50   dark:bg-purple-950/50   text-purple-700   dark:text-purple-300   border-purple-200   dark:border-purple-800/50',
        orange:      'bg-orange-50   dark:bg-orange-950/50   text-orange-700   dark:text-orange-300   border-orange-200   dark:border-orange-800/50',

        // Solid variants
        'solid-primary':  'bg-primary-600 text-white border-transparent dark:bg-primary-500',
        'solid-success':  'bg-green-600   text-white border-transparent',
        'solid-warning':  'bg-yellow-500  text-white border-transparent',
        'solid-danger':   'bg-red-600     text-white border-transparent',
        'solid-info':     'bg-blue-600    text-white border-transparent',
      },
      size: {
        xs: 'px-1.5 py-0.5 text-[10px] leading-none',
        sm: 'px-2   py-0.5 text-xs',
        md: 'px-2.5 py-1   text-xs',
        lg: 'px-3   py-1.5 text-sm',
      },
      dot: {
        true: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'sm',
    },
  },
)

/* ─── Props ──────────────────────────────────────────────── */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

/* ─── Component ──────────────────────────────────────────── */
function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            getDotColor(variant),
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}

function getDotColor(variant: BadgeProps['variant']): string {
  const map: Record<string, string> = {
    default:  'bg-muted-foreground',
    primary:  'bg-primary-500',
    success:  'bg-green-500',
    warning:  'bg-yellow-500',
    danger:   'bg-red-500',
    info:     'bg-blue-500',
    purple:   'bg-purple-500',
    orange:   'bg-orange-500',
  }
  return map[variant ?? 'default'] ?? 'bg-muted-foreground'
}

/* ─── Domain Badges ──────────────────────────────────────── */
export function UserRoleBadge({ role }: { role: UserRole }) {
  const config: Record<UserRole, { label: string; variant: BadgeProps['variant'] }> = {
    admin:     { label: 'Administrador', variant: 'purple'  },
    assistant: { label: 'Assistente',    variant: 'info'    },
    instructor:{ label: 'Instrutor',     variant: 'orange'  },
    beneficiary:{ label: 'Usuário', variant: 'primary' },
  }
  const c = config[role] ?? { label: role, variant: 'default' as const }
  return <Badge variant={c.variant} dot>{c.label}</Badge>
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const config: Record<UserStatus, { label: string; variant: BadgeProps['variant'] }> = {
    active:         { label: 'Ativo',       variant: 'success' },
    inactive:       { label: 'Inativo',     variant: 'default' },
    blocked:        { label: 'Bloqueado',   variant: 'danger'  },
    pending_review: { label: 'Pendente',    variant: 'info'    },
  }
  const c = config[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={c.variant} dot>{c.label}</Badge>
}

export function EnrollmentStatusBadge({
  status,
  className,
}: {
  status: EnrollmentStatus
  className?: string
}) {
  const config: Record<EnrollmentStatus, { label: string; variant: BadgeProps['variant'] }> = {
    pending:    { label: 'Pendente',    variant: 'info'    },
    confirmed:  { label: 'Confirmado',  variant: 'success' },
    waitlisted: { label: 'Pendente',    variant: 'warning' },
    completed:  { label: 'Concluído',   variant: 'purple'  },
    cancelled:  { label: 'Cancelado',   variant: 'danger'  },
    rejected:   { label: 'Rejeitado',   variant: 'orange'  },
    dropped:    { label: 'Desistência', variant: 'default' },
    recovery:   { label: 'Recuperação', variant: 'warning' },
  }
  const c = config[status] ?? { label: status, variant: 'default' as const }
  return (
    <Badge
      variant={c.variant}
      size="sm"
      dot
      className={cn('h-7 shrink-0 px-2.5', className)}
    >
      {c.label}
    </Badge>
  )
}

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const config: Record<CourseStatus, { label: string; variant: BadgeProps['variant'] }> = {
    draft:    { label: 'Rascunho',  variant: 'default' },
    active:   { label: 'Ativo',     variant: 'success' },
    inactive: { label: 'Inativo',   variant: 'warning' },
    archived: { label: 'Arquivado', variant: 'default' },
  }
  const c = config[status] ?? { label: status, variant: 'default' as const }
  return (
    <Badge variant={c.variant} size="sm" dot className="h-7 shrink-0 px-2.5">
      {c.label}
    </Badge>
  )
}

export function ClassStatusBadge({ status }: { status: ClassStatus }) {
  const c = getClassStatusConfig(status)
  return (
    <Badge variant={c.variant} size="sm" dot className="h-7 shrink-0 px-2.5">
      {c.label}
    </Badge>
  )
}

export function ClassStatusCountChip({
  status,
  count,
}: {
  status: ClassStatus
  count: number
}) {
  const c = getClassStatusConfig(status)
  return (
    <Badge variant={c.variant} size="sm" dot className="h-7 shrink-0 px-2.5">
      {count} · {c.label}
    </Badge>
  )
}

function getClassStatusConfig(status: ClassStatus): {
  label: string
  variant: BadgeProps['variant']
} {
  const config: Record<ClassStatus, { label: string; variant: BadgeProps['variant'] }> = {
    planned:     { label: 'Planejada',    variant: 'default' },
    open:        { label: 'Aberta',       variant: 'info'    },
    in_progress: { label: 'Em andamento', variant: 'warning' },
    completed:   { label: 'Concluída',    variant: 'success' },
    cancelled:   { label: 'Cancelada',    variant: 'danger'  },
  }
  return config[status] ?? { label: status, variant: 'default' }
}

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const config: Record<AttendanceStatus, { label: string; variant: BadgeProps['variant'] }> = {
    present:   { label: 'Presente',    variant: 'success' },
    absent:    { label: 'Ausente',     variant: 'danger'  },
    justified: { label: 'Justificado', variant: 'warning' },
    late:      { label: 'Atrasado',    variant: 'info'    },
  }
  const c = config[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={c.variant} dot>{c.label}</Badge>
}

export function DataRequestStatusBadge({ status }: { status: DataRequestStatus }) {
  const config: Record<DataRequestStatus, { label: string; variant: BadgeProps['variant'] }> = {
    open:         { label: 'Aberta',       variant: 'info'    },
    in_review:    { label: 'Em Análise',   variant: 'warning' },
    waiting_user: { label: 'Aguardando você', variant: 'default' },
    completed:    { label: 'Concluída',    variant: 'success' },
    rejected:     { label: 'Rejeitada',    variant: 'danger'  },
    cancelled:    { label: 'Cancelada',    variant: 'default' },
  }
  const c = config[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={c.variant} dot>{c.label}</Badge>
}

// Backward-compat alias
export const LgpdStatusBadge = DataRequestStatusBadge

export { Badge, badgeVariants }

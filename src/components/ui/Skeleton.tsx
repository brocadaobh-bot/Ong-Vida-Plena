import { cn } from '@/lib/utils/cn'

/* ─── Base Skeleton ──────────────────────────────────────── */
interface SkeletonProps {
  className?: string
  'aria-label'?: string
}

export function Skeleton({ className, 'aria-label': label }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label ?? 'Carregando...'}
      className={cn('shimmer rounded-md bg-muted animate-pulse-soft', className)}
    />
  )
}

/* ─── Skeleton Text ──────────────────────────────────────── */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div role="status" aria-label="Carregando texto..." className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-4/5' : 'w-full',
          )}
        />
      ))}
    </div>
  )
}

/* ─── Skeleton Card ──────────────────────────────────────── */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Carregando cartão..."
      className={cn(
        'card p-5 space-y-4 animate-fade-in',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  )
}

/* ─── Skeleton Stat Card ─────────────────────────────────── */
export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Carregando estatística..."
      className={cn('card p-5 space-y-3', className)}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  )
}

/* ─── Skeleton Table ─────────────────────────────────────── */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Carregando tabela..."
      className={cn('space-y-3', className)}
    >
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 px-4 py-3 border-b border-border/50">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton
              key={col}
              className={cn('h-4 flex-1', col === 0 && 'max-w-[180px]')}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/* ─── Skeleton Avatar ────────────────────────────────────── */
export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' }
  return <Skeleton className={cn('rounded-full', sizes[size])} aria-label="Carregando avatar..." />
}

/* ─── Skeleton Form ──────────────────────────────────────── */
export function SkeletonForm({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-label="Carregando formulário..."
      className={cn('space-y-5', className)}
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  )
}

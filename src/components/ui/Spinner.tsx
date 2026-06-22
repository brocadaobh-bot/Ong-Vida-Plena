import { cn } from '@/lib/utils/cn'

/* ─── Spinner ────────────────────────────────────────────── */
interface SpinnerProps {
  size?:      'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  label?:     string
}

const sizeMap = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-2',
  xl: 'h-12 w-12 border-2',
}

export function Spinner({ size = 'md', className, label = 'Carregando...' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-block animate-spin rounded-full border-current border-r-transparent', sizeMap[size], className)}
    />
  )
}

/* ─── Full Page Loader ───────────────────────────────────── */
export function PageLoader({ text }: { text?: string }) {
  return (
    <div
      role="status"
      aria-label={text ?? 'Carregando página...'}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background"
    >
      {/* Animated logo mark */}
      <div className="relative">
        <div className="h-14 w-14 rounded-2xl bg-primary-600 dark:bg-primary-500 flex items-center justify-center shadow-soft-lg animate-bounce-soft">
          <span className="text-2xl font-bold text-white select-none">VP</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <Spinner size="sm" className="text-primary-600 dark:text-primary-400" />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  )
}

/* ─── Inline Loader ──────────────────────────────────────── */
export function InlineLoader({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div
      role="status"
      aria-label={text}
      className="flex items-center justify-center gap-2 py-8 text-muted-foreground"
    >
      <Spinner size="sm" />
      <span className="text-sm">{text}</span>
    </div>
  )
}

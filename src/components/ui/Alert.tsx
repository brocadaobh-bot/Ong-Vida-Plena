'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  X,
  type LucideIcon,
} from 'lucide-react'

/* ─── Variants ───────────────────────────────────────────── */
const alertVariants = cva(
  [
    'relative flex gap-3 rounded-xl border p-4',
    'text-sm',
  ],
  {
      variants: {
      variant: {
        default:  'bg-surface border-border text-foreground',
        info:     'bg-blue-50   dark:bg-blue-950/30  border-blue-200   dark:border-blue-800/60  text-blue-900   dark:text-blue-100',
        success:  'bg-green-50  dark:bg-green-950/30 border-green-200  dark:border-green-800/60 text-green-900  dark:text-green-100',
        warning:  'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800/60 text-yellow-900 dark:text-yellow-100',
        danger:   'bg-red-50    dark:bg-red-950/30   border-red-200    dark:border-red-800/60   text-red-900    dark:text-red-100',
        error:    'bg-red-50    dark:bg-red-950/30   border-red-200    dark:border-red-800/60   text-red-900    dark:text-red-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const iconVariants: Record<string, { icon: LucideIcon; color: string }> = {
  default: { icon: Info,           color: 'text-muted-foreground' },
  info:    { icon: Info,           color: 'text-blue-500   dark:text-blue-400' },
  success: { icon: CheckCircle2,   color: 'text-green-500  dark:text-green-400' },
  warning: { icon: AlertTriangle,  color: 'text-yellow-500 dark:text-yellow-400' },
  danger:  { icon: AlertCircle,    color: 'text-red-500    dark:text-red-400' },
  error:   { icon: AlertCircle,    color: 'text-red-500    dark:text-red-400' },
}

/* ─── Props ──────────────────────────────────────────────── */
export type AlertVariant = 'default' | 'info' | 'success' | 'warning' | 'danger' | 'error'

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?:       string
  message?:     string   // backward-compat: renders as children
  icon?:        LucideIcon
  dismissible?: boolean
  onDismiss?:   () => void
}

/* ─── Component ──────────────────────────────────────────── */
function Alert({
  className,
  variant = 'default',
  title,
  message,
  icon,
  dismissible,
  onDismiss,
  children,
  ...props
}: AlertProps) {
  const content = children ?? message
  const [dismissed, setDismissed] = React.useState(false)

  if (dismissed) return null

  const { icon: DefaultIcon, color } = iconVariants[variant ?? 'default']
  const Icon = icon ?? DefaultIcon

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(alertVariants({ variant }), 'animate-fade-in', className)}
      {...props}
    >
      {/* Icon */}
      <Icon
        className={cn('mt-0.5 h-4 w-4 shrink-0', color)}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold leading-tight mb-1">{title}</p>
        )}
        <div className="leading-relaxed opacity-90">{content}</div>
      </div>

      {/* Dismiss */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          aria-label="Fechar alerta"
          className={cn(
            'shrink-0 rounded-md p-0.5 -mr-1 -mt-0.5',
            'opacity-60 hover:opacity-100 transition-opacity',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

Alert.displayName = 'Alert'

/* ─── Shorthand components ───────────────────────────────── */
const AlertInfo    = (props: Omit<AlertProps, 'variant'>) => <Alert variant="info"    {...props} />
const AlertSuccess = (props: Omit<AlertProps, 'variant'>) => <Alert variant="success" {...props} />
const AlertWarning = (props: Omit<AlertProps, 'variant'>) => <Alert variant="warning" {...props} />
const AlertDanger  = (props: Omit<AlertProps, 'variant'>) => <Alert variant="danger"  {...props} />

export { Alert, AlertInfo, AlertSuccess, AlertWarning, AlertDanger, alertVariants }

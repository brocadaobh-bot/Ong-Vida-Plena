import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

/* ─── Card Variants ──────────────────────────────────────── */
const cardVariants = cva(
  'rounded-xl border bg-surface text-foreground transition-all duration-150 p-5 sm:p-6',
  {
    variants: {
      variant: {
        default:   'border-border shadow-[var(--shadow-sm)] dark:shadow-soft-sm',
        elevated:  'border-border shadow-[var(--shadow-md)] dark:shadow-soft-md',
        flat:      'border-border shadow-none',
        ghost:     'border-transparent shadow-none bg-transparent',
        outline:   'border-2 border-border shadow-none',
        highlight: 'border-primary-300 dark:border-primary-800/50 shadow-[var(--shadow-sm)] bg-primary-50/50 dark:bg-primary-950/20 dark:shadow-soft-sm',
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-soft-md hover:-translate-y-0.5 hover:border-border/80 dark:hover:border-border/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

/* ─── Card ───────────────────────────────────────────────── */
interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, interactive }), className)}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

/* ─── Card Header ────────────────────────────────────────── */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 px-5 pt-5 pb-0 sm:px-6 sm:pt-6', className)}
      {...props}
    />
  ),
)
CardHeader.displayName = 'CardHeader'

/* ─── Card Title ─────────────────────────────────────────── */
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-base font-semibold leading-none tracking-tight text-foreground', className)}
      {...props}
    />
  ),
)
CardTitle.displayName = 'CardTitle'

/* ─── Card Description ───────────────────────────────────── */
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  ),
)
CardDescription.displayName = 'CardDescription'

/* ─── Card Content ───────────────────────────────────────── */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-5 pb-5 sm:px-6 sm:pb-6', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

/* ─── Card Footer ────────────────────────────────────────── */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center px-5 pb-5 pt-0 sm:px-6 sm:pb-6', className)}
      {...props}
    />
  ),
)
CardFooter.displayName = 'CardFooter'

/* ─── Stat Card ──────────────────────────────────────────── */
interface StatCardProps {
  title:       string
  value:       string | number
  description?: string
  icon?:       LucideIcon | React.ReactNode
  iconColor?:  string
  trend?:      { value: number; label: string }
  className?:  string
  loading?:    boolean
  href?:       string
}

function renderStatIcon(icon: StatCardProps['icon']) {
  if (!icon) return null
  if (React.isValidElement(icon)) return icon
  const IconComponent = icon as LucideIcon
  return <IconComponent className="h-5 w-5" />
}

function StatCard({
  title,
  value,
  description,
  icon,
  iconColor = 'text-primary-600 dark:text-primary-400',
  trend,
  className,
  href,
}: StatCardProps) {
  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
      ? TrendingDown
      : Minus
    : null

  const trendColor = trend
    ? trend.value > 0
      ? 'text-green-600 dark:text-green-400'
      : trend.value < 0
      ? 'text-red-600 dark:text-red-400'
      : 'text-muted-foreground'
    : ''

  const content = (
    <Card
      className={cn(
        'p-5 group h-full min-h-[8.5rem]',
        href && 'cursor-pointer hover:border-primary-200 dark:hover:border-primary-800/50 hover:shadow-soft-sm transition-all duration-150',
        className,
      )}
    >
      <div className="flex h-full items-start justify-between gap-3">
        <div className="flex min-h-[5.5rem] flex-1 flex-col min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
          <div className="mt-auto min-h-[2.75rem] space-y-1">
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && TrendIcon && (
              <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
                <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{Math.abs(trend.value)}% {trend.label}</span>
              </div>
            )}
          </div>
        </div>
        {icon && (
            <div
            className={cn(
              'h-10 w-10 shrink-0 flex items-center justify-center rounded-xl',
              'bg-muted/80 border border-border/80 group-hover:scale-110 transition-transform duration-200',
              'dark:bg-muted dark:border-transparent',
              iconColor,
            )}
            aria-hidden="true"
          >
            {renderStatIcon(icon)}
          </div>
        )}
      </div>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        {content}
      </Link>
    )
  }

  return content
}

export {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  StatCard,
  cardVariants,
}

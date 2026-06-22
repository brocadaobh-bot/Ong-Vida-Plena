import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/* ─── Variants ───────────────────────────────────────────── */
const buttonVariants = cva(
  [
    // Base
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'text-sm font-semibold',
    'rounded-lg border border-transparent',
    'transition-all duration-150 ease-snappy',
    'select-none cursor-pointer',
    // Focus ring
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    // Disabled
    'disabled:pointer-events-none disabled:opacity-50',
    // Active press effect
    'active:scale-[0.97]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-600 text-white border-primary-600',
          'hover:bg-primary-700 hover:border-primary-700',
          'dark:bg-primary-700 dark:border-primary-700 dark:text-white',
          'dark:hover:bg-primary-600 dark:hover:border-primary-600',
          'shadow-soft-xs hover:shadow-soft-sm',
          '[&_svg]:text-white [&_svg]:opacity-95',
        ],
        secondary: [
          'bg-surface text-secondary-foreground border-border',
          'hover:bg-muted hover:text-foreground',
          'shadow-[var(--shadow-xs)] dark:shadow-none',
          'dark:bg-muted dark:text-foreground dark:border-border',
          'dark:hover:bg-muted/80 dark:hover:text-foreground',
        ],
        outline: [
          'bg-transparent text-foreground border-border',
          'hover:bg-accent hover:text-accent-foreground hover:border-border',
          'dark:border-border dark:text-foreground',
          'dark:hover:bg-muted dark:hover:text-foreground',
        ],
        ghost: [
          'bg-transparent text-foreground border-transparent',
          'hover:bg-accent hover:text-accent-foreground',
          'dark:text-foreground dark:hover:bg-muted dark:hover:text-foreground',
        ],
        destructive: [
          'bg-red-600 text-white border-red-600',
          'hover:bg-red-700 hover:border-red-700',
          'dark:bg-red-700 dark:border-red-700 dark:text-white',
          'dark:hover:bg-red-600 dark:hover:border-red-600',
          'shadow-soft-xs',
          '[&_svg]:text-white',
        ],
        'destructive-outline': [
          'bg-transparent text-red-600 border-red-200',
          'hover:bg-red-50 hover:border-red-300',
          'dark:text-red-400 dark:border-red-800',
          'dark:hover:bg-red-950/50',
        ],
        link: [
          'bg-transparent text-primary-600 border-transparent underline-offset-4',
          'hover:underline dark:text-primary-400',
          'h-auto! p-0!',
        ],
      },
      size: {
        xs:   'h-7  px-2.5 text-xs  gap-1.5 font-medium',
        sm:   'h-10 px-3 text-sm gap-1.5 sm:h-8',
        md:   'h-11 px-4 text-sm gap-2 sm:h-9',
        lg:   'h-11 px-5   text-sm  gap-2',
        xl:   'h-12 px-6   text-base gap-2.5',
        icon: 'h-9  w-9    p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-lg': 'h-11 w-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size:    'md',
    },
  },
)

/* ─── Props ──────────────────────────────────────────────── */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?:   boolean
  loading?:     boolean   // backward-compat alias for isLoading
  loadingText?: string
  leftIcon?:    React.ReactNode
  rightIcon?:   React.ReactNode
  asChild?:     boolean
}

/* ─── Component ──────────────────────────────────────────── */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      loading,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      children,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const effectiveLoading = isLoading || loading
    const isDisabled = disabled || effectiveLoading
    const classes = cn(buttonVariants({ variant, size }), className)

    if (asChild) {
      const child = React.Children.only(children) as React.ReactElement<{
        className?: string
        ref?: React.Ref<unknown>
      }>
      const { type: _type, ...slotProps } = props

      return React.cloneElement(child, {
        ...slotProps,
        className: cn(classes, child.props.className),
        ref,
      })
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={effectiveLoading}
        className={classes}
        {...props}
      >
        {effectiveLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {loadingText ?? children}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="shrink-0" aria-hidden="true">{leftIcon}</span>
            )}
            {children}
            {rightIcon && (
              <span className="shrink-0" aria-hidden="true">{rightIcon}</span>
            )}
          </>
        )}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }

import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'

/* ─── Props ──────────────────────────────────────────────── */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:        string
  error?:        string
  hint?:         string
  leftIcon?:     React.ReactNode
  rightIcon?:    React.ReactNode
  containerClass?:string
  required?:     boolean
}

/* ─── Input ──────────────────────────────────────────────── */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      id,
      type,
      leftIcon,
      rightIcon,
      containerClass,
      required,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const generatedId = React.useId()
    const inputId   = id ?? generatedId
    const errorId   = `${inputId}-error`
    const hintId    = `${inputId}-hint`
    const isPassword = type === 'password'
    const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type

    const hasLeft  = !!leftIcon
    const hasRight = !!rightIcon || isPassword || !!error

    return (
      <div className={cn('flex flex-col gap-1.5', containerClass)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-foreground leading-none',
              disabled && 'opacity-50',
            )}
          >
            {label}
            {required && (
              <span className="ml-1 text-red-500 dark:text-red-400" aria-hidden="true">*</span>
            )}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {hasLeft && (
            <div
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={
              [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
            }
            className={cn(
              // Base
              'w-full rounded-lg border bg-surface text-base sm:text-sm text-foreground',
              'placeholder:text-muted-foreground/60',
              'h-11 sm:h-9 px-3 py-2',
              'shadow-[var(--shadow-xs)] dark:shadow-none',
              // Transitions
              'transition-all duration-150',
              // Normal border
              'border-border',
              // Focus
              'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
              'dark:focus:border-primary-400 dark:focus:ring-primary-400/20',
              // Error
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500',
              // Disabled
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
              // Padding adjustments for icons
              hasLeft  && 'pl-9',
              hasRight && 'pr-9',
              className,
            )}
            {...props}
          />

          {/* Right icon area */}
          {hasRight && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
              {isPassword ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  tabIndex={-1}
                  className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                    : <Eye    className="h-4 w-4" aria-hidden="true" />}
                </button>
              ) : error ? (
                <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 pointer-events-none" aria-hidden="true" />
              ) : rightIcon ? (
                <span className="pointer-events-none text-muted-foreground" aria-hidden="true">
                  {rightIcon}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1 leading-snug">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {/* Hint message */}
        {!error && hint && (
          <p id={hintId} className="text-xs text-muted-foreground leading-snug">
            {hint}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }

/* ─── Textarea ───────────────────────────────────────────── */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:        string
  error?:        string
  hint?:         string
  containerClass?:string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, containerClass, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const errorId = `${inputId}-error`
    const hintId  = `${inputId}-hint`

    return (
      <div className={cn('flex flex-col gap-1.5', containerClass)}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={
            [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
          }
          className={cn(
            'w-full rounded-lg border bg-surface text-base sm:text-sm text-foreground',
            'placeholder:text-muted-foreground/60',
            'px-3 py-2 min-h-[100px] resize-y',
            'transition-all duration-150',
            'border-border',
            'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'

/* ─── Select ─────────────────────────────────────────────── */
export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:        string
  error?:        string
  hint?:         string
  containerClass?:string
  options?:      { value: string; label: string }[]
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ className, label, error, hint, id, options, children, containerClass, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const errorId = `${inputId}-error`

    return (
      <div className={cn('flex flex-col gap-1.5', containerClass)}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full rounded-lg border bg-surface text-base sm:text-sm text-foreground',
            'h-9 px-3 py-0',
            'transition-all duration-150',
            'border-border',
            'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            error && 'border-red-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'appearance-none',
            className,
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.5rem center',
            backgroundSize: '1rem',
            paddingRight: '2rem',
          }}
          {...props}
        >
          {options
            ? options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
            : children}
        </select>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
    )
  },
)
SelectField.displayName = 'SelectField'

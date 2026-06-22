'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'
import { cn } from '@/lib/utils/cn'

interface ThemeToggleProps {
  className?: string
  variant?:   'icon' | 'full'
}

function ThemeToggleFull({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="group"
      aria-label="Tema da interface"
      className={cn(
        'flex items-center gap-1 rounded-lg border border-border bg-muted p-1',
        className,
      )}
    >
      {(['light', 'dark', 'system'] as const).map(t => {
        const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Monitor
        const labels = { light: 'Claro', dark: 'Escuro', system: 'Sistema' }
        const active = theme === t

        return (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t)}
            aria-pressed={active}
            aria-label={`Tema ${labels[t]}`}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium',
              'transition-all duration-150',
              active
                ? 'bg-surface text-foreground shadow-soft-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {labels[t]}
          </button>
        )
      })}
    </div>
  )
}

export function ThemeToggle({ className, variant = 'icon' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        title={isDark ? 'Modo claro' : 'Modo escuro'}
        className={cn(
          'relative h-9 w-9 flex items-center justify-center rounded-lg',
          'text-muted-foreground hover:text-foreground hover:bg-accent',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className,
        )}
      >
        <Sun
          className={cn(
            'h-4 w-4 absolute transition-all duration-300',
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50',
          )}
          aria-hidden="true"
        />
        <Moon
          className={cn(
            'h-4 w-4 absolute transition-all duration-300',
            isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100',
          )}
          aria-hidden="true"
        />
      </button>
    )
  }

  return <ThemeToggleFull className={className} />
}

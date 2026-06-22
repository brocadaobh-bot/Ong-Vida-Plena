import Link from 'next/link'
import { X } from 'lucide-react'
import { buildAdminFilterClearUrl } from '@/lib/classes/turmas-filter'

export interface AdminFilter {
  key: string
  label: string
  value: string
  /** Nome do query param na URL (padrão: key) */
  param?: string
}

interface AdminFilterBarProps {
  filters: AdminFilter[]
  basePath: string
}

export function AdminFilterBar({ filters, basePath }: AdminFilterBarProps) {
  if (filters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">Filtros:</span>
      {filters.map(f => (
        <span
          key={f.key}
          className="inline-flex items-center gap-1 rounded-full bg-surface border border-border px-2.5 py-0.5 text-xs text-foreground"
        >
          {f.label}
          <Link
            href={buildAdminFilterClearUrl(basePath, filters, f.key)}
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Remover filtro ${f.label}`}
          >
            <X className="h-3 w-3" />
          </Link>
        </span>
      ))}
      <Link href={basePath} className="text-xs text-primary-600 underline dark:text-primary-400 ml-1">
        Limpar tudo
      </Link>
    </div>
  )
}

interface AdminNavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function AdminNavLink({ href, children, className }: AdminNavLinkProps) {
  return (
    <Link
      href={href}
      className={`font-medium text-primary-600 hover:underline dark:text-primary-400 ${className ?? ''}`}
    >
      {children}
    </Link>
  )
}

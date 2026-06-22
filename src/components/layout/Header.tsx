'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  Menu,
  Settings,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LogoutButton } from '@/components/auth/LogoutButton'
import type { UserRole } from '@/types/database'

/* ─── Role Labels ────────────────────────────────────────── */
const ROLE_LABELS: Record<UserRole, string> = {
  admin:      'Administrador',
  assistant:  'Assistente',
  instructor: 'Instrutor',
  beneficiary:'Usuário',
}

/* ─── Avatar ─────────────────────────────────────────────── */
function Avatar({
  name,
  size = 'md',
}: {
  name?: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const initials = name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') ?? '?'

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-xs',
    lg: 'h-10 w-10 text-sm',
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold',
        'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300',
        'border border-primary-200 dark:border-primary-800/50',
        'select-none shrink-0',
        sizeClasses[size],
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

/* ─── User Menu ──────────────────────────────────────────── */
function UserMenu({
  userName,
  userEmail,
  userRole,
}: {
  userName?:  string | null
  userEmail?: string | null
  userRole?:  UserRole
}) {
  const [open, setOpen] = useState(false)

  const dashboardHref =
    userRole === 'admin'      ? '/admin' :
    userRole === 'assistant'  ? '/assistente' :
    userRole === 'instructor' ? '/instrutor' :
                                '/beneficiario'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Menu do usuário"
        className={cn(
          'flex items-center gap-2 rounded-lg px-2 py-1.5',
          'text-sm text-foreground',
          'hover:bg-accent transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        )}
      >
        <Avatar name={userName} />
        <div className="hidden min-w-0 flex-col justify-center gap-0.5 text-left sm:flex">
          <p className="max-w-[120px] truncate text-sm font-medium leading-tight text-foreground">
            {userName ?? 'Usuário'}
          </p>
          {userRole && (
            <p className="text-[10px] leading-tight text-muted-foreground">
              {ROLE_LABELS[userRole]}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            aria-label="Opções do usuário"
            className={cn(
              'absolute right-0 top-full mt-1 z-20 w-56',
              'bg-surface border border-border rounded-xl shadow-soft-lg',
              'py-1',
              'animate-scale-in',
            )}
          >
            {/* User info */}
            <div className="px-3 py-2.5 border-b border-border">
              <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>

            {/* Menu items */}
            <div className="p-1">
              <MenuLink
                href={`${dashboardHref}/perfil`}
                icon={User}
                label="Meu Perfil"
                onClick={() => setOpen(false)}
              />
              {(userRole === 'admin') && (
                <MenuLink
                  href="/admin/configuracoes"
                  icon={Settings}
                  label="Configurações"
                  onClick={() => setOpen(false)}
                />
              )}
            </div>

            {/* Logout */}
            <div className="border-t border-border p-1">
              <LogoutButton />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href:    string
  icon:    React.ElementType
  label:   string
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2',
        'text-sm font-medium text-foreground',
        'hover:bg-accent transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      {label}
    </Link>
  )
}

/* ─── Main Header ────────────────────────────────────────── */
interface HeaderProps {
  title?:      string
  onMenuClick: () => void
  userName?:   string | null
  userEmail?:  string | null
  userRole?:   UserRole
}

export function Header({
  title,
  onMenuClick,
  userName,
  userEmail,
  userRole,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3',
        'border-b border-border',
        'bg-surface/95 backdrop-blur-sm shadow-[var(--shadow-xs)] dark:shadow-none',
        'px-4 sm:px-6',
      )}
      aria-label="Cabeçalho da aplicação"
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        aria-label="Abrir menu de navegação"
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg lg:hidden',
          'text-muted-foreground hover:text-foreground hover:bg-accent',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Page title */}
      {title && (
        <h1 className="hidden min-w-0 flex-1 truncate text-sm font-semibold text-foreground sm:block">
          {title}
        </h1>
      )}

      <div className="flex-1" aria-hidden="true" />

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle />

        <UserMenu
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
        />
      </div>
    </header>
  )
}

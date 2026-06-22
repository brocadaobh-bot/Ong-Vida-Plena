'use client'

import { useState } from 'react'
import { DesktopSidebar, MobileSidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils/cn'
import type { UserRole } from '@/types/database'

interface DashboardLayoutProps {
  children:   React.ReactNode
  role:       UserRole
  userName?:  string | null
  userEmail?: string | null
  title?:     string
  navBadges?: Record<string, number | string>
}

export function DashboardLayout({
  children,
  role,
  userName,
  userEmail,
  title,
  navBadges,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-dvh h-dvh overflow-hidden bg-background" data-vaul-drawer-wrapper>
      {/* Desktop Sidebar */}
      <DesktopSidebar
        role={role}
        userName={userName ?? undefined}
        userEmail={userEmail ?? undefined}
        navBadges={navBadges}
      />

      {/* Mobile Sidebar */}
      <MobileSidebar
        role={role}
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navBadges={navBadges}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header
          title={title}
          onMenuClick={() => setMobileOpen(true)}
          userName={userName}
          userEmail={userEmail}
          userRole={role}
        />

        {/* Page content */}
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'flex-1 overflow-y-auto scrollbar-thin',
            'bg-background',
            'focus-visible:outline-none',
          )}
          aria-label="Conteúdo principal"
        >
          {/* Skip to content target */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
          >
            Ir para o conteúdo principal
          </a>

          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

/* ─── Page Header ────────────────────────────────────────── */
interface PageHeaderProps {
  title:        string
  description?: string
  actions?:     React.ReactNode
  breadcrumb?:  { label: string; href?: string }[]
  className?:   string
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="space-y-1">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Trilha de navegação" className="flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden="true">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-bold text-foreground tracking-tight sm:text-2xl">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}

/* ─── Section ────────────────────────────────────────────── */
export function Section({
  children,
  className,
}: {
  children:  React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-4', className)}>
      {children}
    </section>
  )
}

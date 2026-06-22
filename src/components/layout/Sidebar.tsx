'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  BarChart2,
  Settings,
  Shield,
  FileText,
  GraduationCap,
  Calendar,
  UserCheck,
  UserCog,
  Lock,
  Award,
  ChevronRight,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { UserRole } from '@/types/database'

/* ─── Types ──────────────────────────────────────────────── */
interface NavItem {
  href:    string
  label:   string
  icon:    LucideIcon
  badge?:  string | number
  end?:    boolean
}

interface NavGroup {
  label?:   string
  items:    NavItem[]
}

/* ─── Navigation by role ─────────────────────────────────── */
const NAV_CONFIG: Record<UserRole, NavGroup[]> = {
  admin: [
    {
      items: [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      ],
    },
    {
      label: 'Gestão',
      items: [
        { href: '/admin/usuarios',      label: 'Papéis e Acesso', icon: UserCog      },
        { href: '/admin/beneficiarios', label: 'Usuários',        icon: UserCheck    },
        { href: '/admin/cursos',        label: 'Cursos',       icon: BookOpen     },
        { href: '/admin/turmas',        label: 'Turmas',       icon: Calendar     },
        { href: '/admin/inscricoes',    label: 'Inscrições',   icon: ClipboardList},
      ],
    },
    {
      label: 'Análise',
      items: [
        { href: '/admin/relatorios',    label: 'Relatórios',   icon: BarChart2    },
        { href: '/admin/lgpd',          label: 'LGPD',         icon: Shield       },
        { href: '/admin/auditoria',     label: 'Auditoria',    icon: FileText     },
      ],
    },
    {
      label: 'Sistema',
      items: [
        { href: '/admin/configuracoes', label: 'Configurações', icon: Settings    },
      ],
    },
  ],
  assistant: [
    {
      items: [
        { href: '/assistente', label: 'Dashboard', icon: LayoutDashboard, end: true },
      ],
    },
    {
      label: 'Operações',
      items: [
        { href: '/assistente/beneficiarios', label: 'Usuários',icon: UserCheck    },
        { href: '/assistente/cursos',        label: 'Cursos',       icon: BookOpen     },
        { href: '/assistente/turmas',       label: 'Turmas',       icon: Calendar     },
        { href: '/assistente/inscricoes',    label: 'Inscrições',   icon: ClipboardList},
        { href: '/assistente/relatorios',    label: 'Relatórios',   icon: BarChart2    },
        { href: '/assistente/lgpd',          label: 'LGPD',         icon: Shield       },
      ],
    },
  ],
  instructor: [
    {
      items: [
        { href: '/instrutor', label: 'Dashboard', icon: LayoutDashboard, end: true },
      ],
    },
    {
      label: 'Minhas Turmas',
      items: [
        { href: '/instrutor/turmas',    label: 'Turmas',    icon: Calendar      },
        { href: '/instrutor/alunos',    label: 'Alunos',    icon: Users         },
        { href: '/instrutor/presencas', label: 'Presenças', icon: ClipboardList },
      ],
    },
  ],
  beneficiary: [
    {
      items: [
        { href: '/beneficiario', label: 'Início', icon: LayoutDashboard, end: true },
      ],
    },
    {
      label: 'Capacitação',
      items: [
        { href: '/beneficiario/cursos',         label: 'Cursos',            icon: GraduationCap },
        { href: '/beneficiario/inscricoes',     label: 'Minhas Inscrições', icon: ClipboardList },
        { href: '/beneficiario/presencas',      label: 'Presenças',         icon: UserCheck      },
        { href: '/beneficiario/boletim',        label: 'Boletim',           icon: FileText       },
        { href: '/beneficiario/certificados',   label: 'Certificados',      icon: Award          },
        { href: '/beneficiario/historico',      label: 'Histórico',         icon: BookOpen       },
      ],
    },
    {
      label: 'Privacidade',
      items: [
        { href: '/beneficiario/lgpd',           label: 'Meus Dados',    icon: Lock   },
        { href: '/beneficiario/consentimentos', label: 'Consentimentos',icon: Shield },
      ],
    },
  ],
}

/* ─── Logo ───────────────────────────────────────────────── */
function BrandLogo({ showText }: { showText: boolean }) {
  return (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 shadow-soft-sm dark:bg-primary-500">
        <span className="text-xs font-bold leading-none text-white">VP</span>
      </div>
      {showText && (
        <div className="flex min-w-0 flex-col justify-center gap-0.5">
          <p className="truncate text-sm font-bold leading-tight text-foreground">Vida Plena</p>
          <p className="truncate text-[10px] leading-tight text-muted-foreground">Gestão de Usuários</p>
        </div>
      )}
    </>
  )
}

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        'flex h-14 shrink-0 items-center border-b border-border',
        collapsed ? 'justify-center px-2' : 'gap-3 px-4',
      )}
    >
      <BrandLogo showText={!collapsed} />
    </div>
  )
}

/* ─── Nav Item ───────────────────────────────────────────── */
function NavItemComponent({
  item,
  collapsed,
  onClick,
}: {
  item:      NavItem
  collapsed: boolean
  onClick?:  () => void
}) {
  const pathname = usePathname()
  const isActive = item.end
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + '/')
  const isUnreadBadge = typeof item.badge === 'number' && item.badge > 0

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        isActive
          ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        collapsed && 'justify-center px-2',
      )}
    >
      <item.icon
        className={cn(
          'shrink-0 transition-transform duration-150',
          collapsed ? 'h-5 w-5' : 'h-4 w-4',
          isActive ? 'text-primary-600 dark:text-primary-400' : 'group-hover:scale-110',
        )}
        aria-hidden="true"
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span
              className={cn(
                'ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold',
                isUnreadBadge
                  ? 'bg-red-500 text-white'
                  : 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
              )}
            >
              {item.badge}
            </span>
          )}
          {isActive && (
            <ChevronRight className="h-3 w-3 text-primary-500 dark:text-primary-400 shrink-0" aria-hidden="true" />
          )}
        </>
      )}
      {collapsed && isUnreadBadge && (
        <span
          className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-surface"
          aria-label="Nova mensagem"
        />
      )}
    </Link>
  )
}

/* ─── Sidebar Content ────────────────────────────────────── */
interface SidebarContentProps {
  role:       UserRole
  collapsed?: boolean
  onNavClick?:() => void
  navBadges?: Record<string, number | string>
}

function SidebarContent({ role, collapsed = false, onNavClick, navBadges }: SidebarContentProps) {
  const groups = NAV_CONFIG[role] ?? []

  return (
    <nav
      aria-label="Menu principal"
      className={cn('flex-1 overflow-y-auto py-3 scrollbar-thin', collapsed ? 'px-1' : 'px-3')}
    >
      {groups.map((group, gi) => (
        <div key={gi} className={cn('mb-1', gi > 0 && 'mt-4')}>
          {group.label && !collapsed && (
            <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {group.label}
            </p>
          )}
          {group.label && collapsed && (
            <div className="my-2 border-t border-border/50" aria-hidden="true" />
          )}
          <ul role="list" className="space-y-0.5">
            {group.items.map(item => {
              const badge = navBadges?.[item.href] ?? item.badge
              return (
                <li key={item.href}>
                  <NavItemComponent
                    item={badge ? { ...item, badge } : item}
                    collapsed={collapsed}
                    onClick={onNavClick}
                  />
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

/* ─── Desktop Sidebar ────────────────────────────────────── */
interface DesktopSidebarProps {
  role:      UserRole
  userName?: string
  userEmail?:string
  navBadges?: Record<string, number | string>
}

export function DesktopSidebar({ role, userName, userEmail, navBadges }: DesktopSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      aria-label="Navegação lateral"
      className={cn(
        'hidden lg:flex flex-col h-dvh sticky top-0',
        'bg-surface border-r border-border shadow-[var(--shadow-sm)] dark:shadow-none',
        'transition-all duration-200 ease-spring',
        collapsed ? 'w-14' : 'w-60',
      )}
    >
      <SidebarLogo collapsed={collapsed} />
      <SidebarContent role={role} collapsed={collapsed} navBadges={navBadges} />

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir' : 'Recolher'}
          className={cn(
            'w-full flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-muted-foreground',
            'hover:bg-accent hover:text-foreground transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            collapsed && 'justify-center',
          )}
        >
          <ChevronRight
            className={cn('h-4 w-4 transition-transform duration-200', collapsed ? 'rotate-0' : 'rotate-180')}
            aria-hidden="true"
          />
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>

      {/* User info footer */}
      {!collapsed && (userName || userEmail) && (
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs font-medium text-foreground truncate">{userName}</p>
          <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
        </div>
      )}
    </aside>
  )
}

/* ─── Mobile Sidebar (drawer) ────────────────────────────── */
interface MobileSidebarProps {
  role:      UserRole
  isOpen:    boolean
  onClose:   () => void
  navBadges?: Record<string, number | string>
}

export function MobileSidebar({ role, isOpen, onClose, navBadges }: MobileSidebarProps) {
  const [mounted, setMounted] = React.useState(false)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  React.useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!mounted) return null

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden',
          'transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[min(18rem,85vw)] flex flex-col',
          'pb-[env(safe-area-inset-bottom)]',
          'bg-surface border-r border-border shadow-soft-xl',
          'lg:hidden',
          'transition-transform duration-300 ease-spring',
          visible ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo showText />
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <SidebarContent role={role} onNavClick={onClose} navBadges={navBadges} />
      </aside>
    </>
  )
}

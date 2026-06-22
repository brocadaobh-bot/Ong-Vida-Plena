'use client'

import { useTransition } from 'react'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { logoutAction } from '@/server/actions/auth'

interface LogoutButtonProps {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logoutAction()
    })
  }

  return (
    <button
      type="button"
      role="menuitem"
      disabled={isPending}
      onClick={handleLogout}
      className={cn(
        'w-full flex items-center gap-2.5 rounded-lg px-3 py-2',
        'text-sm font-medium text-red-600 dark:text-red-400',
        'hover:bg-red-50 dark:hover:bg-red-950/30',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        className,
      )}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {isPending ? 'Saindo…' : 'Sair'}
    </button>
  )
}

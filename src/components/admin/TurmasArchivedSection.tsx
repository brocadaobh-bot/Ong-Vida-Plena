'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TurmasArchivedSectionProps {
  count: number
  colSpan?: number
  children: React.ReactNode
}

export function TurmasArchivedSection({
  count,
  colSpan = 8,
  children,
}: TurmasArchivedSectionProps) {
  const [open, setOpen] = useState(false)

  if (count === 0) return null

  return (
    <>
      <tr className="bg-muted/40">
        <td colSpan={colSpan} className="p-0">
          <button
            type="button"
            onClick={() => setOpen(prev => !prev)}
            aria-expanded={open}
            className={cn(
              'flex w-full items-center gap-2 px-4 py-2.5',
              'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
              'transition-colors hover:bg-muted/60',
            )}
          >
            <ChevronDown
              className={cn('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-180')}
              aria-hidden
            />
            Turmas encerradas ({count})
          </button>
        </td>
      </tr>
      {open && children}
    </>
  )
}

import * as React from 'react'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from './Button'

/* ─── Table Primitives ───────────────────────────────────── */
const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  ),
)
Table.displayName = 'Table'

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b border-border', className)} {...props} />
  ),
)
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn('[&_tr:last-child]:border-0 divide-y divide-border', className)}
      {...props}
    />
  ),
)
TableBody.displayName = 'TableBody'

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn('border-t border-border bg-muted/40 font-medium', className)}
      {...props}
    />
  ),
)
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border/50 transition-colors duration-100',
        'hover:bg-muted/40 dark:hover:bg-muted/20',
        'data-[state=selected]:bg-primary-50 dark:data-[state=selected]:bg-primary-950/30',
        className,
      )}
      {...props}
    />
  ),
)
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-10 px-4 text-left align-middle',
        'text-xs font-semibold text-muted-foreground uppercase tracking-wide',
        'whitespace-nowrap',
        '[&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  ),
)
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'px-4 py-3 align-middle text-sm text-foreground',
        '[&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  ),
)
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  ),
)
TableCaption.displayName = 'TableCaption'

/* ─── Sortable Column Header ─────────────────────────────── */
interface SortableHeaderProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sorted?:   'asc' | 'desc' | false
  onSort?:   () => void
  children:  React.ReactNode
}

function SortableHeader({ sorted, onSort, children, className, ...props }: SortableHeaderProps) {
  return (
    <TableHead className={cn('cursor-pointer select-none group', className)} {...props}>
      <button
        onClick={onSort}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
        aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
      >
        {children}
        {sorted === 'asc'  ? <ChevronUp   className="h-3 w-3 text-primary-500" aria-hidden="true" /> :
         sorted === 'desc' ? <ChevronDown className="h-3 w-3 text-primary-500" aria-hidden="true" /> :
                             <ChevronsUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />}
      </button>
    </TableHead>
  )
}

/* ─── Pagination ─────────────────────────────────────────── */
interface PaginationProps {
  currentPage:  number
  totalPages:   number
  totalItems:   number
  pageSize:     number
  onPageChange: (page: number) => void
  className?:   string
}

function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  const start = (currentPage - 1) * pageSize + 1
  const end   = Math.min(currentPage * pageSize, totalItems)

  const pages = React.useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (currentPage > 3) pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }, [currentPage, totalPages])

  if (totalPages <= 1) return null

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3',
        'px-4 py-3 border-t border-border',
        className,
      )}
      aria-label="Paginação"
    >
      {/* Info */}
      <p className="text-xs text-muted-foreground order-2 sm:order-1">
        Mostrando <span className="font-medium text-foreground">{start}–{end}</span> de{' '}
        <span className="font-medium text-foreground">{totalItems}</span> resultado{totalItems !== 1 ? 's' : ''}
      </p>

      {/* Controls */}
      <nav aria-label="Páginas" className="flex items-center gap-1 order-1 sm:order-2">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-sm">…</span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? 'primary' : 'ghost'}
              size="icon-sm"
              onClick={() => onPageChange(page as number)}
              aria-label={`Página ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  )
}

export {
  Table, TableHeader, TableBody, TableFooter, TableRow,
  TableHead, TableCell, TableCaption,
  SortableHeader, TablePagination,
}

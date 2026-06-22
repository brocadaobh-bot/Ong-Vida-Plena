'use client'

import * as React from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from './Button'

/* ─── Backdrop ───────────────────────────────────────────── */
function Backdrop({
  onClick,
  visible,
}: {
  onClick?: () => void
  visible:  boolean
}) {
  return (
    <div
      aria-hidden="true"
      onClick={onClick}
      className={cn(
        'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm',
        'transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    />
  )
}

/* ─── Modal ──────────────────────────────────────────────── */
export interface ModalProps {
  isOpen:             boolean
  onClose:            () => void
  title?:             string
  description?:       string
  children?:          React.ReactNode
  footer?:            React.ReactNode
  size?:              'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnBackdrop?:   boolean
  showCloseButton?:   boolean
  className?:         string
  contentClassName?:  string
}

const sizeMap = {
  xs:   'max-w-xs',
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-2xl',
  full: 'max-w-[calc(100vw-1.5rem)] sm:max-w-[calc(100vw-3rem)]',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  showCloseButton = true,
  className,
  contentClassName,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 200)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // Keyboard dismiss
  React.useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Body scroll lock
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!mounted) return null

  return (
    <>
      <Backdrop onClick={closeOnBackdrop ? onClose : undefined} visible={visible} />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-desc' : undefined}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 pointer-events-none"
      >
        <div
          className={cn(
            'pointer-events-auto w-full max-h-[min(90dvh,100%)] flex flex-col',
            sizeMap[size],
            'bg-surface rounded-t-2xl sm:rounded-2xl border border-border',
            'shadow-soft-xl',
            'transition-all duration-200 ease-spring',
            visible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95',
            className,
          )}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex shrink-0 items-start justify-between gap-4 px-4 pt-4 sm:px-5 sm:pt-5">
              <div className="flex-1">
                {title && (
                  <h2
                    id="modal-title"
                    className="text-base font-semibold text-foreground leading-tight"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="modal-desc" className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  aria-label="Fechar modal"
                  className={cn(
                    'flex-shrink-0 -mr-1 -mt-1 h-8 w-8 flex items-center justify-center',
                    'rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent',
                    'transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={cn('flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5', contentClassName)}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-4 sm:px-5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ─── Confirm Modal ──────────────────────────────────────── */
export interface ConfirmModalProps {
  isOpen:          boolean
  onClose:         () => void
  onConfirm:       () => void | Promise<void>
  title:           string
  description:     string
  confirmText?:    string
  cancelText?:     string
  variant?:        'danger' | 'warning' | 'primary'
  isLoading?:      boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading,
}: ConfirmModalProps) {
  const [loading, setLoading] = React.useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  const btnVariant =
    variant === 'danger'
      ? 'destructive'
      : variant === 'warning'
      ? 'outline'
      : 'primary'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading || isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={btnVariant as 'primary' | 'destructive' | 'outline'}
            size="sm"
            onClick={handleConfirm}
            isLoading={loading || isLoading}
            loadingText="Aguarde..."
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            variant === 'danger'  && 'bg-red-50    dark:bg-red-950/50  text-red-600    dark:text-red-400',
            variant === 'warning' && 'bg-yellow-50 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400',
            variant === 'primary' && 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400',
          )}
          aria-hidden="true"
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Drawer (mobile) ────────────────────────────────────── */
export interface DrawerProps {
  isOpen:    boolean
  onClose:   () => void
  title?:    string
  children?: React.ReactNode
  side?:     'left' | 'right' | 'bottom'
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  side = 'right',
}: DrawerProps) {
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

  const slideClass = {
    right:  visible ? 'translate-x-0' : 'translate-x-full',
    left:   visible ? 'translate-x-0' : '-translate-x-full',
    bottom: visible ? 'translate-y-0' : 'translate-y-full',
  }[side]

  const posClass = {
    right:  'right-0 top-0 h-full w-full max-w-xs',
    left:   'left-0  top-0 h-full w-full max-w-xs',
    bottom: 'bottom-0 left-0 right-0 w-full max-h-[85vh] rounded-t-2xl',
  }[side]

  return (
    <>
      <Backdrop onClick={onClose} visible={visible} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'fixed z-50 bg-surface border-border shadow-soft-xl',
          'transition-transform duration-300 ease-spring',
          posClass,
          slideClass,
          side !== 'bottom' && 'border-l overflow-y-auto',
          side === 'bottom' && 'border-t overflow-y-auto',
        )}
      >
        {title && (
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-border bg-surface/95 backdrop-blur-sm">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </>
  )
}

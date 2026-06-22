'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/* ─── Types ──────────────────────────────────────────────── */
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface Toast {
  id:          string
  type:        ToastType
  title:       string
  description?: string
  duration?:   number   // ms; 0 = persistent
  action?:     { label: string; onClick: () => void }
}

interface ToastContextValue {
  toast:   (opts: Omit<Toast, 'id'>) => string
  dismiss: (id: string) => void
  success: (title: string, description?: string) => string
  error:   (title: string, description?: string) => string
  warning: (title: string, description?: string) => string
  info:    (title: string, description?: string) => string
  loading: (title: string, description?: string) => string
}

/* ─── Context ────────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

/* ─── Provider ───────────────────────────────────────────── */
const DEFAULTS: Record<ToastType, number> = {
  success: 4000,
  error:   6000,
  warning: 5000,
  info:    4000,
  loading: 0,
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((opts: Omit<Toast, 'id'>): string => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts(prev => [...prev.slice(-4), { ...opts, id }])
    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = useCallback((title: string, description?: string) =>
    toast({ type: 'success', title, description }), [toast])
  const error = useCallback((title: string, description?: string) =>
    toast({ type: 'error', title, description }), [toast])
  const warning = useCallback((title: string, description?: string) =>
    toast({ type: 'warning', title, description }), [toast])
  const info = useCallback((title: string, description?: string) =>
    toast({ type: 'info', title, description }), [toast])
  const loading = useCallback((title: string, description?: string) =>
    toast({ type: 'loading', title, description }), [toast])

  return (
    <ToastContext.Provider value={{ toast, dismiss, success, error, warning, info, loading }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

/* ─── Container ──────────────────────────────────────────── */
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts:    Toast[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="assertive"
      aria-label="Notificações"
      className="fixed bottom-0 right-0 z-[9999] flex flex-col gap-2 p-4 sm:p-6 max-w-sm w-full pointer-events-none"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

/* ─── Toast Item ─────────────────────────────────────────── */
const ICON_MAP: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
  loading: Loader2,
}

const STYLE_MAP: Record<ToastType, string> = {
  success: 'border-green-200   dark:border-green-800/60   bg-green-50   dark:bg-green-950/60',
  error:   'border-red-200     dark:border-red-800/60     bg-red-50     dark:bg-red-950/60',
  warning: 'border-yellow-200  dark:border-yellow-800/60  bg-yellow-50  dark:bg-yellow-950/60',
  info:    'border-blue-200    dark:border-blue-800/60    bg-blue-50    dark:bg-blue-950/60',
  loading: 'border-border                                 bg-surface',
}

const ICON_COLOR: Record<ToastType, string> = {
  success: 'text-green-600  dark:text-green-400',
  error:   'text-red-600    dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info:    'text-blue-600   dark:text-blue-400',
  loading: 'text-muted-foreground',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Mount → trigger animation
    const frame = requestAnimationFrame(() => setVisible(true))
    const duration = toast.duration ?? DEFAULTS[toast.type]
    if (duration > 0) {
      timerRef.current = setTimeout(() => handleDismiss(), duration)
    }
    return () => {
      cancelAnimationFrame(frame)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => onDismiss(toast.id), 200)
  }

  const Icon = ICON_MAP[toast.type]

  return (
    <div
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4',
        'shadow-soft-lg backdrop-blur-sm',
        'transition-all duration-200 ease-spring',
        STYLE_MAP[toast.type],
        visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-4 scale-95',
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 h-5 w-5 shrink-0',
          ICON_COLOR[toast.type],
          toast.type === 'loading' && 'animate-spin',
        )}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            onClick={() => { toast.action!.onClick(); handleDismiss() }}
            className="mt-2 text-xs font-medium underline underline-offset-2 text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      {toast.type !== 'loading' && (
        <button
          onClick={handleDismiss}
          aria-label="Fechar notificação"
          className={cn(
            'shrink-0 rounded-md p-0.5 transition-colors',
            'text-muted-foreground hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

// ─── Single Toast ─────────────────────────────────────────────────────────────

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const duration = item.variant === 'success' ? 4000 : 6000
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(item.id), duration)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [item.id, duration, onDismiss])

  const isSuccess = item.variant === 'success'

  return (
    <div
      className={`flex items-start gap-3 w-80 bg-white border rounded-md shadow-md px-4 py-3 text-sm ${
        isSuccess ? 'border-green-200' : 'border-rose-200'
      }`}
    >
      {isSuccess
        ? <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
        : <XCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
      }
      <span className="flex-1 text-zinc-700 leading-snug">{item.message}</span>
      <button
        onClick={() => onDismiss(item.id)}
        className="text-zinc-400 hover:text-zinc-600 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, message, variant }])
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Top-right toast stack */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard item={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

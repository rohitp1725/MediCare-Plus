import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'

type ToastVariant = 'success' | 'warning' | 'danger' | 'info'

interface Toast {
  id: string
  variant: ToastVariant
  title: string
  message?: string
}

interface ToastContextValue {
  show: (variant: ToastVariant, title: string, message?: string) => void
  success: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  danger: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const VARIANT_STYLES: Record<ToastVariant, { border: string; bg: string; icon: typeof CheckCircle2; iconColor: string }> = {
  success: { border: 'border-l-sage', bg: 'bg-[#EAF4F1]', icon: CheckCircle2, iconColor: 'text-sage-dark' },
  warning: { border: 'border-l-amber', bg: 'bg-[#FEF3E2]', icon: AlertTriangle, iconColor: 'text-[#8B5000]' },
  danger: { border: 'border-l-rose', bg: 'bg-[#FDECEA]', icon: XCircle, iconColor: 'text-[#8B2020]' },
  info: { border: 'border-l-lavender', bg: 'bg-[#F0ECF8]', icon: Info, iconColor: 'text-[#4A3870]' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (variant: ToastVariant, title: string, message?: string) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, variant, title, message }])
      window.setTimeout(() => dismiss(id), 5000)
    },
    [dismiss]
  )

  const value: ToastContextValue = {
    show,
    success: (title, message) => show('success', title, message),
    warning: (title, message) => show('warning', title, message),
    danger: (title, message) => show('danger', title, message),
    info: (title, message) => show('info', title, message),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-5 right-5 z-[1000] flex flex-col gap-2 w-[340px] max-w-[90vw]">
        <AnimatePresence>
          {toasts.map((t) => {
            const style = VARIANT_STYLES[t.variant]
            const Icon = style.icon
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start gap-3 rounded-md border-l-[3px] ${style.border} ${style.bg} p-4 shadow-md`}
              >
                <Icon size={20} className={`${style.iconColor} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{t.title}</p>
                  {t.message && <p className="text-xs text-slate-light mt-0.5">{t.message}</p>}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-slate-light hover:text-ink shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

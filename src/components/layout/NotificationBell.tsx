import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, AlertTriangle, XCircle, Info, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNotifications } from '@/hooks/useNotifications'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'

const SEVERITY_ICON: Record<string, typeof AlertTriangle> = {
  critical: XCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'text-rose',
  warning: 'text-amber',
  info: 'text-lavender',
  success: 'text-sage',
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data: notifications, isLoading, markAsRead } = useNotifications(8)
  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 rounded-full bg-cream hover:bg-border flex items-center justify-center transition-colors"
        aria-label="Notifications"
      >
        <Bell size={19} className="text-slate" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-rose text-white text-[10px] font-semibold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-[340px] max-h-[420px] overflow-y-auto bg-paper border border-border rounded-md shadow-lg z-50"
            >
              <div className="px-4 py-3 border-b border-border">
                <h4 className="text-sm font-semibold text-ink">Notifications</h4>
              </div>
              {isLoading && (
                <div className="flex justify-center py-8">
                  <Spinner size={20} className="text-sage" />
                </div>
              )}
              {!isLoading && (!notifications || notifications.length === 0) && (
                <EmptyState icon="🔔" title="You're all caught up" description="No notifications yet." />
              )}
              {notifications?.map((n) => {
                const Icon = SEVERITY_ICON[n.severity] ?? Info
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.is_read && markAsRead.mutate(n.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left border-b border-border last:border-b-0 transition-colors hover:bg-cream ${
                      n.is_read ? 'opacity-60' : ''
                    }`}
                  >
                    <Icon size={17} className={`${SEVERITY_COLOR[n.severity] ?? 'text-slate-light'} mt-0.5 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-ink leading-snug">{n.title}</p>
                      {n.message && <p className="text-xs text-slate-light mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-[11px] text-slate-lighter mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-sage mt-1.5 shrink-0" />}
                  </button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

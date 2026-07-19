import { format } from 'date-fns'
import { CheckCheck } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

const TYPE_LABEL: Record<string, string> = {
  missed_dose: 'Missed Dose',
  low_stock: 'Low Stock',
  refill_due: 'Refill Due',
  appointment_reminder: 'Appointment',
  critical_vital: 'Critical Vital',
  poor_adherence: 'Poor Adherence',
  general: 'General',
}

const SEVERITY_BADGE: Record<string, { label: string; variant: 'rose' | 'amber' | 'sage' | 'slate' }> = {
  critical: { label: 'Critical', variant: 'rose' },
  warning: { label: 'Warning', variant: 'amber' },
  info: { label: 'Info', variant: 'sage' },
}

export function DoctorAlertsPage() {
  const { user } = useAuth()
  const { data: notifications = [], isLoading, markAsRead } = useNotifications(50)
  const queryClient = useQueryClient()

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', user!.id).eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = notifications.filter(n => !n.is_read)

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-sage" /></div>

  return (
    <div className="space-y-5">
      {unread.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-light">{unread.length} unread alert{unread.length !== 1 ? 's' : ''}</p>
          <Button size="sm" variant="secondary" leftIcon={<CheckCheck size={14} />} onClick={() => markAll.mutate()} isLoading={markAll.isPending}>
            Mark all read
          </Button>
        </div>
      )}

      <Card>
        <CardHeader title="All Alerts" />
        <CardBody>
          {notifications.length === 0 ? (
            <EmptyState icon="🔔" title="No alerts" description="You'll see missed doses, critical vitals, and other alerts here." />
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-sm transition-colors cursor-pointer ${
                    n.is_read ? 'bg-paper' : 'bg-sage/5 border border-sage/20'
                  }`}
                  onClick={() => !n.is_read && markAsRead.mutate(n.id)}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ n.is_read ? 'bg-transparent' : 'bg-sage' }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-medium text-ink">{n.title}</p>
                      <Badge label={TYPE_LABEL[n.type] ?? n.type} variant="slate" />
                      <Badge label={SEVERITY_BADGE[n.severity]?.label ?? n.severity} variant={SEVERITY_BADGE[n.severity]?.variant ?? 'slate'} />
                    </div>
                    {n.message && <p className="text-xs text-slate-light">{n.message}</p>}
                    <p className="text-[11px] text-slate-lighter mt-1">{format(new Date(n.created_at), 'MMM d · h:mm a')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

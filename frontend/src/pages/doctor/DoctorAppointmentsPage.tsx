import { format, isPast } from 'date-fns'
import { Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { useDoctorId } from '@/hooks/useDoctorId'
import { supabase } from '@/lib/supabase'

const STATUS_BADGE: Record<string, { label: string; variant: 'sage' | 'amber' | 'rose' | 'slate' }> = {
  scheduled: { label: 'Scheduled', variant: 'sage' },
  completed: { label: 'Completed', variant: 'slate' },
  cancelled: { label: 'Cancelled', variant: 'rose' },
  rescheduled: { label: 'Rescheduled', variant: 'amber' },
}

export function DoctorAppointmentsPage() {
  const { doctorId, isLoading: doctorLoading } = useDoctorId()

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['doctor-all-appointments', doctorId],
    enabled: !!doctorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, scheduled_at, reason, location, status, patient_id')
        .eq('doctor_id', doctorId as string)
        .order('scheduled_at', { ascending: true })
      if (error) throw error
      return data
    },
  })

  if (doctorLoading || isLoading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-sage" /></div>

  const upcoming = (appointments ?? []).filter(a => a.status === 'scheduled' && !isPast(new Date(a.scheduled_at)))
  const past = (appointments ?? []).filter(a => a.status !== 'scheduled' || isPast(new Date(a.scheduled_at)))

  return (
    <div className="space-y-5">
      {upcoming.length > 0 && (
        <Card>
          <CardHeader title="Upcoming" subtitle={`${upcoming.length} scheduled`} />
          <CardBody className="space-y-3">
            {upcoming.map(appt => (
              <div key={appt.id} className="flex items-center gap-4 border border-border rounded-sm p-3">
                <div className="w-11 h-11 rounded-md bg-sage/10 flex items-center justify-center shrink-0">
                  <Calendar size={20} className="text-sage" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{format(new Date(appt.scheduled_at), 'EEEE, MMMM d · h:mm a')}</p>
                  {appt.reason && <p className="text-xs text-slate-light">{appt.reason}</p>}
                  {appt.location && <p className="text-xs text-slate-light">{appt.location}</p>}
                </div>
                <Badge label={STATUS_BADGE[appt.status]?.label ?? appt.status} variant={STATUS_BADGE[appt.status]?.variant ?? 'slate'} />
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {past.length > 0 && (
        <Card>
          <CardHeader title="Past Appointments" subtitle={`${past.length} total`} />
          <CardBody className="space-y-3">
            {past.map(appt => (
              <div key={appt.id} className="flex items-center gap-4 border border-border rounded-sm p-3 opacity-75">
                <div className="w-11 h-11 rounded-md bg-cream flex items-center justify-center shrink-0">
                  <Calendar size={20} className="text-slate-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{format(new Date(appt.scheduled_at), 'MMM d, yyyy · h:mm a')}</p>
                  {appt.reason && <p className="text-xs text-slate-light">{appt.reason}</p>}
                </div>
                <Badge label={STATUS_BADGE[appt.status]?.label ?? appt.status} variant={STATUS_BADGE[appt.status]?.variant ?? 'slate'} />
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {(!appointments || appointments.length === 0) && (
        <Card><CardBody><EmptyState icon="🗓️" title="No appointments yet" description="Appointments will appear here once scheduled." /></CardBody></Card>
      )}
    </div>
  )
}

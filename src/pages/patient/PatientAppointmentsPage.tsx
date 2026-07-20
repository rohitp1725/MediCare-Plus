import { useState } from 'react'
import { format, isPast } from 'date-fns'
import { Plus, Calendar } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { useMyPatientId } from '@/hooks/useMyPatientId'
import { useAppointments } from '@/hooks/useAppointments'
import { useToast } from '@/components/toast/ToastProvider'

interface AppointmentForm {
  scheduled_at: string
  reason: string
  location: string
}

const STATUS_BADGE: Record<string, { label: string; variant: 'sage' | 'amber' | 'rose' | 'slate' }> = {
  scheduled: { label: 'Scheduled', variant: 'sage' },
  completed: { label: 'Completed', variant: 'slate' },
  cancelled: { label: 'Cancelled', variant: 'rose' },
  rescheduled: { label: 'Rescheduled', variant: 'amber' },
}

export function PatientAppointmentsPage() {
  const { patientId, isLoading: patientLoading } = useMyPatientId()
  const { appointments, isLoading, createAppointment } = useAppointments(patientId)
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<AppointmentForm>()

  async function onSubmit(values: AppointmentForm) {
    try {
      await createAppointment.mutateAsync({
        scheduled_at: values.scheduled_at,
        reason: values.reason || null,
        location: values.location || null,
      })
      toast.success('Appointment scheduled')
      setModalOpen(false)
      reset()
    } catch (err) {
      toast.danger('Could not schedule appointment', err instanceof Error ? err.message : undefined)
    }
  }

  if (patientLoading || isLoading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-sage" /></div>

  const upcoming = appointments.filter(a => a.status === 'scheduled' && !isPast(new Date(a.scheduled_at)))
  const past = appointments.filter(a => a.status !== 'scheduled' || isPast(new Date(a.scheduled_at)))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-light">{upcoming.length} upcoming · {past.length} past</p>
        <Button size="sm" leftIcon={<Plus size={15} />} onClick={() => { reset(); setModalOpen(true) }}>Request Appointment</Button>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="🗓️"
              title="No appointments yet"
              description="Request an appointment with your doctor."
              action={<Button leftIcon={<Plus size={15} />} onClick={() => setModalOpen(true)}>Request Appointment</Button>}
            />
          </CardBody>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold text-slate-light uppercase tracking-wider mb-2">Upcoming</h3>
              <div className="space-y-3">
                {upcoming.map(appt => (
                  <Card key={appt.id}>
                    <CardBody className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-md bg-sage/10 flex items-center justify-center shrink-0">
                        <Calendar size={22} className="text-sage" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink">{format(new Date(appt.scheduled_at), 'EEEE, MMMM d · h:mm a')}</p>
                        {appt.reason && <p className="text-xs text-slate-light mt-0.5">{appt.reason}</p>}
                        {appt.location && <p className="text-xs text-slate-light">{appt.location}</p>}
                      </div>
                      <Badge label={STATUS_BADGE[appt.status].label} variant={STATUS_BADGE[appt.status].variant} />
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold text-slate-light uppercase tracking-wider mb-2">Past</h3>
              <div className="space-y-3">
                {past.slice(0, 10).map(appt => (
                  <Card key={appt.id}>
                    <CardBody className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-md bg-cream flex items-center justify-center shrink-0">
                        <Calendar size={22} className="text-slate-light" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink">{format(new Date(appt.scheduled_at), 'MMM d, yyyy · h:mm a')}</p>
                        {appt.reason && <p className="text-xs text-slate-light mt-0.5">{appt.reason}</p>}
                      </div>
                      <Badge label={STATUS_BADGE[appt.status]?.label ?? appt.status} variant={STATUS_BADGE[appt.status]?.variant ?? 'slate'} />
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Request Appointment" maxWidth={440}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Date & Time"
            type="datetime-local"
            required
            error={errors.scheduled_at?.message}
            {...register('scheduled_at', { required: 'Please select a date and time' })}
          />
          <Input label="Reason (optional)" placeholder="e.g. Follow-up, check-up" {...register('reason')} />
          <Input label="Location (optional)" placeholder="e.g. City Hospital, Room 302" {...register('location')} />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" fullWidth onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>Schedule</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

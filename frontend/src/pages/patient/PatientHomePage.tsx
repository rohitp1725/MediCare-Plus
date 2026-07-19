import { format } from 'date-fns'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { usePatientHome } from '@/hooks/usePatientHome'
import { useAuth } from '@/context/AuthContext'

export function PatientHomePage() {
  const { profile } = useAuth()
  const { isLoading, isError, data } = usePatientHome()

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} className="text-sage" />
      </div>
    )
  }

  if (isError) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load your dashboard"
        description="Please refresh the page. If this keeps happening, contact your caregiver."
      />
    )
  }

  const doseStats = data?.doseStats ?? { total: 0, taken: 0, missed: 0, skipped: 0, pending: 0 }
  const appt = data?.nextAppointment

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg text-ink">Hello, {profile?.fullName?.split(' ')[0]} 👋</h3>
        <p className="text-sm text-slate-light mt-1">Here's your health snapshot for today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💊" value={data?.activeMedicineCount ?? 0} label="ACTIVE MEDICINES" accent="sage" />
        <StatCard
          icon="✅"
          value={doseStats.total > 0 ? `${doseStats.taken}/${doseStats.total}` : '—'}
          label="DOSES TAKEN TODAY"
          sub={doseStats.total === 0 ? 'Nothing scheduled today' : undefined}
          accent="sage"
        />
        <StatCard icon="⚠️" value={doseStats.missed} label="MISSED TODAY" accent="rose" />
        <StatCard
          icon="🗓️"
          value={appt ? format(new Date(appt.scheduled_at), 'MMM d') : '—'}
          label="NEXT APPOINTMENT"
          sub={appt ? format(new Date(appt.scheduled_at), 'h:mm a') : 'None scheduled'}
          accent="lavender"
        />
      </div>

      <Card>
        <CardHeader title="Today's Doses" subtitle="A detailed daily tracker is coming in the next phase" />
        <CardBody>
          {doseStats.total === 0 ? (
            <EmptyState icon="📋" title="No doses scheduled today" description="Once your caregiver adds medicines, today's schedule will show up here." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="font-display text-2xl text-sage-dark">{doseStats.taken}</div>
                <div className="text-xs text-slate-light mt-1">Taken</div>
              </div>
              <div>
                <div className="font-display text-2xl text-rose">{doseStats.missed}</div>
                <div className="text-xs text-slate-light mt-1">Missed</div>
              </div>
              <div>
                <div className="font-display text-2xl text-amber">{doseStats.skipped}</div>
                <div className="text-xs text-slate-light mt-1">Skipped</div>
              </div>
              <div>
                <div className="font-display text-2xl text-slate-light">{doseStats.pending}</div>
                <div className="text-xs text-slate-light mt-1">Pending</div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {appt && (
        <Card>
          <CardHeader title="Upcoming Appointment" />
          <CardBody className="flex items-center gap-4">
            <div className="text-3xl">🏥</div>
            <div>
              <p className="text-sm font-medium text-ink">{format(new Date(appt.scheduled_at), 'EEEE, MMMM d · h:mm a')}</p>
              {appt.reason && <p className="text-xs text-slate-light mt-0.5">{appt.reason}</p>}
              {appt.location && <p className="text-xs text-slate-light">{appt.location}</p>}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

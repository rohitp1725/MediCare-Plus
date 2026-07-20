import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { ArrowRight, Activity, Pill, CalendarClock } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { usePatientHome } from '@/hooks/usePatientHome'
import { useAuth } from '@/context/AuthContext'
import { useMyPatientId } from '@/hooks/useMyPatientId'
import { useVitals } from '@/hooks/useVitals'

function AdherenceMiniChart({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#2E5248' : pct >= 50 ? '#D97706' : '#E05252'
  return (
    <div className="w-full">
      <div className="flex justify-between text-[11px] text-slate-light mb-1">
        <span>Today's adherence</span>
        <span className="font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 bg-cream rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export function PatientHomePage() {
  const { profile } = useAuth()
  const { patientId } = useMyPatientId()
  const { isLoading, isError, data } = usePatientHome()
  const { vitals } = useVitals(patientId)

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
  const adherencePct = doseStats.total > 0 ? Math.round((doseStats.taken / doseStats.total) * 100) : 0
  const latestVital = vitals[0]

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h3 className="text-lg font-display font-semibold text-ink">
          {greeting()}, {profile?.fullName?.split(' ')[0]} 👋
        </h3>
        <p className="text-sm text-slate-light mt-0.5">
          {format(new Date(), 'EEEE, MMMM d')} · Here's your health snapshot
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="💊" value={data?.activeMedicineCount ?? 0} label="ACTIVE MEDICINES" accent="sage" />
        <StatCard
          icon="✅"
          value={doseStats.total > 0 ? `${doseStats.taken}/${doseStats.total}` : '—'}
          label="DOSES TODAY"
          sub={doseStats.total === 0 ? 'Nothing scheduled' : undefined}
          accent="sage"
        />
        <StatCard icon="⚠️" value={doseStats.missed} label="MISSED TODAY" accent="rose" />
        <StatCard
          icon="🗓️"
          value={appt ? format(new Date(appt.scheduled_at), 'MMM d') : '—'}
          label="NEXT APPT"
          sub={appt ? format(new Date(appt.scheduled_at), 'h:mm a') : 'None scheduled'}
          accent="lavender"
        />
      </div>

      {/* Dose summary + adherence bar */}
      {doseStats.total > 0 && (
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 mb-4">
              <Pill size={16} className="text-sage" />
              <p className="text-sm font-semibold text-ink">Today's Doses</p>
              <Link to="/patient/tracker" className="ml-auto text-xs text-sage hover:text-sage-dark flex items-center gap-1">
                Full tracker <ArrowRight size={12} />
              </Link>
            </div>
            <AdherenceMiniChart pct={adherencePct} />
            <div className="grid grid-cols-4 gap-2 mt-4 text-center">
              {[
                { label: 'Taken', value: doseStats.taken, color: 'text-sage-dark' },
                { label: 'Missed', value: doseStats.missed, color: 'text-rose' },
                { label: 'Skipped', value: doseStats.skipped, color: 'text-amber' },
                { label: 'Pending', value: doseStats.pending, color: 'text-slate-light' },
              ].map(s => (
                <div key={s.label}>
                  <p className={`text-xl font-display font-semibold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-light mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Latest Vitals quick view */}
      {latestVital && (
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} className="text-rose" />
              <p className="text-sm font-semibold text-ink">Latest Vitals</p>
              <p className="text-[11px] text-slate-lighter ml-1">{format(new Date(latestVital.recorded_at), 'MMM d · h:mm a')}</p>
              <Link to="/patient/health" className="ml-auto text-xs text-sage hover:text-sage-dark flex items-center gap-1">
                All readings <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {latestVital.blood_pressure_systolic && (
                <div className="bg-cream rounded-sm p-3 text-center">
                  <p className="text-base font-display font-semibold text-ink">{latestVital.blood_pressure_systolic}/{latestVital.blood_pressure_diastolic}</p>
                  <p className="text-[10px] text-slate-light mt-0.5">BP (mmHg)</p>
                </div>
              )}
              {latestVital.glucose_mg_dl && (
                <div className="bg-cream rounded-sm p-3 text-center">
                  <p className="text-base font-display font-semibold text-ink">{latestVital.glucose_mg_dl}</p>
                  <p className="text-[10px] text-slate-light mt-0.5">Glucose</p>
                </div>
              )}
              {latestVital.pulse_bpm && (
                <div className="bg-cream rounded-sm p-3 text-center">
                  <p className="text-base font-display font-semibold text-ink">{latestVital.pulse_bpm}</p>
                  <p className="text-[10px] text-slate-light mt-0.5">Pulse (bpm)</p>
                </div>
              )}
              {latestVital.oxygen_saturation && (
                <div className="bg-cream rounded-sm p-3 text-center">
                  <p className="text-base font-display font-semibold text-ink">{latestVital.oxygen_saturation}%</p>
                  <p className="text-[10px] text-slate-light mt-0.5">O₂ Sat</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Next Appointment */}
      {appt && (
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-lavender/15 flex items-center justify-center shrink-0">
              <CalendarClock size={22} className="text-lavender" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-ink">Upcoming Appointment</p>
                <Badge label="Scheduled" variant="lavender" />
              </div>
              <p className="text-xs text-slate-light">{format(new Date(appt.scheduled_at), 'EEEE, MMMM d · h:mm a')}</p>
              {appt.reason && <p className="text-xs text-slate-lighter">{appt.reason}</p>}
            </div>
            <Link to="/patient/visits" className="text-sage shrink-0">
              <ArrowRight size={18} />
            </Link>
          </CardBody>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { emoji: '📊', label: 'Reports', to: '/patient/reports', color: 'text-sage' },
          { emoji: '🤒', label: 'Log Symptom', to: '/patient/symptoms', color: 'text-rose' },
          { emoji: '💬', label: 'AI Assistant', to: '/patient/assistant', color: 'text-lavender' },
        ].map(link => (
          <Link key={link.to} to={link.to}>
            <Card>
              <CardBody className="flex items-center gap-3 py-3">
                <span className="text-xl">{link.emoji}</span>
                <p className={`text-sm font-medium ${link.color}`}>{link.label}</p>
                <ArrowRight size={14} className="ml-auto text-slate-lighter" />
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

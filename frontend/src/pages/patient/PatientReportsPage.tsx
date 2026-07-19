import { useState } from 'react'
import { format, subDays, startOfDay } from 'date-fns'
import { Printer } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useMyPatientId } from '@/hooks/useMyPatientId'
import { supabase } from '@/lib/supabase'

type Period = 7 | 14 | 30

const PERIOD_LABELS: Record<Period, string> = { 7: 'Last 7 days', 14: 'Last 14 days', 30: 'Last 30 days' }

function AdherenceBar({ taken, total }: { taken: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((taken / total) * 100)
  const color = pct >= 80 ? 'bg-sage' : pct >= 50 ? 'bg-amber' : 'bg-rose'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-light">{taken} of {total} doses taken</span>
        <span className={`text-xs font-bold ${ pct >= 80 ? 'text-sage-dark' : pct >= 50 ? 'text-amber' : 'text-rose' }`}>{pct}%</span>
      </div>
      <div className="h-2.5 bg-cream rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function PatientReportsPage() {
  const { patientId, isLoading: patientLoading } = useMyPatientId()
  const [period, setPeriod] = useState<Period>(7)

  const { data, isLoading } = useQuery({
    queryKey: ['patient-reports', patientId, period],
    enabled: !!patientId,
    queryFn: async () => {
      const dateFrom = format(startOfDay(subDays(new Date(), period)), 'yyyy-MM-dd')
      const today = format(new Date(), 'yyyy-MM-dd')
      const [dosesRes, vitalsRes] = await Promise.all([
        supabase.from('dose_logs').select('status, scheduled_date, medicine_id').eq('patient_id', patientId as string).gte('scheduled_date', dateFrom).lte('scheduled_date', today),
        supabase.from('vitals_logs').select('blood_pressure_systolic, glucose_mg_dl, pulse_bpm, recorded_at').eq('patient_id', patientId as string).gte('recorded_at', dateFrom + 'T00:00:00').order('recorded_at', { ascending: true }),
      ])
      if (dosesRes.error) throw dosesRes.error
      if (vitalsRes.error) throw vitalsRes.error
      const doses = dosesRes.data ?? []
      const total = doses.length
      const taken = doses.filter(d => d.status === 'taken').length
      const missed = doses.filter(d => d.status === 'missed').length
      const skipped = doses.filter(d => d.status === 'skipped').length
      return { total, taken, missed, skipped, vitals: vitalsRes.data ?? [] }
    },
  })

  if (patientLoading || isLoading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-sage" /></div>

  const avgBP = data && data.vitals.length > 0
    ? Math.round(data.vitals.reduce((s, v) => s + (v.blood_pressure_systolic ?? 0), 0) / data.vitals.filter(v => v.blood_pressure_systolic).length)
    : null
  const avgGlucose = data && data.vitals.filter(v => v.glucose_mg_dl).length > 0
    ? Math.round(data.vitals.reduce((s, v) => s + Number(v.glucose_mg_dl ?? 0), 0) / data.vitals.filter(v => v.glucose_mg_dl).length)
    : null

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-cream rounded-md p-1 border border-border">
          {([7, 14, 30] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-sm text-[13px] font-medium transition-all ${
                period === p ? 'bg-paper text-ink shadow-sm border border-border' : 'text-slate-light hover:text-ink'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <Button size="sm" variant="secondary" leftIcon={<Printer size={14} />} onClick={() => window.print()}>
          Print Report
        </Button>
      </div>

      <Card>
        <CardHeader title="Medication Adherence" subtitle={PERIOD_LABELS[period]} />
        <CardBody className="space-y-5">
          {!data || data.total === 0 ? (
            <EmptyState icon="📊" title="No dose data" description="Dose tracking data will appear here once medicines are scheduled." />
          ) : (
            <>
              <AdherenceBar taken={data.taken} total={data.total} />
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-sage/8 rounded-sm p-3">
                  <p className="text-xl font-display font-semibold text-sage-dark">{data.taken}</p>
                  <p className="text-[11px] text-slate-light mt-0.5">Taken</p>
                </div>
                <div className="bg-rose/8 rounded-sm p-3">
                  <p className="text-xl font-display font-semibold text-rose">{data.missed}</p>
                  <p className="text-[11px] text-slate-light mt-0.5">Missed</p>
                </div>
                <div className="bg-amber/8 rounded-sm p-3">
                  <p className="text-xl font-display font-semibold text-amber">{data.skipped}</p>
                  <p className="text-[11px] text-slate-light mt-0.5">Skipped</p>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {(avgBP !== null || avgGlucose !== null) && (
        <Card>
          <CardHeader title="Vitals Summary" subtitle={`Average over ${PERIOD_LABELS[period].toLowerCase()}`} />
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              {avgBP !== null && (
                <div className="bg-cream rounded-sm p-4 text-center">
                  <p className="text-2xl font-display font-semibold text-ink">{avgBP}</p>
                  <p className="text-xs text-slate-light mt-1">Avg Systolic BP (mmHg)</p>
                  {avgBP > 139 ? <span className="text-[11px] text-rose font-semibold">↑ Elevated</span> : <span className="text-[11px] text-sage font-semibold">✓ Normal range</span>}
                </div>
              )}
              {avgGlucose !== null && (
                <div className="bg-cream rounded-sm p-4 text-center">
                  <p className="text-2xl font-display font-semibold text-ink">{avgGlucose}</p>
                  <p className="text-xs text-slate-light mt-1">Avg Glucose (mg/dL)</p>
                  {avgGlucose > 140 ? <span className="text-[11px] text-rose font-semibold">↑ Elevated</span> : <span className="text-[11px] text-sage font-semibold">✓ Normal range</span>}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <p className="text-xs text-slate-lighter text-center">Data shown for {PERIOD_LABELS[period].toLowerCase()}. For medical decisions, consult your doctor.</p>
    </div>
  )
}

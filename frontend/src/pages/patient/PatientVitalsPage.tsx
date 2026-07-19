import { useState } from 'react'
import { format } from 'date-fns'
import { Activity, Plus, Trash2, Heart, Thermometer, Droplets, Wind, Scale } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useMyPatientId } from '@/hooks/useMyPatientId'
import { useVitals } from '@/hooks/useVitals'
import { useToast } from '@/components/toast/ToastProvider'

interface VitalFormValues {
  blood_pressure_systolic: string
  blood_pressure_diastolic: string
  glucose_mg_dl: string
  pulse_bpm: string
  oxygen_saturation: string
  weight_kg: string
  temperature_f: string
  notes: string
}

function getVitalStatus(type: string, value: number): 'normal' | 'warning' | 'critical' {
  switch (type) {
    case 'systolic': return value < 90 || value > 180 ? 'critical' : value > 139 ? 'warning' : 'normal'
    case 'diastolic': return value < 60 || value > 120 ? 'critical' : value > 89 ? 'warning' : 'normal'
    case 'glucose': return value < 70 || value > 250 ? 'critical' : value > 140 ? 'warning' : 'normal'
    case 'pulse': return value < 40 || value > 120 ? 'critical' : value < 60 || value > 100 ? 'warning' : 'normal'
    case 'oxygen': return value < 90 ? 'critical' : value < 95 ? 'warning' : 'normal'
    default: return 'normal'
  }
}

const STATUS_BADGE: Record<'normal' | 'warning' | 'critical', { label: string; variant: 'sage' | 'amber' | 'rose' }> = {
  normal: { label: 'Normal', variant: 'sage' },
  warning: { label: 'Elevated', variant: 'amber' },
  critical: { label: 'Critical', variant: 'rose' },
}

export function PatientVitalsPage() {
  const { patientId, isLoading: patientLoading } = useMyPatientId()
  const { vitals, isLoading, logVital, deleteVital } = useVitals(patientId)
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<VitalFormValues>()

  async function onSubmit(values: VitalFormValues) {
    try {
      await logVital.mutateAsync({
        blood_pressure_systolic: values.blood_pressure_systolic ? Number(values.blood_pressure_systolic) : null,
        blood_pressure_diastolic: values.blood_pressure_diastolic ? Number(values.blood_pressure_diastolic) : null,
        glucose_mg_dl: values.glucose_mg_dl ? Number(values.glucose_mg_dl) : null,
        pulse_bpm: values.pulse_bpm ? Number(values.pulse_bpm) : null,
        oxygen_saturation: values.oxygen_saturation ? Number(values.oxygen_saturation) : null,
        weight_kg: values.weight_kg ? Number(values.weight_kg) : null,
        temperature_f: values.temperature_f ? Number(values.temperature_f) : null,
        notes: values.notes || null,
      })
      toast.success('Vitals logged successfully')
      setModalOpen(false)
      reset()
    } catch (err) {
      toast.danger('Could not log vitals', err instanceof Error ? err.message : undefined)
    }
  }

  if (patientLoading || isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} className="text-sage" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-light">{vitals.length} reading{vitals.length !== 1 ? 's' : ''} recorded</p>
        <Button size="sm" leftIcon={<Plus size={15} />} onClick={() => { reset(); setModalOpen(true) }}>
          Log Vitals
        </Button>
      </div>

      {vitals.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="📈"
              title="No vitals recorded yet"
              description="Track your blood pressure, glucose, pulse and more."
              action={
                <Button leftIcon={<Plus size={15} />} onClick={() => setModalOpen(true)}>
                  Log First Reading
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {vitals.map((v) => {
            const bpStatus = v.blood_pressure_systolic ? getVitalStatus('systolic', v.blood_pressure_systolic) : null
            const glStatus = v.glucose_mg_dl ? getVitalStatus('glucose', Number(v.glucose_mg_dl)) : null
            const o2Status = v.oxygen_saturation ? getVitalStatus('oxygen', Number(v.oxygen_saturation)) : null
            const pr = v.pulse_bpm ? getVitalStatus('pulse', v.pulse_bpm) : null
            const worstStatus = [bpStatus, glStatus, o2Status, pr].filter(Boolean)
            const overallStatus = worstStatus.includes('critical') ? 'critical' : worstStatus.includes('warning') ? 'warning' : 'normal'

            return (
              <Card key={v.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {format(new Date(v.recorded_at), 'EEEE, MMM d · h:mm a')}
                      </p>
                      {v.notes && <p className="text-xs text-slate-light mt-0.5">{v.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge label={STATUS_BADGE[overallStatus].label} variant={STATUS_BADGE[overallStatus].variant} dot />
                      <button
                        onClick={() => setDeleteId(v.id)}
                        className="w-7 h-7 rounded-full hover:bg-rose/10 flex items-center justify-center text-slate-lighter hover:text-rose transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {v.blood_pressure_systolic && v.blood_pressure_diastolic && (
                      <div className="bg-cream rounded-sm p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Heart size={13} className="text-rose" />
                          <span className="text-[10px] font-semibold text-slate-light uppercase tracking-wide">Blood Pressure</span>
                        </div>
                        <p className="text-lg font-display font-semibold text-ink">{v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</p>
                        <p className="text-[10px] text-slate-light">mmHg</p>
                      </div>
                    )}
                    {v.glucose_mg_dl && (
                      <div className="bg-cream rounded-sm p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Droplets size={13} className="text-amber" />
                          <span className="text-[10px] font-semibold text-slate-light uppercase tracking-wide">Glucose</span>
                        </div>
                        <p className="text-lg font-display font-semibold text-ink">{v.glucose_mg_dl}</p>
                        <p className="text-[10px] text-slate-light">mg/dL</p>
                      </div>
                    )}
                    {v.pulse_bpm && (
                      <div className="bg-cream rounded-sm p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Activity size={13} className="text-sage" />
                          <span className="text-[10px] font-semibold text-slate-light uppercase tracking-wide">Pulse</span>
                        </div>
                        <p className="text-lg font-display font-semibold text-ink">{v.pulse_bpm}</p>
                        <p className="text-[10px] text-slate-light">bpm</p>
                      </div>
                    )}
                    {v.oxygen_saturation && (
                      <div className="bg-cream rounded-sm p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Wind size={13} className="text-lavender" />
                          <span className="text-[10px] font-semibold text-slate-light uppercase tracking-wide">O₂ Sat</span>
                        </div>
                        <p className="text-lg font-display font-semibold text-ink">{v.oxygen_saturation}%</p>
                        <p className="text-[10px] text-slate-light">SpO₂</p>
                      </div>
                    )}
                    {v.weight_kg && (
                      <div className="bg-cream rounded-sm p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Scale size={13} className="text-slate-light" />
                          <span className="text-[10px] font-semibold text-slate-light uppercase tracking-wide">Weight</span>
                        </div>
                        <p className="text-lg font-display font-semibold text-ink">{v.weight_kg}</p>
                        <p className="text-[10px] text-slate-light">kg</p>
                      </div>
                    )}
                    {v.temperature_f && (
                      <div className="bg-cream rounded-sm p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Thermometer size={13} className="text-rose" />
                          <span className="text-[10px] font-semibold text-slate-light uppercase tracking-wide">Temp</span>
                        </div>
                        <p className="text-lg font-display font-semibold text-ink">{v.temperature_f}°F</p>
                        <p className="text-[10px] text-slate-light">Fahrenheit</p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Vitals" maxWidth={520}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Systolic BP" type="number" placeholder="120" {...register('blood_pressure_systolic')} />
            <Input label="Diastolic BP" type="number" placeholder="80" {...register('blood_pressure_diastolic')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Glucose (mg/dL)" type="number" placeholder="100" {...register('glucose_mg_dl')} />
            <Input label="Pulse (bpm)" type="number" placeholder="72" {...register('pulse_bpm')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="O₂ Saturation (%)" type="number" placeholder="98" {...register('oxygen_saturation')} />
            <Input label="Temperature (°F)" type="number" placeholder="98.6" step="0.1" {...register('temperature_f')} />
          </div>
          <Input label="Weight (kg)" type="number" placeholder="70" step="0.1" {...register('weight_kg')} />
          <Input label="Notes (optional)" placeholder="Any additional notes" {...register('notes')} />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" fullWidth onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>Save Reading</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return
          try {
            await deleteVital.mutateAsync(deleteId)
            toast.success('Reading deleted')
          } catch {
            toast.danger('Could not delete reading')
          } finally {
            setDeleteId(null)
          }
        }}
        title="Delete Reading"
        message="This vital reading will be permanently removed."
        confirmLabel="Delete"
        isLoading={deleteVital.isPending}
      />
    </div>
  )
}

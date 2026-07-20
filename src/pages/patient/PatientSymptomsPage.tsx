import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useMyPatientId } from '@/hooks/useMyPatientId'
import { useSymptoms } from '@/hooks/useSymptoms'
import { useToast } from '@/components/toast/ToastProvider'

interface SymptomForm {
  symptom: string
  severity: 'mild' | 'moderate' | 'severe'
  duration: string
  notes: string
  is_emergency: boolean
  doctor_informed: boolean
}

const SEVERITY_BADGE: Record<'mild' | 'moderate' | 'severe', { label: string; variant: 'sage' | 'amber' | 'rose' }> = {
  mild: { label: 'Mild', variant: 'sage' },
  moderate: { label: 'Moderate', variant: 'amber' },
  severe: { label: 'Severe', variant: 'rose' },
}

export function PatientSymptomsPage() {
  const { patientId, isLoading: patientLoading } = useMyPatientId()
  const { symptoms, isLoading, logSymptom, deleteSymptom } = useSymptoms(patientId)
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<SymptomForm>({
    defaultValues: { severity: 'mild', is_emergency: false, doctor_informed: false },
  })

  async function onSubmit(values: SymptomForm) {
    try {
      await logSymptom.mutateAsync({
        symptom: values.symptom,
        severity: values.severity,
        duration: values.duration || null,
        notes: values.notes || null,
        is_emergency: values.is_emergency,
        doctor_informed: values.doctor_informed,
      })
      toast.success('Symptom logged')
      setModalOpen(false)
      reset()
    } catch (err) {
      toast.danger('Could not log symptom', err instanceof Error ? err.message : undefined)
    }
  }

  if (patientLoading || isLoading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-sage" /></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-light">{symptoms.length} symptom{symptoms.length !== 1 ? 's' : ''} logged</p>
        <Button size="sm" leftIcon={<Plus size={15} />} onClick={() => { reset(); setModalOpen(true) }}>Log Symptom</Button>
      </div>

      {symptoms.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="🤒"
              title="No symptoms logged"
              description="Track any health concerns, pain, or discomfort here."
              action={<Button leftIcon={<Plus size={15} />} onClick={() => setModalOpen(true)}>Log Symptom</Button>}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {symptoms.map((s) => (
            <Card key={s.id}>
              <CardBody>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-ink">{s.symptom}</p>
                      <Badge label={SEVERITY_BADGE[s.severity].label} variant={SEVERITY_BADGE[s.severity].variant} dot />
                      {s.is_emergency && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose bg-rose/10 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={11} /> Emergency
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-light">{format(new Date(s.onset_at), 'EEEE, MMM d · h:mm a')}</p>
                    {s.duration && <p className="text-xs text-slate-light mt-0.5">Duration: {s.duration}</p>}
                    {s.notes && <p className="text-xs text-slate-light mt-1 italic">{s.notes}</p>}
                    {s.doctor_informed && (
                      <p className="text-xs text-sage mt-1">✓ Doctor informed</p>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteId(s.id)}
                    className="w-7 h-7 rounded-full hover:bg-rose/10 flex items-center justify-center text-slate-lighter hover:text-rose transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Symptom" maxWidth={460}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Symptom" placeholder="e.g. Headache, nausea, chest pain" required {...register('symptom', { required: true })} />
          <Select label="Severity" {...register('severity')}>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </Select>
          <Input label="Duration (optional)" placeholder="e.g. 2 hours, since morning" {...register('duration')} />
          <Input label="Notes (optional)" placeholder="Any additional context" {...register('notes')} />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate cursor-pointer">
              <input type="checkbox" className="accent-rose" {...register('is_emergency')} />
              Emergency / urgent
            </label>
            <label className="flex items-center gap-2 text-sm text-slate cursor-pointer">
              <input type="checkbox" className="accent-sage" {...register('doctor_informed')} />
              Doctor informed
            </label>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" fullWidth onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>Log Symptom</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return
          try { await deleteSymptom.mutateAsync(deleteId); toast.success('Symptom deleted') }
          catch { toast.danger('Could not delete') }
          finally { setDeleteId(null) }
        }}
        title="Delete Symptom"
        message="This symptom entry will be permanently removed."
        confirmLabel="Delete"
        isLoading={deleteSymptom.isPending}
      />
    </div>
  )
}

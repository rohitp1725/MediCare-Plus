import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { differenceInYears, format } from 'date-fns'
import { ArrowLeft, Plus, Pencil, Trash2, Power } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { MedicineCard } from '@/components/medicine/MedicineCard'
import { MedicineFormModal } from '@/components/medicine/MedicineFormModal'
import { usePatientProfile } from '@/hooks/usePatientProfile'
import { useMedicines } from '@/hooks/useMedicines'
import { useVitals } from '@/hooks/useVitals'
import { useSymptoms } from '@/hooks/useSymptoms'
import { useAppointments } from '@/hooks/useAppointments'
import { useToast } from '@/components/toast/ToastProvider'
import type { Database } from '@/types/database'
import type { MedicineFormValues } from '@/lib/validation/medicine'

type MedicineRow = Database['public']['Tables']['medicines']['Row']

const PAGE_TABS = [
  { id: 'medicines', label: 'Medicines', emoji: '💊' },
  { id: 'vitals', label: 'Vitals', emoji: '📈' },
  { id: 'symptoms', label: 'Symptoms', emoji: '🤒' },
  { id: 'appointments', label: 'Appointments', emoji: '🗓️' },
]

const SEVERITY_BADGE: Record<string, { label: string; variant: 'sage' | 'amber' | 'rose' }> = {
  mild: { label: 'Mild', variant: 'sage' },
  moderate: { label: 'Moderate', variant: 'amber' },
  severe: { label: 'Severe', variant: 'rose' },
}

const APPT_STATUS_BADGE: Record<string, { label: string; variant: 'sage' | 'amber' | 'rose' | 'slate' }> = {
  scheduled: { label: 'Scheduled', variant: 'sage' },
  completed: { label: 'Completed', variant: 'slate' },
  cancelled: { label: 'Cancelled', variant: 'rose' },
  rescheduled: { label: 'Rescheduled', variant: 'amber' },
}

interface VitalForm {
  blood_pressure_systolic: string
  blood_pressure_diastolic: string
  glucose_mg_dl: string
  pulse_bpm: string
  oxygen_saturation: string
  weight_kg: string
  temperature_f: string
  notes: string
}

interface SymptomForm {
  symptom: string
  severity: 'mild' | 'moderate' | 'severe'
  duration: string
  notes: string
}

interface ApptForm {
  scheduled_at: string
  reason: string
  location: string
}

export function CaregiverPatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const { data: patient, isLoading: patientLoading, isError: patientError } = usePatientProfile(patientId)
  const { medicines, isLoading: medsLoading, createMedicine, updateMedicine, toggleActive, deleteMedicine } = useMedicines(patientId)
  const { vitals, isLoading: vitalsLoading, logVital } = useVitals(patientId)
  const { symptoms, isLoading: symptomsLoading, logSymptom } = useSymptoms(patientId)
  const { appointments, isLoading: apptLoading, createAppointment } = useAppointments(patientId)
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('medicines')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MedicineRow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [vitalModal, setVitalModal] = useState(false)
  const [symptomModal, setSymptomModal] = useState(false)
  const [apptModal, setApptModal] = useState(false)
  const [vitalForm, setVitalForm] = useState<VitalForm>({ blood_pressure_systolic: '', blood_pressure_diastolic: '', glucose_mg_dl: '', pulse_bpm: '', oxygen_saturation: '', weight_kg: '', temperature_f: '', notes: '' })
  const [symptomForm, setSymptomForm] = useState<SymptomForm>({ symptom: '', severity: 'mild', duration: '', notes: '' })
  const [apptForm, setApptForm] = useState<ApptForm>({ scheduled_at: '', reason: '', location: '' })

  if (patientLoading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-sage" /></div>
  if (patientError || !patient) return <EmptyState icon="⚠️" title="Couldn't load this patient" description="Please go back and try again." />

  async function handleSubmit(values: MedicineFormValues) {
    try {
      if (editing) {
        await updateMedicine.mutateAsync({ id: editing.id, values })
        toast.success('Medicine updated')
      } else {
        await createMedicine.mutateAsync(values)
        toast.success('Medicine added')
      }
      setModalOpen(false)
      setEditing(null)
    } catch (err) {
      toast.danger('Couldn\'t save medicine', err instanceof Error ? err.message : undefined)
    }
  }

  async function handleDelete(medicine: MedicineRow) {
    setDeleteId(medicine.id)
  }

  async function handleToggleActive(medicine: MedicineRow) {
    try {
      await toggleActive.mutateAsync({ id: medicine.id, isActive: !medicine.is_active })
    } catch (err) {
      toast.danger('Couldn\'t update medicine', err instanceof Error ? err.message : undefined)
    }
  }

  async function handleLogVital() {
    try {
      await logVital.mutateAsync({
        blood_pressure_systolic: vitalForm.blood_pressure_systolic ? Number(vitalForm.blood_pressure_systolic) : null,
        blood_pressure_diastolic: vitalForm.blood_pressure_diastolic ? Number(vitalForm.blood_pressure_diastolic) : null,
        glucose_mg_dl: vitalForm.glucose_mg_dl ? Number(vitalForm.glucose_mg_dl) : null,
        pulse_bpm: vitalForm.pulse_bpm ? Number(vitalForm.pulse_bpm) : null,
        oxygen_saturation: vitalForm.oxygen_saturation ? Number(vitalForm.oxygen_saturation) : null,
        weight_kg: vitalForm.weight_kg ? Number(vitalForm.weight_kg) : null,
        temperature_f: vitalForm.temperature_f ? Number(vitalForm.temperature_f) : null,
        notes: vitalForm.notes || null,
      })
      toast.success('Vitals logged')
      setVitalModal(false)
      setVitalForm({ blood_pressure_systolic: '', blood_pressure_diastolic: '', glucose_mg_dl: '', pulse_bpm: '', oxygen_saturation: '', weight_kg: '', temperature_f: '', notes: '' })
    } catch (err) {
      toast.danger('Could not log vitals', err instanceof Error ? err.message : undefined)
    }
  }

  async function handleLogSymptom() {
    if (!symptomForm.symptom.trim()) return
    try {
      await logSymptom.mutateAsync({
        symptom: symptomForm.symptom,
        severity: symptomForm.severity,
        duration: symptomForm.duration || null,
        notes: symptomForm.notes || null,
      })
      toast.success('Symptom logged')
      setSymptomModal(false)
      setSymptomForm({ symptom: '', severity: 'mild', duration: '', notes: '' })
    } catch (err) {
      toast.danger('Could not log symptom', err instanceof Error ? err.message : undefined)
    }
  }

  async function handleCreateAppt() {
    if (!apptForm.scheduled_at) return
    try {
      await createAppointment.mutateAsync({ scheduled_at: apptForm.scheduled_at, reason: apptForm.reason || null, location: apptForm.location || null })
      toast.success('Appointment scheduled')
      setApptModal(false)
      setApptForm({ scheduled_at: '', reason: '', location: '' })
    } catch (err) {
      toast.danger('Could not schedule', err instanceof Error ? err.message : undefined)
    }
  }

  const activeMeds = medicines.filter(m => m.is_active)
  const inactiveMeds = medicines.filter(m => !m.is_active)

  return (
    <div className="space-y-5">
      <Link to="/caregiver/patients" className="inline-flex items-center gap-1.5 text-sm text-slate-light hover:text-sage">
        <ArrowLeft size={16} /> Back to My Patients
      </Link>

      <Card>
        <CardBody className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center text-2xl shrink-0">{patient.avatarEmoji}</div>
          <div>
            <h3 className="text-lg text-ink">{patient.fullName}</h3>
            <p className="text-xs text-slate-light mt-0.5">
              {patient.dob ? `${differenceInYears(new Date(), new Date(patient.dob))} years` : 'Age not set'}
              {patient.gender ? ` · ${patient.gender}` : ''}
              {patient.blood_group ? ` · ${patient.blood_group}` : ''}
              {!patient.is_active && ' · Inactive'}
            </p>
          </div>
        </CardBody>
      </Card>

      <Tabs tabs={PAGE_TABS} active={activeTab} onChange={setActiveTab} />

      {/* MEDICINES TAB */}
      {activeTab === 'medicines' && (
        <Card>
          <CardHeader
            title="Medicines"
            subtitle={medicines.length > 0 ? `${activeMeds.length} active` : undefined}
            right={
              <Button size="sm" leftIcon={<Plus size={15} />} onClick={() => { setEditing(null); setModalOpen(true) }}>
                Add Medicine
              </Button>
            }
          />
          <CardBody>
            {medsLoading ? (
              <div className="flex justify-center py-8"><Spinner size={22} className="text-sage" /></div>
            ) : medicines.length === 0 ? (
              <EmptyState
                icon="💊"
                title="No medicines yet"
                description="Add this patient's first medicine to start tracking doses."
                action={
                  <Button leftIcon={<Plus size={15} />} onClick={() => { setEditing(null); setModalOpen(true) }}>Add Medicine</Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {[...activeMeds, ...inactiveMeds].map(m => (
                  <MedicineCard
                    key={m.id}
                    medicine={m}
                    actions={
                      <>
                        <button onClick={() => { setEditing(m); setModalOpen(true) }} className="w-8 h-8 rounded-full hover:bg-cream flex items-center justify-center text-slate-light hover:text-sage transition-colors" aria-label="Edit"><Pencil size={15} /></button>
                        <button onClick={() => handleToggleActive(m)} className="w-8 h-8 rounded-full hover:bg-cream flex items-center justify-center text-slate-light hover:text-amber transition-colors" aria-label={m.is_active ? 'Deactivate' : 'Reactivate'}><Power size={15} /></button>
                        <button onClick={() => handleDelete(m)} className="w-8 h-8 rounded-full hover:bg-cream flex items-center justify-center text-slate-light hover:text-rose transition-colors" aria-label="Delete"><Trash2 size={15} /></button>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* VITALS TAB */}
      {activeTab === 'vitals' && (
        <Card>
          <CardHeader title="Vitals" right={<Button size="sm" leftIcon={<Plus size={15} />} onClick={() => setVitalModal(true)}>Log Vitals</Button>} />
          <CardBody>
            {vitalsLoading ? <div className="flex justify-center py-8"><Spinner size={22} className="text-sage" /></div>
              : vitals.length === 0 ? <EmptyState icon="📈" title="No vitals recorded" description="Log vitals for this patient." />
              : (
                <div className="space-y-3">
                  {vitals.map(v => (
                    <div key={v.id} className="border border-border rounded-sm p-3">
                      <p className="text-xs font-semibold text-ink mb-2">{format(new Date(v.recorded_at), 'MMM d · h:mm a')}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {v.blood_pressure_systolic && <div className="bg-cream rounded px-2 py-1 text-center"><p className="text-sm font-display font-semibold text-ink">{v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</p><p className="text-[10px] text-slate-light">BP (mmHg)</p></div>}
                        {v.glucose_mg_dl && <div className="bg-cream rounded px-2 py-1 text-center"><p className="text-sm font-display font-semibold text-ink">{v.glucose_mg_dl}</p><p className="text-[10px] text-slate-light">Glucose</p></div>}
                        {v.pulse_bpm && <div className="bg-cream rounded px-2 py-1 text-center"><p className="text-sm font-display font-semibold text-ink">{v.pulse_bpm}</p><p className="text-[10px] text-slate-light">Pulse</p></div>}
                        {v.oxygen_saturation && <div className="bg-cream rounded px-2 py-1 text-center"><p className="text-sm font-display font-semibold text-ink">{v.oxygen_saturation}%</p><p className="text-[10px] text-slate-light">O₂ Sat</p></div>}
                        {v.weight_kg && <div className="bg-cream rounded px-2 py-1 text-center"><p className="text-sm font-display font-semibold text-ink">{v.weight_kg}kg</p><p className="text-[10px] text-slate-light">Weight</p></div>}
                        {v.temperature_f && <div className="bg-cream rounded px-2 py-1 text-center"><p className="text-sm font-display font-semibold text-ink">{v.temperature_f}°F</p><p className="text-[10px] text-slate-light">Temp</p></div>}
                      </div>
                      {v.notes && <p className="text-xs text-slate-light mt-2 italic">{v.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
          </CardBody>
        </Card>
      )}

      {/* SYMPTOMS TAB */}
      {activeTab === 'symptoms' && (
        <Card>
          <CardHeader title="Symptoms" right={<Button size="sm" leftIcon={<Plus size={15} />} onClick={() => setSymptomModal(true)}>Log Symptom</Button>} />
          <CardBody>
            {symptomsLoading ? <div className="flex justify-center py-8"><Spinner size={22} className="text-sage" /></div>
              : symptoms.length === 0 ? <EmptyState icon="🤒" title="No symptoms logged" description="Log symptoms for this patient." />
              : (
                <div className="space-y-3">
                  {symptoms.map(s => (
                    <div key={s.id} className="flex items-start gap-3 border border-border rounded-sm p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold text-ink">{s.symptom}</p>
                          <Badge label={SEVERITY_BADGE[s.severity].label} variant={SEVERITY_BADGE[s.severity].variant} dot />
                        </div>
                        <p className="text-xs text-slate-light">{format(new Date(s.onset_at), 'MMM d · h:mm a')}</p>
                        {s.duration && <p className="text-xs text-slate-light">Duration: {s.duration}</p>}
                        {s.notes && <p className="text-xs text-slate-light italic mt-0.5">{s.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </CardBody>
        </Card>
      )}

      {/* APPOINTMENTS TAB */}
      {activeTab === 'appointments' && (
        <Card>
          <CardHeader title="Appointments" right={<Button size="sm" leftIcon={<Plus size={15} />} onClick={() => setApptModal(true)}>Schedule</Button>} />
          <CardBody>
            {apptLoading ? <div className="flex justify-center py-8"><Spinner size={22} className="text-sage" /></div>
              : appointments.length === 0 ? <EmptyState icon="🗓️" title="No appointments" description="Schedule an appointment for this patient." />
              : (
                <div className="space-y-3">
                  {appointments.map(appt => (
                    <div key={appt.id} className="flex items-center gap-3 border border-border rounded-sm p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink">{format(new Date(appt.scheduled_at), 'MMM d, yyyy · h:mm a')}</p>
                        {appt.reason && <p className="text-xs text-slate-light">{appt.reason}</p>}
                      </div>
                      <Badge label={APPT_STATUS_BADGE[appt.status]?.label ?? appt.status} variant={APPT_STATUS_BADGE[appt.status]?.variant ?? 'slate'} />
                    </div>
                  ))}
                </div>
              )}
          </CardBody>
        </Card>
      )}

      {/* Medicine modals */}
      <MedicineFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSubmit={handleSubmit} isSubmitting={createMedicine.isPending || updateMedicine.isPending} editing={editing} />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return
          try { await deleteMedicine.mutateAsync(deleteId); toast.success('Medicine removed') }
          catch (err) { toast.danger('Couldn\'t remove medicine', err instanceof Error ? err.message : undefined) }
          finally { setDeleteId(null) }
        }}
        title="Remove Medicine"
        message={`Remove ${medicines.find(m => m.id === deleteId)?.name ?? 'this medicine'}? This can't be undone.`}
        confirmLabel="Remove"
        isLoading={deleteMedicine.isPending}
      />

      {/* Vital modal */}
      <Modal open={vitalModal} onClose={() => setVitalModal(false)} title="Log Vitals" maxWidth={520}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Systolic BP" type="number" placeholder="120" value={vitalForm.blood_pressure_systolic} onChange={e => setVitalForm(f => ({...f, blood_pressure_systolic: e.target.value}))} />
            <Input label="Diastolic BP" type="number" placeholder="80" value={vitalForm.blood_pressure_diastolic} onChange={e => setVitalForm(f => ({...f, blood_pressure_diastolic: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Glucose (mg/dL)" type="number" placeholder="100" value={vitalForm.glucose_mg_dl} onChange={e => setVitalForm(f => ({...f, glucose_mg_dl: e.target.value}))} />
            <Input label="Pulse (bpm)" type="number" placeholder="72" value={vitalForm.pulse_bpm} onChange={e => setVitalForm(f => ({...f, pulse_bpm: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="O₂ Saturation (%)" type="number" placeholder="98" value={vitalForm.oxygen_saturation} onChange={e => setVitalForm(f => ({...f, oxygen_saturation: e.target.value}))} />
            <Input label="Temperature (°F)" type="number" placeholder="98.6" step="0.1" value={vitalForm.temperature_f} onChange={e => setVitalForm(f => ({...f, temperature_f: e.target.value}))} />
          </div>
          <Input label="Weight (kg)" type="number" placeholder="70" step="0.1" value={vitalForm.weight_kg} onChange={e => setVitalForm(f => ({...f, weight_kg: e.target.value}))} />
          <Input label="Notes" placeholder="Additional observations" value={vitalForm.notes} onChange={e => setVitalForm(f => ({...f, notes: e.target.value}))} />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setVitalModal(false)}>Cancel</Button>
            <Button fullWidth onClick={handleLogVital} isLoading={logVital.isPending}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Symptom modal */}
      <Modal open={symptomModal} onClose={() => setSymptomModal(false)} title="Log Symptom" maxWidth={420}>
        <div className="space-y-4">
          <Input label="Symptom" placeholder="e.g. Headache, dizziness" value={symptomForm.symptom} onChange={e => setSymptomForm(f => ({...f, symptom: e.target.value}))} />
          <Select label="Severity" value={symptomForm.severity} onChange={e => setSymptomForm(f => ({...f, severity: e.target.value as 'mild' | 'moderate' | 'severe'}))}>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </Select>
          <Input label="Duration" placeholder="e.g. 2 hours" value={symptomForm.duration} onChange={e => setSymptomForm(f => ({...f, duration: e.target.value}))} />
          <Input label="Notes" placeholder="Additional details" value={symptomForm.notes} onChange={e => setSymptomForm(f => ({...f, notes: e.target.value}))} />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setSymptomModal(false)}>Cancel</Button>
            <Button fullWidth onClick={handleLogSymptom} isLoading={logSymptom.isPending}>Log</Button>
          </div>
        </div>
      </Modal>

      {/* Appointment modal */}
      <Modal open={apptModal} onClose={() => setApptModal(false)} title="Schedule Appointment" maxWidth={440}>
        <div className="space-y-4">
          <Input label="Date & Time" type="datetime-local" value={apptForm.scheduled_at} onChange={e => setApptForm(f => ({...f, scheduled_at: e.target.value}))} />
          <Input label="Reason" placeholder="e.g. Follow-up check" value={apptForm.reason} onChange={e => setApptForm(f => ({...f, reason: e.target.value}))} />
          <Input label="Location" placeholder="e.g. City Hospital" value={apptForm.location} onChange={e => setApptForm(f => ({...f, location: e.target.value}))} />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setApptModal(false)}>Cancel</Button>
            <Button fullWidth onClick={handleCreateAppt} isLoading={createAppointment.isPending} disabled={!apptForm.scheduled_at}>Schedule</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

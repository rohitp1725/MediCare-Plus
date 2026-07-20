import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { differenceInYears, format } from 'date-fns'
import { ArrowLeft, Plus, StopCircle } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { usePatientProfile } from '@/hooks/usePatientProfile'
import { usePrescriptions } from '@/hooks/usePrescriptions'
import { useDoctorVisits } from '@/hooks/useDoctorVisits'
import { useAppointments } from '@/hooks/useAppointments'
import { useVitals } from '@/hooks/useVitals'
import { useDoctorId } from '@/hooks/useDoctorId'
import { useToast } from '@/components/toast/ToastProvider'

const TABS = [
  { id: 'overview', label: 'Overview', emoji: '📋' },
  { id: 'prescriptions', label: 'Prescriptions', emoji: '💊' },
  { id: 'visits', label: 'Visits', emoji: '🏥' },
  { id: 'appointments', label: 'Appointments', emoji: '🗓️' },
]

const STATUS_BADGE: Record<string, { label: string; variant: 'sage' | 'amber' | 'rose' | 'slate' }> = {
  active: { label: 'Active', variant: 'sage' },
  stopped: { label: 'Stopped', variant: 'rose' },
  completed: { label: 'Completed', variant: 'slate' },
  scheduled: { label: 'Scheduled', variant: 'sage' },
  cancelled: { label: 'Cancelled', variant: 'rose' },
}

interface PrescriptionForm {
  medicine_name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

interface VisitForm {
  visit_date: string
  hospital: string
  reason: string
  diagnosis: string
  changes_made: string
  tests_ordered: string
  next_visit_date: string
  notes: string
}

interface ApptForm {
  scheduled_at: string
  reason: string
  location: string
}

export function DoctorPatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const { doctorId } = useDoctorId()
  const { data: patient, isLoading: patientLoading, isError } = usePatientProfile(patientId)
  const { prescriptions, isLoading: rxLoading, createPrescription, stopPrescription } = usePrescriptions(patientId)
  const { visits, isLoading: visitsLoading, logVisit } = useDoctorVisits(patientId)
  const { appointments, isLoading: apptLoading, createAppointment, updateAppointment } = useAppointments(patientId)
  const { vitals } = useVitals(patientId)
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('overview')
  const [rxModal, setRxModal] = useState(false)
  const [visitModal, setVisitModal] = useState(false)
  const [apptModal, setApptModal] = useState(false)
  const [stopId, setStopId] = useState<string | null>(null)

  const [rxForm, setRxForm] = useState<PrescriptionForm>({ medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' })
  const [visitForm, setVisitForm] = useState<VisitForm>({ visit_date: new Date().toISOString().slice(0, 10), hospital: '', reason: '', diagnosis: '', changes_made: '', tests_ordered: '', next_visit_date: '', notes: '' })
  const [apptForm, setApptForm] = useState<ApptForm>({ scheduled_at: '', reason: '', location: '' })

  if (patientLoading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-sage" /></div>
  if (isError || !patient) return <EmptyState icon="⚠️" title="Patient not found" description="Go back and try again." />

  async function handleCreateRx() {
    if (!doctorId || !rxForm.medicine_name.trim()) return
    try {
      await createPrescription.mutateAsync({ values: { ...rxForm, dosage: rxForm.dosage || null, frequency: rxForm.frequency || null, duration: rxForm.duration || null, instructions: rxForm.instructions || null }, doctorId })
      toast.success('Prescription added')
      setRxModal(false)
      setRxForm({ medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' })
    } catch (err) { toast.danger('Could not add prescription', err instanceof Error ? err.message : undefined) }
  }

  async function handleLogVisit() {
    if (!doctorId || !visitForm.visit_date) return
    try {
      await logVisit.mutateAsync({ values: { ...visitForm, hospital: visitForm.hospital || null, reason: visitForm.reason || null, diagnosis: visitForm.diagnosis || null, changes_made: visitForm.changes_made || null, tests_ordered: visitForm.tests_ordered || null, next_visit_date: visitForm.next_visit_date || null, notes: visitForm.notes || null }, doctorId })
      toast.success('Visit logged')
      setVisitModal(false)
    } catch (err) { toast.danger('Could not log visit', err instanceof Error ? err.message : undefined) }
  }

  async function handleCreateAppt() {
    if (!apptForm.scheduled_at) return
    try {
      await createAppointment.mutateAsync({ scheduled_at: apptForm.scheduled_at, reason: apptForm.reason || null, location: apptForm.location || null, doctor_id: doctorId })
      toast.success('Appointment scheduled')
      setApptModal(false)
      setApptForm({ scheduled_at: '', reason: '', location: '' })
    } catch (err) { toast.danger('Could not schedule', err instanceof Error ? err.message : undefined) }
  }

  const latestVital = vitals[0]

  return (
    <div className="space-y-5">
      <Link to="/doctor/patients" className="inline-flex items-center gap-1.5 text-sm text-slate-light hover:text-sage">
        <ArrowLeft size={16} /> Back to My Patients
      </Link>

      {/* Patient Header */}
      <Card>
        <CardBody className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center text-2xl shrink-0">{patient.avatarEmoji}</div>
          <div>
            <h3 className="text-lg text-ink">{patient.fullName}</h3>
            <p className="text-xs text-slate-light mt-0.5">
              {patient.dob ? `${differenceInYears(new Date(), new Date(patient.dob))} years` : 'Age unknown'}
              {patient.gender ? ` · ${patient.gender}` : ''}
              {patient.blood_group ? ` · ${patient.blood_group}` : ''}
            </p>
          </div>
        </CardBody>
      </Card>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {latestVital ? (
            <Card>
              <CardHeader title="Latest Vitals" subtitle={format(new Date(latestVital.recorded_at), 'MMM d · h:mm a')} />
              <CardBody>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {latestVital.blood_pressure_systolic && (
                    <div className="bg-cream rounded-sm p-3 text-center">
                      <p className="text-lg font-display font-semibold text-ink">{latestVital.blood_pressure_systolic}/{latestVital.blood_pressure_diastolic}</p>
                      <p className="text-[10px] text-slate-light mt-0.5">BP (mmHg)</p>
                    </div>
                  )}
                  {latestVital.glucose_mg_dl && (
                    <div className="bg-cream rounded-sm p-3 text-center">
                      <p className="text-lg font-display font-semibold text-ink">{latestVital.glucose_mg_dl}</p>
                      <p className="text-[10px] text-slate-light mt-0.5">Glucose (mg/dL)</p>
                    </div>
                  )}
                  {latestVital.pulse_bpm && (
                    <div className="bg-cream rounded-sm p-3 text-center">
                      <p className="text-lg font-display font-semibold text-ink">{latestVital.pulse_bpm}</p>
                      <p className="text-[10px] text-slate-light mt-0.5">Pulse (bpm)</p>
                    </div>
                  )}
                  {latestVital.oxygen_saturation && (
                    <div className="bg-cream rounded-sm p-3 text-center">
                      <p className="text-lg font-display font-semibold text-ink">{latestVital.oxygen_saturation}%</p>
                      <p className="text-[10px] text-slate-light mt-0.5">O₂ Sat</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card><CardBody><EmptyState icon="📈" title="No vitals recorded" description="Patient has not logged any vitals yet." /></CardBody></Card>
          )}
        </div>
      )}

      {/* PRESCRIPTIONS TAB */}
      {activeTab === 'prescriptions' && (
        <Card>
          <CardHeader
            title="Prescriptions"
            subtitle={`${prescriptions.filter(p => p.status === 'active').length} active`}
            right={<Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setRxModal(true)}>New Rx</Button>}
          />
          <CardBody>
            {rxLoading ? <div className="flex justify-center py-8"><Spinner size={22} className="text-sage" /></div>
              : prescriptions.length === 0 ? <EmptyState icon="💊" title="No prescriptions yet" description="Write a new prescription for this patient." />
              : (
                <div className="space-y-3">
                  {prescriptions.map(rx => (
                    <div key={rx.id} className="flex items-start gap-3 border border-border rounded-sm p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-ink">{rx.medicine_name}</p>
                          <Badge label={STATUS_BADGE[rx.status]?.label ?? rx.status} variant={STATUS_BADGE[rx.status]?.variant ?? 'slate'} />
                        </div>
                        <p className="text-xs text-slate-light mt-0.5">
                          {[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' · ')}
                        </p>
                        {rx.instructions && <p className="text-xs text-slate-light italic mt-0.5">{rx.instructions}</p>}
                        <p className="text-[11px] text-slate-lighter mt-1">{format(new Date(rx.created_at), 'MMM d, yyyy')}</p>
                      </div>
                      {rx.status === 'active' && (
                        <button
                          onClick={() => setStopId(rx.id)}
                          className="w-8 h-8 rounded-full hover:bg-rose/10 flex items-center justify-center text-slate-lighter hover:text-rose transition-colors"
                          aria-label="Stop prescription"
                        >
                          <StopCircle size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </CardBody>
        </Card>
      )}

      {/* VISITS TAB */}
      {activeTab === 'visits' && (
        <Card>
          <CardHeader title="Doctor Visits" right={<Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setVisitModal(true)}>Log Visit</Button>} />
          <CardBody>
            {visitsLoading ? <div className="flex justify-center py-8"><Spinner size={22} className="text-sage" /></div>
              : visits.length === 0 ? <EmptyState icon="🏥" title="No visits logged" description="Log this patient's visit notes and diagnosis." />
              : (
                <div className="space-y-3">
                  {visits.map(v => (
                    <div key={v.id} className="border border-border rounded-sm p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-semibold text-ink">{format(new Date(v.visit_date), 'MMMM d, yyyy')}</p>
                        {v.hospital && <span className="text-xs text-slate-light">{v.hospital}</span>}
                      </div>
                      {v.reason && <p className="text-xs text-slate-light mb-1"><strong>Reason:</strong> {v.reason}</p>}
                      {v.diagnosis && <p className="text-xs text-slate-light mb-1"><strong>Diagnosis:</strong> {v.diagnosis}</p>}
                      {v.tests_ordered && <p className="text-xs text-slate-light mb-1"><strong>Tests:</strong> {v.tests_ordered}</p>}
                      {v.next_visit_date && <p className="text-xs text-sage">Next visit: {format(new Date(v.next_visit_date), 'MMM d, yyyy')}</p>}
                      {v.notes && <p className="text-xs text-slate-light italic mt-1">{v.notes}</p>}
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
          <CardHeader title="Appointments" right={<Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setApptModal(true)}>Schedule</Button>} />
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
                      <Badge label={STATUS_BADGE[appt.status]?.label ?? appt.status} variant={STATUS_BADGE[appt.status]?.variant ?? 'slate'} />
                      {appt.status === 'scheduled' && (
                        <button
                          onClick={async () => { await updateAppointment.mutateAsync({ id: appt.id, values: { status: 'completed' } }); toast.success('Marked as completed') }}
                          className="text-[11px] font-semibold text-sage hover:text-sage-dark transition-colors"
                        >Complete</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </CardBody>
        </Card>
      )}

      {/* MODALS */}
      <Modal open={rxModal} onClose={() => setRxModal(false)} title="New Prescription" maxWidth={480}>
        <div className="space-y-4">
          <Input label="Medicine Name" value={rxForm.medicine_name} onChange={e => setRxForm(f => ({...f, medicine_name: e.target.value}))} placeholder="e.g. Metformin 500mg" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Dosage" value={rxForm.dosage} onChange={e => setRxForm(f => ({...f, dosage: e.target.value}))} placeholder="e.g. 1 tablet" />
            <Input label="Frequency" value={rxForm.frequency} onChange={e => setRxForm(f => ({...f, frequency: e.target.value}))} placeholder="e.g. Twice daily" />
          </div>
          <Input label="Duration" value={rxForm.duration} onChange={e => setRxForm(f => ({...f, duration: e.target.value}))} placeholder="e.g. 30 days" />
          <Input label="Instructions" value={rxForm.instructions} onChange={e => setRxForm(f => ({...f, instructions: e.target.value}))} placeholder="e.g. Take after meals" />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setRxModal(false)}>Cancel</Button>
            <Button fullWidth onClick={handleCreateRx} isLoading={createPrescription.isPending} disabled={!rxForm.medicine_name.trim()}>Add Prescription</Button>
          </div>
        </div>
      </Modal>

      <Modal open={visitModal} onClose={() => setVisitModal(false)} title="Log Visit" maxWidth={520}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Visit Date" type="date" value={visitForm.visit_date} onChange={e => setVisitForm(f => ({...f, visit_date: e.target.value}))} />
            <Input label="Hospital / Clinic" value={visitForm.hospital} onChange={e => setVisitForm(f => ({...f, hospital: e.target.value}))} placeholder="Name of hospital" />
          </div>
          <Input label="Reason for Visit" value={visitForm.reason} onChange={e => setVisitForm(f => ({...f, reason: e.target.value}))} placeholder="e.g. Routine check-up" />
          <Input label="Diagnosis" value={visitForm.diagnosis} onChange={e => setVisitForm(f => ({...f, diagnosis: e.target.value}))} placeholder="e.g. Type 2 diabetes, controlled" />
          <Input label="Changes Made" value={visitForm.changes_made} onChange={e => setVisitForm(f => ({...f, changes_made: e.target.value}))} placeholder="e.g. Increased Metformin to 1000mg" />
          <Input label="Tests Ordered" value={visitForm.tests_ordered} onChange={e => setVisitForm(f => ({...f, tests_ordered: e.target.value}))} placeholder="e.g. HbA1c, CBC" />
          <Input label="Next Visit Date" type="date" value={visitForm.next_visit_date} onChange={e => setVisitForm(f => ({...f, next_visit_date: e.target.value}))} />
          <Input label="Notes" value={visitForm.notes} onChange={e => setVisitForm(f => ({...f, notes: e.target.value}))} placeholder="Any additional notes" />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setVisitModal(false)}>Cancel</Button>
            <Button fullWidth onClick={handleLogVisit} isLoading={logVisit.isPending}>Log Visit</Button>
          </div>
        </div>
      </Modal>

      <Modal open={apptModal} onClose={() => setApptModal(false)} title="Schedule Appointment" maxWidth={440}>
        <div className="space-y-4">
          <Input label="Date & Time" type="datetime-local" value={apptForm.scheduled_at} onChange={e => setApptForm(f => ({...f, scheduled_at: e.target.value}))} />
          <Input label="Reason" value={apptForm.reason} onChange={e => setApptForm(f => ({...f, reason: e.target.value}))} placeholder="e.g. Follow-up" />
          <Input label="Location" value={apptForm.location} onChange={e => setApptForm(f => ({...f, location: e.target.value}))} placeholder="e.g. Main hospital, Room 5" />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setApptModal(false)}>Cancel</Button>
            <Button fullWidth onClick={handleCreateAppt} isLoading={createAppointment.isPending} disabled={!apptForm.scheduled_at}>Schedule</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!stopId}
        onClose={() => setStopId(null)}
        onConfirm={async () => {
          if (!stopId) return
          try { await stopPrescription.mutateAsync({ id: stopId }); toast.success('Prescription stopped') }
          catch { toast.danger('Could not stop prescription') }
          finally { setStopId(null) }
        }}
        title="Stop Prescription"
        message="This prescription will be marked as stopped. The patient and caregiver will be notified."
        confirmLabel="Stop"
        variant="amber"
        isLoading={stopPrescription.isPending}
      />
    </div>
  )
}

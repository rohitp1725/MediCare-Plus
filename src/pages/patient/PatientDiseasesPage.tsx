import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, Stethoscope, AlertCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { useToast } from '@/components/toast/ToastProvider'
import { supabase } from '@/lib/supabase'

const SEVERITY_BADGE: Record<string, { label: string; variant: 'sage' | 'amber' | 'rose' }> = {
  mild: { label: 'Mild', variant: 'sage' },
  moderate: { label: 'Moderate', variant: 'amber' },
  severe: { label: 'Severe', variant: 'rose' },
}

interface ConditionForm {
  name: string
  diagnosed_date: string
  severity: 'mild' | 'moderate' | 'severe'
  treating_doctor: string
  notes: string
}

const MIGRATION_SQL = `-- Run this in your Supabase SQL Editor
create table if not exists public.patient_conditions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  diagnosed_date date,
  severity text check (severity in ('mild','moderate','severe')) default 'mild',
  treating_doctor text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.patient_conditions enable row level security;
create policy "patients_own_conditions" on public.patient_conditions
  using (patient_id in (select id from public.patients where profile_id = auth.uid()));
grant all on public.patient_conditions to authenticated;`

export function PatientDiseasesPage() {
  const { patientId, isLoading: patientLoading } = useMyPatientId()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showSQL, setShowSQL] = useState(false)
  const [form, setForm] = useState<ConditionForm>({
    name: '', diagnosed_date: '', severity: 'mild', treating_doctor: '', notes: ''
  })

  const query = useQuery({
    queryKey: ['patient-conditions', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_conditions' as any)
        .select('*')
        .eq('patient_id', patientId as string)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as unknown) as Array<{
        id: string
        name: string
        diagnosed_date: string | null
        severity: 'mild' | 'moderate' | 'severe'
        treating_doctor: string | null
        notes: string | null
        is_active: boolean
        created_at: string
      }>
    },
    retry: false,
  })

  const addCondition = useMutation({
    mutationFn: async (values: ConditionForm) => {
      const { error } = await (supabase.from('patient_conditions' as any) as any).insert({
        patient_id: patientId,
        name: values.name,
        diagnosed_date: values.diagnosed_date || null,
        severity: values.severity,
        treating_doctor: values.treating_doctor || null,
        notes: values.notes || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-conditions', patientId] })
      toast.success('Condition added')
      setModalOpen(false)
      setForm({ name: '', diagnosed_date: '', severity: 'mild', treating_doctor: '', notes: '' })
    },
    onError: (err: Error) => toast.danger('Could not add condition', err.message),
  })

  const deleteCondition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('patient_conditions' as any) as any).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-conditions', patientId] })
      toast.success('Condition removed')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.danger('Could not remove', err.message),
  })

  if (patientLoading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-sage" /></div>

  // Table doesn't exist yet
  if (query.isError) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Card>
          <CardBody>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber/12 flex items-center justify-center shrink-0">
                <AlertCircle size={20} className="text-amber" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-ink">Database migration needed</h3>
                <p className="text-xs text-slate-light mt-1 leading-relaxed">
                  The <code className="bg-cream px-1 rounded text-sage-dark">patient_conditions</code> table hasn't been created yet.
                  Run the SQL below in your Supabase SQL Editor to enable this feature.
                </p>
                <Button size="sm" variant="secondary" className="mt-3" onClick={() => setShowSQL(!showSQL)}>
                  {showSQL ? 'Hide SQL' : 'Show migration SQL'}
                </Button>
                {showSQL && (
                  <pre className="mt-3 bg-cream rounded-sm p-4 text-[11px] text-ink font-mono overflow-x-auto border border-border whitespace-pre-wrap">
                    {MIGRATION_SQL}
                  </pre>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  const conditions = query.data ?? []
  const active = conditions.filter(c => c.is_active)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-light">{active.length} active condition{active.length !== 1 ? 's' : ''}</p>
        <Button size="sm" leftIcon={<Plus size={15} />} onClick={() => setModalOpen(true)}>
          Add Condition
        </Button>
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={24} className="text-sage" /></div>
      ) : conditions.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="🩺"
              title="No conditions logged"
              description="Track your chronic conditions and medical history here."
              action={
                <Button leftIcon={<Plus size={15} />} onClick={() => setModalOpen(true)}>
                  Add First Condition
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {conditions.map(c => (
            <Card key={c.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sage/12 flex items-center justify-center shrink-0">
                      <Stethoscope size={18} className="text-sage-dark" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-ink">{c.name}</p>
                        <Badge label={SEVERITY_BADGE[c.severity].label} variant={SEVERITY_BADGE[c.severity].variant} dot />
                        {!c.is_active && <Badge label="Resolved" variant="slate" />}
                      </div>
                      {c.treating_doctor && (
                        <p className="text-xs text-slate-light mt-0.5">Dr. {c.treating_doctor}</p>
                      )}
                      {c.diagnosed_date && (
                        <p className="text-xs text-slate-light">Diagnosed: {format(new Date(c.diagnosed_date), 'MMM d, yyyy')}</p>
                      )}
                      {c.notes && <p className="text-xs text-slate-lighter italic mt-1">{c.notes}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteId(c.id)}
                    className="w-8 h-8 rounded-full hover:bg-rose/10 flex items-center justify-center text-slate-lighter hover:text-rose transition-colors shrink-0"
                    aria-label="Remove condition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Condition" maxWidth={480}>
        <div className="space-y-4">
          <Input
            label="Condition Name"
            placeholder="e.g. Type 2 Diabetes, Hypertension"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Diagnosed Date"
              type="date"
              value={form.diagnosed_date}
              onChange={e => setForm(f => ({ ...f, diagnosed_date: e.target.value }))}
            />
            <Select
              label="Severity"
              value={form.severity}
              onChange={e => setForm(f => ({ ...f, severity: e.target.value as 'mild' | 'moderate' | 'severe' }))}
            >
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </Select>
          </div>
          <Input
            label="Treating Doctor"
            placeholder="Doctor's name (optional)"
            value={form.treating_doctor}
            onChange={e => setForm(f => ({ ...f, treating_doctor: e.target.value }))}
          />
          <Input
            label="Notes"
            placeholder="Any additional notes"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              fullWidth
              onClick={() => addCondition.mutate(form)}
              isLoading={addCondition.isPending}
              disabled={!form.name.trim()}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteCondition.mutate(deleteId) }}
        title="Remove Condition"
        message="This condition record will be permanently removed."
        confirmLabel="Remove"
        isLoading={deleteCondition.isPending}
      />
    </div>
  )
}

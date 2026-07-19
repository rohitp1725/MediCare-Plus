import { useState } from 'react'
import { Check, X as XIcon, SkipForward } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useMyPatientId } from '@/hooks/useMyPatientId'
import { useTodayDoses, type TodayDose } from '@/hooks/useTodayDoses'
import { useToast } from '@/components/toast/ToastProvider'
import { formatTime12h } from '@/lib/formatTime'
import type { DoseStatus } from '@/types/database'

const STATUS_META: Record<DoseStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-cream text-slate-light' },
  taken: { label: 'Taken', className: 'bg-sage/15 text-sage-dark' },
  missed: { label: 'Missed', className: 'bg-rose/15 text-[#8B2020]' },
  skipped: { label: 'Skipped', className: 'bg-amber/15 text-[#8B5000]' },
}

function DoseRow({
  dose,
  onMark,
}: {
  dose: TodayDose
  onMark: (status: DoseStatus, reason?: string) => void
}) {
  const [skipMode, setSkipMode] = useState(false)
  const [reason, setReason] = useState('')
  const statusMeta = STATUS_META[dose.status]

  return (
    <div className="border border-border rounded-md p-4">
      <div className="flex items-center gap-3">
        <div className="text-xl shrink-0">💊</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">{dose.medicine?.name ?? 'Medicine'}</p>
          <p className="text-xs text-slate-light">
            {formatTime12h(dose.scheduled_time)}
            {dose.medicine?.strength ? ` · ${dose.medicine.strength}` : ''}
            {dose.medicine?.food_instruction ? ` · ${dose.medicine.food_instruction}` : ''}
          </p>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusMeta.className}`}>
          {statusMeta.label}
        </span>
      </div>

      {!skipMode ? (
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant={dose.status === 'taken' ? 'primary' : 'secondary'}
            leftIcon={<Check size={14} />}
            onClick={() => onMark('taken')}
          >
            Taken
          </Button>
          <Button
            size="sm"
            variant={dose.status === 'missed' ? 'danger' : 'secondary'}
            leftIcon={<XIcon size={14} />}
            onClick={() => onMark('missed')}
          >
            Missed
          </Button>
          <Button
            size="sm"
            variant={dose.status === 'skipped' ? 'amber' : 'secondary'}
            leftIcon={<SkipForward size={14} />}
            onClick={() => setSkipMode(true)}
          >
            Skip
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 mt-3">
          <input
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for skipping"
            className="flex-1 text-sm border-[1.5px] border-border rounded-sm px-3 py-2 outline-none focus:border-sage font-sans text-ink"
          />
          <Button
            size="sm"
            onClick={() => {
              onMark('skipped', reason)
              setSkipMode(false)
              setReason('')
            }}
          >
            Confirm
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setSkipMode(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

export function PatientTrackerPage() {
  const { patientId, isLoading: patientLoading } = useMyPatientId()
  const { doses, isLoading, markStatus } = useTodayDoses(patientId)
  const toast = useToast()

  if (patientLoading || isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} className="text-sage" />
      </div>
    )
  }

  async function handleMark(doseId: string, status: DoseStatus, reason?: string) {
    try {
      await markStatus.mutateAsync({ id: doseId, status, reason })
    } catch (err) {
      toast.danger('Couldn\u2019t update dose', err instanceof Error ? err.message : undefined)
    }
  }

  if (doses.length === 0) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            icon="📋"
            title="Nothing scheduled for today"
            description="Once your caregiver adds active medicines, today's doses will appear here."
          />
        </CardBody>
      </Card>
    )
  }

  const taken = doses.filter((d) => d.status === 'taken').length

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-light">
        {taken} of {doses.length} doses taken today
      </p>
      <div className="space-y-3">
        {doses.map((dose) => (
          <DoseRow key={dose.id} dose={dose} onMark={(status, reason) => handleMark(dose.id, status, reason)} />
        ))}
      </div>
    </div>
  )
}

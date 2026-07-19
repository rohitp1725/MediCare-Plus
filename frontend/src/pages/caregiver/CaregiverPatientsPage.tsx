import { useState } from 'react'
import { Link } from 'react-router-dom'
import { differenceInYears } from 'date-fns'
import { UserPlus, ChevronRight } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { LinkPatientModal } from '@/components/patient/LinkPatientModal'
import { useCaregiverHome } from '@/hooks/useCaregiverHome'
import { useLinkPatient } from '@/hooks/useLinkPatient'
import { useToast } from '@/components/toast/ToastProvider'
import type { LinkPatientFormValues } from '@/lib/validation/linkPatient'

export function CaregiverPatientsPage() {
  const { caregiverId, isLoading, isError, data } = useCaregiverHome()
  const linkPatient = useLinkPatient(caregiverId)
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const patients = data?.patients ?? []

  async function handleAddPatient(values: LinkPatientFormValues) {
    setFormError(null)
    try {
      const result = await linkPatient.mutateAsync(values)
      setModalOpen(false)
      toast.success('Patient added', `${result?.patient_full_name ?? 'Patient'} is now linked to your care list.`)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} className="text-sage" />
      </div>
    )
  }

  if (isError) {
    return <EmptyState icon="⚠️" title="Couldn't load your patients" description="Please refresh the page." />
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-light">
          {patients.length} patient{patients.length === 1 ? '' : 's'} under your care
        </p>
        <Button leftIcon={<UserPlus size={16} />} onClick={() => setModalOpen(true)}>
          Add Patient
        </Button>
      </div>

      {patients.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="👥"
              title="No patients linked yet"
              description="Add a patient who already has a MediCare+ account to start managing their medicines, vitals, and appointments."
              action={
                <Button leftIcon={<UserPlus size={16} />} onClick={() => setModalOpen(true)}>
                  Add your first patient
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {patients.map((p) => (
            <Link key={p.patientId} to={`/caregiver/patients/${p.patientId}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardBody className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-xl shrink-0">
                    {p.avatarEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{p.fullName}</p>
                    <p className="text-xs text-slate-light mt-0.5">
                      {p.dob ? `${differenceInYears(new Date(), new Date(p.dob))} years` : 'Age not set'}
                      {!p.isActive && ' · Inactive'}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-slate-lighter shrink-0" />
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <LinkPatientModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setFormError(null)
        }}
        onSubmit={handleAddPatient}
        isSubmitting={linkPatient.isPending}
        error={formError}
      />
    </div>
  )
}

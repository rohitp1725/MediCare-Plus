import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { linkPatientSchema, type LinkPatientFormValues } from '@/lib/validation/linkPatient'

interface LinkPatientModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: LinkPatientFormValues) => Promise<void>
  isSubmitting: boolean
  error?: string | null
}

export function LinkPatientModal({ open, onClose, onSubmit, isSubmitting, error }: LinkPatientModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LinkPatientFormValues>({ resolver: zodResolver(linkPatientSchema) })

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Add a Patient"
      maxWidth={440}
    >
      <p className="text-xs text-slate-light mb-4">
        The patient needs their own MediCare+ account first. Enter the email they signed up with to link them to
        your care list.
      </p>
      <form
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values)
          reset()
        })}
        noValidate
        className="space-y-4"
      >
        <Input
          label="Patient's Email"
          type="email"
          placeholder="patient@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input label="Relation (optional)" placeholder="e.g. Daughter, Son, Spouse" {...register('relation')} />

        {error && (
          <div className="bg-[#FDECEA] border border-rose-light rounded-sm px-3.5 py-2.5 flex items-center gap-2 text-[13px] text-[#8B2020]">
            <AlertTriangle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>
            Add Patient
          </Button>
        </div>
      </form>
    </Modal>
  )
}

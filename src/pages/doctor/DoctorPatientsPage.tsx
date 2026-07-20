import { useState } from 'react'
import { Link } from 'react-router-dom'
import { differenceInYears } from 'date-fns'
import { Search, UserPlus, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { useDoctorHome } from '@/hooks/useDoctorHome'
import { useLinkDoctor } from '@/hooks/useLinkDoctor'
import { useToast } from '@/components/toast/ToastProvider'

export function DoctorPatientsPage() {
  const { doctorId, isLoading, isError, data } = useDoctorHome()
  const linkDoctor = useLinkDoctor(doctorId)
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [linkOpen, setLinkOpen] = useState(false)
  const [email, setEmail] = useState('')

  const patients = (data?.patients ?? []).filter(p =>
    search === '' || p.fullName.toLowerCase().includes(search.toLowerCase())
  )

  async function handleLink() {
    if (!email.trim()) return
    try {
      const result = await linkDoctor.mutateAsync(email.trim())
      toast.success(`Linked to ${result?.patient_full_name ?? 'patient'} successfully`)
      setLinkOpen(false)
      setEmail('')
    } catch (err) {
      toast.danger('Could not link patient', err instanceof Error ? err.message : undefined)
    }
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-sage" /></div>
  if (isError) return <EmptyState icon="⚠️" title="Couldn't load patients" description="Please refresh the page." />

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-light" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patients..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border-[1.5px] border-border rounded-sm bg-paper text-ink placeholder:text-slate-lighter outline-none focus:border-sage font-sans"
          />
        </div>
        <Button leftIcon={<UserPlus size={15} />} onClick={() => setLinkOpen(true)}>Link Patient</Button>
      </div>

      <Card>
        <CardHeader
          title="My Patients"
          subtitle={`${patients.length} patient${patients.length !== 1 ? 's' : ''}`}
        />
        <CardBody>
          {patients.length === 0 ? (
            <EmptyState
              icon="🧑🤝🧑"
              title={search ? 'No patients match your search' : 'No patients yet'}
              description={search ? 'Try a different name.' : 'Link a patient by their email to get started.'}
              action={!search ? <Button leftIcon={<UserPlus size={15} />} onClick={() => setLinkOpen(true)}>Link Patient</Button> : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {patients.map(p => (
                <Link key={p.patientId} to={`/doctor/patients/${p.patientId}`} className="group flex items-center gap-3 border border-border rounded-sm p-3 hover:border-sage hover:bg-sage/5 transition-all">
                  <div className="w-11 h-11 rounded-full bg-cream flex items-center justify-center text-xl shrink-0">{p.avatarEmoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{p.fullName}</p>
                    <p className="text-xs text-slate-light">{p.dob ? `${differenceInYears(new Date(), new Date(p.dob))} yrs` : 'Age unknown'}</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-lighter group-hover:text-sage transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal open={linkOpen} onClose={() => { setLinkOpen(false); setEmail('') }} title="Link Patient by Email" maxWidth={420}>
        <div className="space-y-4">
          <p className="text-sm text-slate-light">Enter the email address of the patient's MediCare+ account. They must have already signed up as a patient.</p>
          <Input
            label="Patient Email"
            type="email"
            placeholder="patient@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => { setLinkOpen(false); setEmail('') }}>Cancel</Button>
            <Button fullWidth onClick={handleLink} isLoading={linkDoctor.isPending} disabled={!email.trim()}>Link Patient</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

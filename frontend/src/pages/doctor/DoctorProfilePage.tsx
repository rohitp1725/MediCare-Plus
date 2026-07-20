import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/toast/ToastProvider'
import { useDoctorId } from '@/hooks/useDoctorId'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

const EMOJI_OPTIONS = ['🩺', '👨⚕️', '👩⚕️', '🧑⚕️', '💊', '🏥', '👤']

interface DoctorProfileForm {
  full_name: string
  phone: string
  specialization: string
  hospital_name: string
  license_number: string
}

export function DoctorProfilePage() {
  const { profile, user, refreshProfile } = useAuth()
  const { doctorId, doctorData, isLoading } = useDoctorId()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [selectedEmoji, setSelectedEmoji] = useState(profile?.avatarEmoji ?? '🩺')
  const [emojiOpen, setEmojiOpen] = useState(false)

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<DoctorProfileForm>({
    values: {
      full_name: profile?.fullName ?? '',
      phone: profile?.phone ?? '',
      specialization: doctorData?.specialization ?? '',
      hospital_name: doctorData?.hospital_name ?? '',
      license_number: doctorData?.license_number ?? '',
    },
  })

  async function onSubmit(values: DoctorProfileForm) {
    try {
      const [profileRes, doctorRes] = await Promise.all([
        supabase.from('profiles').update({
          full_name: values.full_name,
          phone: values.phone || null,
          avatar_emoji: selectedEmoji,
        }).eq('id', user!.id),
        doctorId ? supabase.from('doctors').update({
          specialization: values.specialization || null,
          hospital_name: values.hospital_name || null,
          license_number: values.license_number || null,
        }).eq('id', doctorId) : Promise.resolve({ error: null }),
      ])
      if (profileRes.error) throw profileRes.error
      if (doctorRes.error) throw doctorRes.error
      await refreshProfile()
      queryClient.invalidateQueries({ queryKey: ['me-doctor'] })
      toast.success('Profile updated')
    } catch (err) {
      toast.danger('Could not update profile', err instanceof Error ? err.message : undefined)
    }
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-sage" /></div>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <Card>
        <CardHeader title="Avatar" />
        <CardBody>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full bg-sage/15 flex items-center justify-center text-3xl cursor-pointer hover:bg-sage/25 transition-colors border-2 border-border hover:border-sage"
              onClick={() => setEmojiOpen(!emojiOpen)}
            >
              {selectedEmoji}
            </div>
            <div>
              <p className="text-sm font-medium text-ink">{profile?.fullName}</p>
              <p className="text-xs text-slate-light">Doctor · {doctorData?.specialization ?? 'General Physician'}</p>
              <p className="text-xs text-sage mt-1 cursor-pointer" onClick={() => setEmojiOpen(!emojiOpen)}>Change avatar</p>
            </div>
          </div>
          {emojiOpen && (
            <div className="mt-3 flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button key={e} type="button" onClick={() => { setSelectedEmoji(e); setEmojiOpen(false) }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 transition-colors ${
                    selectedEmoji === e ? 'border-sage bg-sage/10' : 'border-transparent hover:border-border hover:bg-cream'
                  }`}>
                  {e}
                </button>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Personal Information" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" {...register('full_name')} />
            <Input label="Phone" type="tel" {...register('phone')} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Professional Details" />
        <CardBody className="space-y-4">
          <Input label="Specialization" placeholder="e.g. Cardiologist, General Physician" {...register('specialization')} />
          <Input label="Hospital / Clinic" placeholder="Name of your practice" {...register('hospital_name')} />
          <Input label="License Number" placeholder="Medical license number" {...register('license_number')} />
        </CardBody>
      </Card>

      <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting}>Save Profile</Button>
    </form>
  )
}

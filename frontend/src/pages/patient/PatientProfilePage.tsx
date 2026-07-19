import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/toast/ToastProvider'
import { supabase } from '@/lib/supabase'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMyPatientId } from '@/hooks/useMyPatientId'

const EMOJI_OPTIONS = ['👤', '👴', '👵', '🧓', '👨', '👩', '🧑', '👦', '👧', '🧒']

interface ProfileForm {
  full_name: string
  phone: string
  dob: string
  gender: string
  blood_group: string
  height_cm: string
  weight_kg: string
  address: string
  emergency_contact_name: string
  emergency_contact_phone: string
  allergies_raw: string
}

export function PatientProfilePage() {
  const { profile, user, refreshProfile } = useAuth()
  const { patientId } = useMyPatientId()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [selectedEmoji, setSelectedEmoji] = useState(profile?.avatarEmoji ?? '👤')
  const [emojiOpen, setEmojiOpen] = useState(false)

  const { data: patientData, isLoading } = useQuery({
    queryKey: ['patient-profile-full', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('dob, gender, blood_group, height_cm, weight_kg, address, emergency_contact_name, emergency_contact_phone, allergies')
        .eq('id', patientId as string)
        .single()
      if (error) throw error
      return data
    },
  })

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ProfileForm>({
    values: {
      full_name: profile?.fullName ?? '',
      phone: profile?.phone ?? '',
      dob: patientData?.dob ?? '',
      gender: patientData?.gender ?? '',
      blood_group: patientData?.blood_group ?? '',
      height_cm: patientData?.height_cm?.toString() ?? '',
      weight_kg: patientData?.weight_kg?.toString() ?? '',
      address: patientData?.address ?? '',
      emergency_contact_name: patientData?.emergency_contact_name ?? '',
      emergency_contact_phone: patientData?.emergency_contact_phone ?? '',
      allergies_raw: (patientData?.allergies ?? []).join(', '),
    },
  })

  async function onSubmit(values: ProfileForm) {
    try {
      const [profileRes, patientRes] = await Promise.all([
        supabase.from('profiles').update({
          full_name: values.full_name,
          phone: values.phone || null,
          avatar_emoji: selectedEmoji,
        }).eq('id', user!.id),
        supabase.from('patients').update({
          dob: values.dob || null,
          gender: values.gender || null,
          blood_group: values.blood_group || null,
          height_cm: values.height_cm ? Number(values.height_cm) : null,
          weight_kg: values.weight_kg ? Number(values.weight_kg) : null,
          address: values.address || null,
          emergency_contact_name: values.emergency_contact_name || null,
          emergency_contact_phone: values.emergency_contact_phone || null,
          allergies: values.allergies_raw
            ? values.allergies_raw.split(',').map(a => a.trim()).filter(Boolean)
            : [],
        }).eq('id', patientId as string),
      ])
      if (profileRes.error) throw profileRes.error
      if (patientRes.error) throw patientRes.error
      await refreshProfile()
      queryClient.invalidateQueries({ queryKey: ['patient-profile-full'] })
      toast.success('Profile updated')
    } catch (err) {
      toast.danger('Could not update profile', err instanceof Error ? err.message : undefined)
    }
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size={28} className="text-sage" /></div>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      {/* Avatar */}
      <Card>
        <CardHeader title="Avatar" />
        <CardBody>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full bg-sage/15 flex items-center justify-center text-3xl cursor-pointer hover:bg-sage/25 transition-colors border-2 border-border hover:border-sage"
              onClick={() => setEmojiOpen(!emojiOpen)}
              title="Click to change avatar"
            >
              {selectedEmoji}
            </div>
            <div>
              <p className="text-sm font-medium text-ink">{profile?.fullName}</p>
              <p className="text-xs text-slate-light capitalize">{profile?.role}</p>
              <p className="text-xs text-sage mt-1 cursor-pointer" onClick={() => setEmojiOpen(!emojiOpen)}>Change avatar</p>
            </div>
          </div>
          {emojiOpen && (
            <div className="mt-3 flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { setSelectedEmoji(e); setEmojiOpen(false) }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 transition-colors ${
                    selectedEmoji === e ? 'border-sage bg-sage/10' : 'border-transparent hover:border-border hover:bg-cream'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader title="Personal Information" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" {...register('full_name')} />
            <Input label="Phone" type="tel" {...register('phone')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Date of Birth" type="date" {...register('dob')} />
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-slate">Gender</label>
              <select {...register('gender')} className="w-full outline-none border-[1.5px] border-border focus:border-sage rounded-sm px-3.5 py-2.5 text-sm bg-paper text-ink font-sans">
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-slate">Blood Group</label>
              <select {...register('blood_group')} className="w-full outline-none border-[1.5px] border-border focus:border-sage rounded-sm px-3.5 py-2.5 text-sm bg-paper text-ink font-sans">
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <Input label="Height (cm)" type="number" {...register('height_cm')} />
            <Input label="Weight (kg)" type="number" step="0.1" {...register('weight_kg')} />
          </div>
          <Input label="Address" placeholder="Home address" {...register('address')} />
        </CardBody>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader title="Emergency Contact" />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contact Name" placeholder="Full name" {...register('emergency_contact_name')} />
            <Input label="Contact Phone" type="tel" placeholder="Phone number" {...register('emergency_contact_phone')} />
          </div>
        </CardBody>
      </Card>

      {/* Allergies */}
      <Card>
        <CardHeader title="Allergies" subtitle="Comma-separated list" />
        <CardBody>
          <Input
            label="Known Allergies"
            placeholder="e.g. Penicillin, Aspirin, Peanuts"
            {...register('allergies_raw')}
          />
        </CardBody>
      </Card>

      <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting}>
        Save Profile
      </Button>
    </form>
  )
}

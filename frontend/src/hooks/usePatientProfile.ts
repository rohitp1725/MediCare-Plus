import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function usePatientProfile(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient-profile', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id, profile_id, dob, gender, blood_group, is_active, allergies')
        .eq('id', patientId as string)
        .single()
      if (patientError) throw patientError

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_emoji, phone')
        .eq('id', patient.profile_id)
        .single()
      if (profileError) throw profileError

      return { ...patient, fullName: profile.full_name, avatarEmoji: profile.avatar_emoji ?? '👤', phone: profile.phone }
    },
  })
}

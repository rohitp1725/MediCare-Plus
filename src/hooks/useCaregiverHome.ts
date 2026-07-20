import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export interface CaregiverPatientSummary {
  patientId: string
  fullName: string
  avatarEmoji: string
  dob: string | null
  isActive: boolean
}

export function useCaregiverHome() {
  const { user } = useAuth()

  const caregiverQuery = useQuery({
    queryKey: ['me-caregiver', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('caregivers').select('id').eq('profile_id', user!.id).single()
      if (error) throw error
      return data
    },
  })

  const caregiverId = caregiverQuery.data?.id

  const summaryQuery = useQuery({
    queryKey: ['caregiver-home-summary', caregiverId],
    enabled: !!caregiverId,
    queryFn: async () => {
      const { data: links, error: linksError } = await supabase
        .from('patient_caregiver')
        .select('patient_id')
        .eq('caregiver_id', caregiverId as string)
        .eq('status', 'active')
      if (linksError) throw linksError

      const patientIds = links.map((l) => l.patient_id)
      if (patientIds.length === 0) {
        return { patients: [] as CaregiverPatientSummary[], lowStockCount: 0 }
      }

      const [patientsRes, lowStockRes] = await Promise.all([
        supabase.from('patients').select('id, profile_id, dob, is_active').in('id', patientIds),
        supabase.from('medicines').select('id, stock_quantity, refill_threshold').in('patient_id', patientIds).eq('is_active', true),
      ])
      if (patientsRes.error) throw patientsRes.error
      if (lowStockRes.error) throw lowStockRes.error

      const profileIds = patientsRes.data.map((p) => p.profile_id)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_emoji')
        .in('id', profileIds)
      if (profilesError) throw profilesError

      const patients: CaregiverPatientSummary[] = patientsRes.data.map((p) => {
        const profile = profiles.find((pr) => pr.id === p.profile_id)
        return {
          patientId: p.id,
          fullName: profile?.full_name ?? 'Unknown',
          avatarEmoji: profile?.avatar_emoji ?? '👤',
          dob: p.dob,
          isActive: p.is_active,
        }
      })

      const lowStockCount = lowStockRes.data.filter((m) => m.stock_quantity <= m.refill_threshold).length

      return { patients, lowStockCount }
    },
  })

  return {
    caregiverId,
    isLoading: caregiverQuery.isLoading || summaryQuery.isLoading,
    isError: caregiverQuery.isError || summaryQuery.isError,
    data: summaryQuery.data,
  }
}

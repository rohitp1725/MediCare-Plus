import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export interface DoctorPatientSummary {
  patientId: string
  fullName: string
  avatarEmoji: string
  dob: string | null
}

export function useDoctorHome() {
  const { user } = useAuth()

  const doctorQuery = useQuery({
    queryKey: ['me-doctor', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, specialization, hospital_name')
        .eq('profile_id', user!.id)
        .single()
      if (error) throw error
      return data
    },
  })

  const doctorId = doctorQuery.data?.id

  const summaryQuery = useQuery({
    queryKey: ['doctor-home-summary', doctorId],
    enabled: !!doctorId,
    queryFn: async () => {
      const { data: links, error: linksError } = await supabase
        .from('patient_doctor')
        .select('patient_id')
        .eq('doctor_id', doctorId as string)
        .eq('status', 'active')
      if (linksError) throw linksError

      const patientIds = links.map((l) => l.patient_id)

      const nowIso = new Date().toISOString()
      const apptCountRes = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', doctorId as string)
        .eq('status', 'scheduled')
        .gte('scheduled_at', nowIso)
      if (apptCountRes.error) throw apptCountRes.error

      if (patientIds.length === 0) {
        return { patients: [] as DoctorPatientSummary[], upcomingAppointmentCount: apptCountRes.count ?? 0 }
      }

      const [patientsRes, profilesRes] = await Promise.all([
        supabase.from('patients').select('id, profile_id, dob').in('id', patientIds),
        supabase.from('profiles').select('id, full_name, avatar_emoji'),
      ])
      if (patientsRes.error) throw patientsRes.error
      if (profilesRes.error) throw profilesRes.error

      const patients: DoctorPatientSummary[] = patientsRes.data.map((p) => {
        const profile = profilesRes.data.find((pr) => pr.id === p.profile_id)
        return {
          patientId: p.id,
          fullName: profile?.full_name ?? 'Unknown',
          avatarEmoji: profile?.avatar_emoji ?? '👤',
          dob: p.dob,
        }
      })

      return { patients, upcomingAppointmentCount: apptCountRes.count ?? 0 }
    },
  })

  return {
    doctorId,
    isLoading: doctorQuery.isLoading || summaryQuery.isLoading,
    isError: doctorQuery.isError || summaryQuery.isError,
    data: summaryQuery.data,
  }
}

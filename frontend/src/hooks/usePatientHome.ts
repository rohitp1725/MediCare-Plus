import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function usePatientHome() {
  const { user } = useAuth()

  const patientQuery = useQuery({
    queryKey: ['me-patient', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, dob, blood_group')
        .eq('profile_id', user!.id)
        .single()
      if (error) throw error
      return data
    },
  })

  const patientId = patientQuery.data?.id

  const summaryQuery = useQuery({
    queryKey: ['patient-home-summary', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const nowIso = new Date().toISOString()

      const [activeMedsRes, todayDosesRes, nextApptRes] = await Promise.all([
        supabase
          .from('medicines')
          .select('id', { count: 'exact', head: true })
          .eq('patient_id', patientId as string)
          .eq('is_active', true),
        supabase
          .from('dose_logs')
          .select('status')
          .eq('patient_id', patientId as string)
          .eq('scheduled_date', today),
        supabase
          .from('appointments')
          .select('id, scheduled_at, reason, location')
          .eq('patient_id', patientId as string)
          .eq('status', 'scheduled')
          .gte('scheduled_at', nowIso)
          .order('scheduled_at')
          .limit(1)
          .maybeSingle(),
      ])

      if (activeMedsRes.error) throw activeMedsRes.error
      if (todayDosesRes.error) throw todayDosesRes.error
      if (nextApptRes.error) throw nextApptRes.error

      const doses = todayDosesRes.data ?? []
      const doseStats = {
        total: doses.length,
        taken: doses.filter((d) => d.status === 'taken').length,
        missed: doses.filter((d) => d.status === 'missed').length,
        skipped: doses.filter((d) => d.status === 'skipped').length,
        pending: doses.filter((d) => d.status === 'pending').length,
      }

      return {
        activeMedicineCount: activeMedsRes.count ?? 0,
        doseStats,
        nextAppointment: nextApptRes.data,
      }
    },
  })

  return {
    patientId,
    isLoading: patientQuery.isLoading || summaryQuery.isLoading,
    isError: patientQuery.isError || summaryQuery.isError,
    data: summaryQuery.data,
  }
}

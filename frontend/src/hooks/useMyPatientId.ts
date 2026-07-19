import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function useMyPatientId() {
  const { user } = useAuth()

  const query = useQuery({
    queryKey: ['me-patient-id', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('patients').select('id').eq('profile_id', user!.id).single()
      if (error) throw error
      return data.id
    },
  })

  return { patientId: query.data, isLoading: query.isLoading, isError: query.isError }
}

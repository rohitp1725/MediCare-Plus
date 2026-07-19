import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function useDoctorId() {
  const { user } = useAuth()

  const query = useQuery({
    queryKey: ['me-doctor', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, specialization, hospital_name, license_number')
        .eq('profile_id', user!.id)
        .single()
      if (error) throw error
      return data
    },
  })

  return {
    doctorId: query.data?.id,
    doctorData: query.data,
    isLoading: query.isLoading,
  }
}

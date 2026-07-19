import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface VitalFormValues {
  blood_pressure_systolic?: number | null
  blood_pressure_diastolic?: number | null
  glucose_mg_dl?: number | null
  pulse_bpm?: number | null
  oxygen_saturation?: number | null
  weight_kg?: number | null
  temperature_f?: number | null
  notes?: string | null
}

export function useVitals(patientId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['vitals', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vitals_logs')
        .select('*')
        .eq('patient_id', patientId as string)
        .order('recorded_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return data
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vitals', patientId] })

  const logVital = useMutation({
    mutationFn: async (values: VitalFormValues) => {
      const { error } = await supabase.from('vitals_logs').insert({
        patient_id: patientId as string,
        ...values,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const deleteVital = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vitals_logs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return {
    vitals: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    logVital,
    deleteVital,
  }
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface SymptomFormValues {
  symptom: string
  severity: 'mild' | 'moderate' | 'severe'
  duration?: string | null
  timing_note?: string | null
  notes?: string | null
  is_emergency?: boolean
  doctor_informed?: boolean
}

export function useSymptoms(patientId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['symptoms', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('symptom_logs')
        .select('*')
        .eq('patient_id', patientId as string)
        .order('onset_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return data
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['symptoms', patientId] })

  const logSymptom = useMutation({
    mutationFn: async (values: SymptomFormValues) => {
      const { error } = await supabase.from('symptom_logs').insert({
        patient_id: patientId as string,
        symptom: values.symptom,
        severity: values.severity,
        duration: values.duration ?? null,
        timing_note: values.timing_note ?? null,
        notes: values.notes ?? null,
        is_emergency: values.is_emergency ?? false,
        doctor_informed: values.doctor_informed ?? false,
        onset_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const deleteSymptom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('symptom_logs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return {
    symptoms: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    logSymptom,
    deleteSymptom,
  }
}

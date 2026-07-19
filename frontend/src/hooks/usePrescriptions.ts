import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface PrescriptionFormValues {
  medicine_name: string
  dosage?: string | null
  frequency?: string | null
  duration?: string | null
  instructions?: string | null
}

export function usePrescriptions(patientId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['prescriptions', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId as string)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['prescriptions', patientId] })

  const createPrescription = useMutation({
    mutationFn: async ({ values, doctorId }: { values: PrescriptionFormValues; doctorId: string }) => {
      const { error } = await supabase.from('prescriptions').insert({
        patient_id: patientId as string,
        doctor_id: doctorId,
        medicine_name: values.medicine_name,
        dosage: values.dosage ?? null,
        frequency: values.frequency ?? null,
        duration: values.duration ?? null,
        instructions: values.instructions ?? null,
        status: 'active',
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const stopPrescription = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { error } = await supabase
        .from('prescriptions')
        .update({
          status: 'stopped',
          stopped_at: new Date().toISOString(),
          stopped_reason: reason ?? null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return {
    prescriptions: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    createPrescription,
    stopPrescription,
  }
}

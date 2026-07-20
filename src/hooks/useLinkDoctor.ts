import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useLinkDoctor(doctorId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (patientEmail: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('link_doctor_to_patient', {
        p_patient_email: patientEmail,
        p_doctor_email: null,
      })
      if (error) throw new Error(error.message)
      return data?.[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-home-summary', doctorId] })
      queryClient.invalidateQueries({ queryKey: ['doctor-patients', doctorId] })
    },
  })
}

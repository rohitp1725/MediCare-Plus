import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LinkPatientFormValues } from '@/lib/validation/linkPatient'

export function useLinkPatient(caregiverId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: LinkPatientFormValues) => {
      const { data, error } = await supabase.rpc('link_patient_by_email', {
        p_email: values.email,
        p_relation: values.relation || undefined,
      })
      if (error) throw new Error(error.message)
      return data?.[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caregiver-home-summary', caregiverId] })
    },
  })
}

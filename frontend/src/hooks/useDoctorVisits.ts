import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface DoctorVisitFormValues {
  visit_date: string
  hospital?: string | null
  reason?: string | null
  diagnosis?: string | null
  changes_made?: string | null
  tests_ordered?: string | null
  next_visit_date?: string | null
  notes?: string | null
}

export function useDoctorVisits(patientId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['doctor-visits', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctor_visits')
        .select('*')
        .eq('patient_id', patientId as string)
        .order('visit_date', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['doctor-visits', patientId] })

  const logVisit = useMutation({
    mutationFn: async ({ values, doctorId }: { values: DoctorVisitFormValues; doctorId: string }) => {
      const { error } = await supabase.from('doctor_visits').insert({
        patient_id: patientId as string,
        doctor_id: doctorId,
        visit_date: values.visit_date,
        hospital: values.hospital ?? null,
        reason: values.reason ?? null,
        diagnosis: values.diagnosis ?? null,
        changes_made: values.changes_made ?? null,
        tests_ordered: values.tests_ordered ?? null,
        next_visit_date: values.next_visit_date ?? null,
        notes: values.notes ?? null,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return {
    visits: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    logVisit,
  }
}

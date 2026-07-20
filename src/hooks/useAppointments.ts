import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface AppointmentFormValues {
  scheduled_at: string
  reason?: string | null
  location?: string | null
  doctor_id?: string | null
  status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
}

export function useAppointments(patientId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['appointments', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, scheduled_at, reason, location, status, doctor_id')
        .eq('patient_id', patientId as string)
        .order('scheduled_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['appointments', patientId] })

  const createAppointment = useMutation({
    mutationFn: async (values: AppointmentFormValues) => {
      const { error } = await supabase.from('appointments').insert({
        patient_id: patientId as string,
        scheduled_at: values.scheduled_at,
        reason: values.reason ?? null,
        location: values.location ?? null,
        doctor_id: values.doctor_id ?? null,
        status: 'scheduled',
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const updateAppointment = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<AppointmentFormValues> }) => {
      const { error } = await supabase.from('appointments').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return {
    appointments: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  }
}

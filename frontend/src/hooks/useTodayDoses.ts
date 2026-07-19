import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type { DoseStatus } from '@/types/database'

export interface TodayDose {
  id: string
  medicine_id: string
  scheduled_time: string
  status: DoseStatus
  skipped_reason: string | null
  medicine?: {
    id: string
    name: string
    dose: string | null
    strength: string | null
    food_instruction: string | null
  }
}

export function useTodayDoses(patientId: string | undefined) {
  const queryClient = useQueryClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const query = useQuery({
    queryKey: ['today-doses', patientId, today],
    enabled: !!patientId,
    queryFn: async () => {
      const { data: meds, error: medsError } = await supabase
        .from('medicines')
        .select('id, name, dose, strength, times, food_instruction')
        .eq('patient_id', patientId as string)
        .eq('is_active', true)
      if (medsError) throw medsError

      const rowsToEnsure = meds.flatMap((m) =>
        m.times.map((t) => ({
          medicine_id: m.id,
          patient_id: patientId as string,
          scheduled_date: today,
          scheduled_time: t,
        }))
      )

      if (rowsToEnsure.length > 0) {
        const { error: upsertError } = await supabase
          .from('dose_logs')
          .upsert(rowsToEnsure, { onConflict: 'medicine_id,scheduled_date,scheduled_time', ignoreDuplicates: true })
        if (upsertError) throw upsertError
      }

      const { data: doses, error: dosesError } = await supabase
        .from('dose_logs')
        .select('id, medicine_id, scheduled_time, status, skipped_reason')
        .eq('patient_id', patientId as string)
        .eq('scheduled_date', today)
        .order('scheduled_time')
      if (dosesError) throw dosesError

      const medById = new Map(meds.map((m) => [m.id, m]))
      return doses.map((d) => ({ ...d, medicine: medById.get(d.medicine_id) })) as TodayDose[]
    },
  })

  const markStatus = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: DoseStatus; reason?: string }) => {
      const { error } = await supabase
        .from('dose_logs')
        .update({
          status,
          taken_at: status === 'taken' ? new Date().toISOString() : null,
          skipped_reason: status === 'skipped' ? (reason ?? null) : null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['today-doses', patientId] }),
  })

  return {
    doses: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    markStatus,
  }
}

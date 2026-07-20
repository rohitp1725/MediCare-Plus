import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type { MedicineFormValues } from '@/lib/validation/medicine'

type MedicineRow = Database['public']['Tables']['medicines']['Row']

export function useMedicines(patientId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['medicines', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('patient_id', patientId as string)
        .order('is_active', { ascending: false })
        .order('name')
      if (error) throw error
      return data
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['medicines', patientId] })

  const createMedicine = useMutation({
    mutationFn: async (values: MedicineFormValues) => {
      const { error } = await supabase.from('medicines').insert({
        patient_id: patientId as string,
        name: values.name,
        brand: values.brand || null,
        type: values.type || null,
        strength: values.strength || null,
        frequency: values.frequency || null,
        times: values.times,
        food_instruction: values.food_instruction || null,
        purpose: values.purpose || null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        stock_quantity: values.stock_quantity,
        refill_threshold: values.refill_threshold,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const updateMedicine = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: MedicineFormValues }) => {
      const { error } = await supabase
        .from('medicines')
        .update({
          name: values.name,
          brand: values.brand || null,
          type: values.type || null,
          strength: values.strength || null,
          frequency: values.frequency || null,
          times: values.times,
          food_instruction: values.food_instruction || null,
          purpose: values.purpose || null,
          start_date: values.start_date || null,
          end_date: values.end_date || null,
          stock_quantity: values.stock_quantity,
          refill_threshold: values.refill_threshold,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('medicines').update({ is_active: isActive }).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const deleteMedicine = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('medicines').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return {
    medicines: (query.data ?? []) as MedicineRow[],
    isLoading: query.isLoading,
    isError: query.isError,
    createMedicine,
    updateMedicine,
    toggleActive,
    deleteMedicine,
  }
}

import { z } from 'zod'

export const DOSE_TIMES = [
  { value: '08:00', label: 'Morning', emoji: '🌅' },
  { value: '13:00', label: 'Afternoon', emoji: '☀️' },
  { value: '18:00', label: 'Evening', emoji: '🌇' },
  { value: '21:00', label: 'Night', emoji: '🌙' },
] as const

export const MEDICINE_TYPES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Inhaler', 'Other'] as const

export const FOOD_INSTRUCTIONS = ['No restriction', 'Before food', 'After food', 'With food', 'Empty stomach'] as const

export const medicineSchema = z.object({
  name: z.string().trim().min(2, 'Enter the medicine name'),
  brand: z.string().trim().optional(),
  type: z.string().optional(),
  strength: z.string().trim().optional(),
  frequency: z.string().trim().optional(),
  times: z.array(z.string()).min(1, 'Select at least one time of day'),
  food_instruction: z.string().optional(),
  purpose: z.string().trim().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  stock_quantity: z.number().int().min(0, 'Cannot be negative'),
  refill_threshold: z.number().int().min(0, 'Cannot be negative'),
})
export type MedicineFormValues = z.infer<typeof medicineSchema>

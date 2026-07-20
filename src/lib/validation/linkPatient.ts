import { z } from 'zod'

export const linkPatientSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  relation: z.string().trim().optional(),
})
export type LinkPatientFormValues = z.infer<typeof linkPatientSchema>

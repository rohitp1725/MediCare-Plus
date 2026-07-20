import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { medicineSchema, type MedicineFormValues, DOSE_TIMES, MEDICINE_TYPES, FOOD_INSTRUCTIONS } from '@/lib/validation/medicine'
import type { Database } from '@/types/database'

type MedicineRow = Database['public']['Tables']['medicines']['Row']

interface MedicineFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: MedicineFormValues) => Promise<void>
  isSubmitting: boolean
  editing?: MedicineRow | null
}

const EMPTY_DEFAULTS: MedicineFormValues = {
  name: '',
  brand: '',
  type: 'Tablet',
  strength: '',
  frequency: '',
  times: ['08:00'],
  food_instruction: 'No restriction',
  purpose: '',
  start_date: '',
  end_date: '',
  stock_quantity: 30,
  refill_threshold: 5,
}

export function MedicineFormModal({ open, onClose, onSubmit, isSubmitting, editing }: MedicineFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<MedicineFormValues>({ resolver: zodResolver(medicineSchema), defaultValues: EMPTY_DEFAULTS })

  useEffect(() => {
    if (!open) return
    if (editing) {
      reset({
        name: editing.name,
        brand: editing.brand ?? '',
        type: editing.type ?? 'Tablet',
        strength: editing.strength ?? '',
        frequency: editing.frequency ?? '',
        times: editing.times.length > 0 ? editing.times : ['08:00'],
        food_instruction: editing.food_instruction ?? 'No restriction',
        purpose: editing.purpose ?? '',
        start_date: editing.start_date ?? '',
        end_date: editing.end_date ?? '',
        stock_quantity: editing.stock_quantity,
        refill_threshold: editing.refill_threshold,
      })
    } else {
      reset(EMPTY_DEFAULTS)
    }
  }, [open, editing, reset])

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Medicine' : 'Add Medicine'} maxWidth={560}>
      <form
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values)
        })}
        noValidate
        className="space-y-4"
      >
        <Input label="Medicine Name" placeholder="e.g. Metformin" error={errors.name?.message} {...register('name')} />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Brand (optional)" placeholder="e.g. Glycomet" {...register('brand')} />
          <Select label="Type" {...register('type')}>
            {MEDICINE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Strength (optional)" placeholder="e.g. 500mg" {...register('strength')} />
          <Input label="Frequency (optional)" placeholder="e.g. Twice daily" {...register('frequency')} />
        </div>

        <Controller
          name="times"
          control={control}
          render={({ field }) => (
            <div>
              <span className="text-[13px] font-medium text-slate block mb-1.5">Time of Day</span>
              <div className="grid grid-cols-4 gap-2">
                {DOSE_TIMES.map((t) => {
                  const active = field.value.includes(t.value)
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() =>
                        field.onChange(
                          active ? field.value.filter((v) => v !== t.value) : [...field.value, t.value].sort()
                        )
                      }
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-sm border text-xs font-medium transition-colors ${
                        active ? 'bg-sage text-white border-sage' : 'bg-paper text-slate-light border-border hover:border-sage'
                      }`}
                    >
                      <span className="text-base">{t.emoji}</span>
                      {t.label}
                    </button>
                  )
                })}
              </div>
              {errors.times && <span className="text-xs text-rose mt-1 block">{errors.times.message}</span>}
            </div>
          )}
        />

        <Select label="Food Instruction" {...register('food_instruction')}>
          {FOOD_INSTRUCTIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>

        <Input label="Purpose (optional)" placeholder="e.g. Blood sugar control" {...register('purpose')} />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Date (optional)" type="date" {...register('start_date')} />
          <Input label="End Date (optional)" type="date" {...register('end_date')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Current Stock"
            type="number"
            min={0}
            error={errors.stock_quantity?.message}
            {...register('stock_quantity', { valueAsNumber: true })}
          />
          <Input
            label="Refill Alert Below"
            type="number"
            min={0}
            error={errors.refill_threshold?.message}
            {...register('refill_threshold', { valueAsNumber: true })}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>
            {editing ? 'Save Changes' : 'Add Medicine'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

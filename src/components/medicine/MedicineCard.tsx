import type { ReactNode } from 'react'
import { formatTime12h } from '@/lib/formatTime'
import type { Database } from '@/types/database'

type MedicineRow = Database['public']['Tables']['medicines']['Row']

export function MedicineCard({ medicine, actions }: { medicine: MedicineRow; actions?: ReactNode }) {
  const lowStock = medicine.is_active && medicine.stock_quantity <= medicine.refill_threshold

  return (
    <div
      className={`border rounded-md p-4 flex items-start gap-4 ${
        medicine.is_active ? 'border-border bg-paper' : 'border-border bg-cream opacity-70'
      }`}
    >
      <div className="text-2xl shrink-0">💊</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-semibold text-ink">{medicine.name}</h4>
          {medicine.strength && <span className="text-xs text-slate-light">{medicine.strength}</span>}
          {!medicine.is_active && (
            <span className="text-[10px] uppercase tracking-wide bg-border text-slate-light px-1.5 py-0.5 rounded-full">
              Inactive
            </span>
          )}
          {lowStock && (
            <span className="text-[10px] uppercase tracking-wide bg-amber/15 text-[#8B5000] px-1.5 py-0.5 rounded-full">
              Low stock
            </span>
          )}
        </div>
        <p className="text-xs text-slate-light mt-1.5">
          {medicine.times.map(formatTime12h).join(' · ')}
          {medicine.food_instruction ? ` · ${medicine.food_instruction}` : ''}
        </p>
        {medicine.purpose && <p className="text-xs text-slate-light mt-1">For {medicine.purpose}</p>}
        <p className="text-xs text-slate-light mt-1">
          Stock: {medicine.stock_quantity} {medicine.frequency ? `· ${medicine.frequency}` : ''}
        </p>
      </div>
      {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
    </div>
  )
}

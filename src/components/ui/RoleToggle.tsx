import { motion } from 'framer-motion'
import type { RoleType } from '@/types'

const ROLES: { value: RoleType; label: string; emoji: string }[] = [
  { value: 'patient', label: 'Patient', emoji: '👴' },
  { value: 'caregiver', label: 'Caregiver', emoji: '👩‍⚕️' },
  { value: 'doctor', label: 'Doctor', emoji: '🩺' },
]

export function RoleToggle({ value, onChange }: { value: RoleType; onChange: (role: RoleType) => void }) {
  return (
    <div className="flex bg-cream rounded-sm p-1 border border-border gap-1">
      {ROLES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-[8px] text-[13px] font-medium transition-colors ${
            value === r.value ? 'text-white' : 'text-slate-light hover:text-slate'
          }`}
        >
          {value === r.value && (
            <motion.span
              layoutId="role-toggle-pill"
              className="absolute inset-0 bg-sage rounded-[8px]"
              transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
            />
          )}
          <span className="relative z-10">{r.emoji}</span>
          <span className="relative z-10">{r.label}</span>
        </button>
      ))}
    </div>
  )
}

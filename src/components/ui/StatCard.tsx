import type { ReactNode } from 'react'

type Accent = 'sage' | 'amber' | 'rose' | 'lavender'

const ACCENT_BG: Record<Accent, string> = {
  sage: 'bg-sage',
  amber: 'bg-amber',
  rose: 'bg-rose',
  lavender: 'bg-lavender',
}

interface StatCardProps {
  icon: ReactNode
  value: string | number
  label: string
  sub?: string
  accent?: Accent
}

export function StatCard({ icon, value, label, sub, accent = 'sage' }: StatCardProps) {
  return (
    <div className="relative overflow-hidden bg-paper border border-border rounded-md p-[22px] flex flex-col gap-2">
      <span className={`absolute top-0 left-0 right-0 h-[3px] ${ACCENT_BG[accent]}`} />
      <div className="text-[26px] leading-none">{icon}</div>
      <div className="font-display text-[28px] font-bold text-ink">{value}</div>
      <div className="text-xs text-slate-light font-medium tracking-wide">{label}</div>
      {sub && <div className="text-xs text-slate-light">{sub}</div>}
    </div>
  )
}

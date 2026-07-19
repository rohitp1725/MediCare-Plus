type BadgeVariant = 'sage' | 'rose' | 'amber' | 'lavender' | 'slate' | 'blue'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  sage: 'bg-sage/12 text-sage-dark',
  rose: 'bg-rose/12 text-rose',
  amber: 'bg-amber/12 text-[#8B5000]',
  lavender: 'bg-lavender/12 text-lavender',
  slate: 'bg-slate-lighter/30 text-slate',
  blue: 'bg-[#EBF5FF] text-[#1A6DB5]',
}

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  dot?: boolean
  className?: string
}

export function Badge({ label, variant = 'slate', dot = false, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
        VARIANT_CLASSES[variant]
      } ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'sage' ? 'bg-sage' :
          variant === 'rose' ? 'bg-rose' :
          variant === 'amber' ? 'bg-amber' :
          variant === 'lavender' ? 'bg-lavender' :
          variant === 'blue' ? 'bg-[#1A6DB5]' :
          'bg-slate-light'
        }`} />
      )}
      {label}
    </span>
  )
}

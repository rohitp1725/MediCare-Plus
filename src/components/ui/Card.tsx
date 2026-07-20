import type { ReactNode } from 'react'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`bg-paper border border-border rounded-md shadow-sm ${className ?? ''}`}>{children}</div>
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between gap-3">
      <div>
        <h3 className="text-[17px] text-ink">{title}</h3>
        {subtitle && <p className="text-xs text-slate-light mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 ${className ?? ''}`}>{children}</div>
}

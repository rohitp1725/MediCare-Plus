import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-6">
      <div className="text-5xl mb-4 leading-none">{icon}</div>
      <h3 className="text-lg text-ink mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-light max-w-[320px] mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

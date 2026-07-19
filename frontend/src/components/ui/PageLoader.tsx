import { Spinner } from './Spinner'

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-cream text-slate">
      <Spinner size={28} className="text-sage" />
      <p className="text-sm text-slate-light">{label}</p>
    </div>
  )
}
